import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma, logSection, logCount } from "../client";

/**
 * Load SNOMED CT body-structure codes for muscles and joints — fetched and
 * VERIFIED against a live FHIR terminology server (scripts/fetch-snomed-codes.ts,
 * CSIRO Ontoserver), never generated from memory. Supersedes the earlier
 * hand-scaffolded joint codes (snomed-codes.ts), which included at least one
 * wrong ID.
 *
 * Codes load as EntityCode rows with status `needs_review`: the concept ID is
 * authoritative, but a human still eyeballs that the chosen concept matches the
 * intended structure (e.g. deltoid subdivisions roll up to the parent deltoid).
 */

const FILE = join(__dirname, "snomed-body-structures-2026-07.json");
const SNOMED = "http://snomed.info/sct";

export async function seedSnomedBodyStructuresExtension() {
  logSection("SNOMED body-structure codes (verified)");
  if (!existsSync(FILE)) { console.log("    (no SNOMED codes JSON — skipping)"); return; }

  const rows: any[] = JSON.parse(readFileSync(FILE, "utf8"));
  const muscleBySlug = new Map((await prisma.muscle.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]));
  const jointBySlug = new Map((await prisma.joint.findMany({ select: { id: true, slug: true } })).map((j) => [j.slug, j.id]));

  // Clear prior SNOMED codes on these entity types so this is the single source of truth.
  await prisma.entityCode.deleteMany({ where: { system: SNOMED, entityType: { in: ["muscle", "joint"] } } });

  let n = 0;
  for (const r of rows) {
    const isMuscle = r.entityType === "muscle";
    const id = (isMuscle ? muscleBySlug : jointBySlug).get(r.slug);
    if (!id) continue;
    await prisma.entityCode.create({
      data: {
        system: SNOMED, code: r.code, display: r.display, entityType: r.entityType,
        status: "needs_review",
        notes: "Verified against CSIRO Ontoserver (r4) — concept ID authoritative; confirm concept matches intended structure.",
        ...(isMuscle ? { muscleId: id } : { jointId: id }),
      },
    });
    n++;
  }
  logCount("SNOMED body-structure codes loaded", n);
}
