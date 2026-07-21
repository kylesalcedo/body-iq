#!/usr/bin/env tsx
/**
 * Fetch authoritative SNOMED CT body-structure codes for muscles and joints from
 * a public FHIR terminology server (CSIRO Ontoserver), so codes are VERIFIED
 * against the real terminology rather than generated from memory (which
 * hallucinates plausible-but-wrong IDs).
 *
 * For each entity it queries the SNOMED value set with a text filter, scores the
 * candidates, and picks the best "Structure of <X> muscle/joint" concept. Writes
 * candidates to prisma/seed/extensions/snomed-body-structures-2026-07.json for
 * review; a companion seed extension loads them as EntityCode rows (needs_review
 * — a human still eyeballs the match, but the ID itself is real).
 *
 * Usage: tsx scripts/fetch-snomed-codes.ts [--muscles] [--joints]  (default both)
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const TX = "https://r4.ontoserver.csiro.au/fhir/ValueSet/$expand";
const SNOMED = "http://snomed.info/sct";
const p = new PrismaClient();
const args = new Set(process.argv.slice(2));
const doMuscles = args.has("--muscles") || (!args.has("--muscles") && !args.has("--joints"));
const doJoints = args.has("--joints") || (!args.has("--muscles") && !args.has("--joints"));

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set(["structure", "of", "muscle", "joint", "the", "and"]);
const sig = (s: string) => norm(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w));

// ECL roots constrain results to the correct body-structure hierarchy, so
// procedures/findings/laterality-variants can never match.
const ECL = { muscle: "<<127954009", joint: "<<39352004" }; // Skeletal muscle structure / Joint structure

async function expand(filter: string, kind: "muscle" | "joint", count = 10): Promise<{ code: string; display: string }[]> {
  const vs = `${SNOMED}?fhir_vs=ecl/${ECL[kind]}`;
  const url = `${TX}?url=${encodeURIComponent(vs)}&filter=${encodeURIComponent(filter)}&count=${count}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/fhir+json" }, signal: AbortSignal.timeout(25000) });
      if (!res.ok) { await new Promise((r) => setTimeout(r, 800)); continue; }
      const json: any = await res.json();
      return (json.expansion?.contains ?? []).map((c: any) => ({ code: c.code, display: c.display || "" }));
    } catch { await new Promise((r) => setTimeout(r, 800)); }
  }
  return [];
}

// Score a candidate: reward covering the entity name; heavily penalize any
// EXTRA descriptive word (ligament, disc, collateral, part, facet, tendon…),
// which is what distinguishes the plain "Structure of X joint/muscle" concept
// from its sub-structures.
const FRAME = new Set(["structure", "of", "the", "and", "muscle", "joint", "entire"]);
function score(entityName: string, kind: "muscle" | "joint", cand: { display: string }): number {
  const d = norm(cand.display);
  const dWords = d.split(" ");
  const want = sig(entityName);
  const have = new Set(dWords);
  const overlap = want.filter((w) => have.has(w)).length;
  if (overlap < Math.max(1, Math.ceil(want.length * 0.6))) return -1; // must cover the name

  const wantSet = new Set(want);
  const extras = dWords.filter((w) => !wantSet.has(w) && !FRAME.has(w)); // descriptive words not in the entity name

  let s = overlap * 10;
  if (d.startsWith("structure of")) s += 10; // prefer generic "Structure of X"
  else if (d.startsWith("entire")) s += 4;   // "Entire X" is an acceptable fallback
  if (kind === "muscle" && have.has("muscle")) s += 4;
  if (kind === "joint" && have.has("joint")) s += 4;
  s -= extras.length * 9; // each extra descriptive word = a sub-structure → strong penalty
  return s;
}

// Regional subdivisions and group names that SNOMED indexes under a parent
// concept — map to the parent's search term so the server resolves a real code.
// (A subdivision is genuinely *within* its parent structure, so this is honest.)
const ALIAS: Record<string, string> = {
  "trapezius-upper": "trapezius", "trapezius-middle": "trapezius", "trapezius-lower": "trapezius", "upper-trapezius": "trapezius",
  "anterior-deltoid": "deltoid", "middle-deltoid": "deltoid", "posterior-deltoid": "deltoid",
  "internal-oblique": "obliquus internus abdominis", "external-oblique": "obliquus externus abdominis",
  "external-intercostals": "external intercostal", "internal-intercostals": "internal intercostal",
  "anconeus": "anconeus", "lumbricals": "lumbrical muscle of hand", "palmar-interossei": "palmar interosseous",
  "rotatores-thoracis": "thoracic rotator", "scalenes": "scalenus", "suboccipitals": "suboccipital",
  // joints whose model name differs from the SNOMED preferred term
  "tibiofemoral": "femorotibial joint", "talocrural": "ankle joint",
  "costovertebral": "costovertebral joint", "scapulothoracic": "scapulothoracic joint",
};

async function codeFor(slug: string, name: string, kind: "muscle" | "joint") {
  const term = ALIAS[slug] ?? name;
  const queries = kind === "muscle"
    ? [`structure of ${term} muscle`, `${term} muscle structure`, `${term} muscle`, term]
    : [`structure of ${term}`, `${term} structure`, `${term}`];
  let best: { code: string; display: string; score: number } | null = null;
  for (const q of queries) {
    const cands = await expand(q, kind);
    for (const c of cands) {
      const sc = score(term, kind, c); // score against the (aliased) search term, not the raw entity name
      if (sc > 0 && (!best || sc > best.score)) best = { ...c, score: sc };
    }
    if (best && best.score >= 20) break; // confident enough, stop querying
  }
  return best;
}

async function main() {
  const out: any[] = [];
  const report = { muscles: { coded: 0, missed: [] as string[] }, joints: { coded: 0, missed: [] as string[] } };

  if (doMuscles) {
    const muscles = await p.muscle.findMany({ select: { slug: true, name: true }, orderBy: { slug: "asc" } });
    for (const m of muscles) {
      const hit = await codeFor(m.slug, m.name, "muscle");
      if (hit) { out.push({ entityType: "muscle", slug: m.slug, name: m.name, system: SNOMED, code: hit.code, display: hit.display, score: hit.score }); report.muscles.coded++; }
      else report.muscles.missed.push(m.slug);
      process.stdout.write(".");
    }
    process.stdout.write("\n");
  }
  if (doJoints) {
    const joints = await p.joint.findMany({ select: { slug: true, name: true }, orderBy: { slug: "asc" } });
    for (const j of joints) {
      // strip parenthetical qualifiers like "Hip Joint (Coxofemoral)"
      const clean = j.name.replace(/\([^)]*\)/g, "").trim();
      const hit = (await codeFor(j.slug, clean, "joint")) || (await codeFor(j.slug, j.name.replace(/[()]/g, " "), "joint"));
      if (hit) { out.push({ entityType: "joint", slug: j.slug, name: j.name, system: SNOMED, code: hit.code, display: hit.display, score: hit.score }); report.joints.coded++; }
      else report.joints.missed.push(j.slug);
      process.stdout.write(".");
    }
    process.stdout.write("\n");
  }

  const file = join(process.cwd(), "prisma", "seed", "extensions", "snomed-body-structures-2026-07.json");
  writeFileSync(file, JSON.stringify(out, null, 1));
  console.log(`\nWrote ${out.length} verified codes → ${file}`);
  if (doMuscles) console.log(`  muscles: ${report.muscles.coded} coded, ${report.muscles.missed.length} missed${report.muscles.missed.length ? ": " + report.muscles.missed.join(", ") : ""}`);
  if (doJoints) console.log(`  joints:  ${report.joints.coded} coded, ${report.joints.missed.length} missed${report.joints.missed.length ? ": " + report.joints.missed.join(", ") : ""}`);
  console.log(`  Review the JSON, then load with the snomed-body-structures seed extension.`);
}

main().finally(() => p.$disconnect());
