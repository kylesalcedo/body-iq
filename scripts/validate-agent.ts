#!/usr/bin/env tsx
/**
 * validate-agent.ts — human-in-the-loop validation assistant.
 *
 * Reviews entities sitting in the validation queue (draft / needs_review /
 * low-confidence) against the project's confidence rubric (CONTRIBUTING.md) and
 * their linked research sources, using the Claude API. It produces a
 * REPORT ONLY — it never mutates the database. A human decides what to accept.
 * This is deliberate: "validation-first" means an LLM can *suggest* a
 * confidence/status, but promoting an entity stays a human judgement.
 *
 * See wiki/decisions/2026-07-04-validator-agent.md for the rationale.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... pnpm validate:agent                 # 10 exercises
 *   ANTHROPIC_API_KEY=... pnpm validate:agent -- --type muscle --limit 20
 *   pnpm validate:agent -- --dry-run                          # list, no API calls
 *
 * Flags:
 *   --type <exercise|muscle|movement>   entity type to review (default exercise)
 *   --limit <n>                         max entities (default 10)
 *   --dry-run                           list candidates only; no API calls
 *
 * Output: private/validation-agent/<type>-<timestamp>.md (gitignored).
 */

import { prisma } from "../src/lib/prisma";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const MODEL = "claude-opus-4-8";
const OUT_DIR = join(process.cwd(), "private", "validation-agent");

// ─── The confidence rubric (mirror of CONTRIBUTING.md, given to the model) ────
const RUBRIC = `Confidence scoring rubric (0.0–1.0):
- 0.95  Verified by multiple high-quality sources (systematic / Cochrane reviews)
- 0.90  Supported by at least one RCT or an established textbook
- 0.85  Supported by observational studies or expert consensus
- 0.80  Anatomical / biomechanical reasoning, limited direct evidence
- <0.80 Needs review — flag for evidence gathering
Rule: when unsure, score LOW rather than guessing. Never invent citations.
Status ladder: draft -> needs_review -> reviewed -> verified (or disputed).`;

type Args = { type: string; limit: number; dryRun: boolean };

function parseArgs(argv: string[]): Args {
  const a: Args = { type: "exercise", limit: 10, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--type") a.type = argv[++i];
    else if (argv[i] === "--limit") a.limit = parseInt(argv[++i], 10) || 10;
    else if (argv[i] === "--dry-run") a.dryRun = true;
  }
  return a;
}

/** Common "needs a look" filter: draft, needs_review, or confidence < 0.6. */
const NEEDS_REVIEW = {
  OR: [
    { status: "draft" as const },
    { status: "needs_review" as const },
    { confidence: { lt: 0.6 } },
  ],
};

type Candidate = {
  type: string;
  slug: string;
  name: string;
  status: string;
  confidence: number;
  /** Compact, human-readable dump of the entity + its evidence for the prompt. */
  context: string;
};

async function fetchCandidates(type: string, limit: number): Promise<Candidate[]> {
  if (type === "exercise") {
    const rows = await prisma.exercise.findMany({
      where: NEEDS_REVIEW,
      orderBy: [{ confidence: "asc" }, { name: "asc" }],
      take: limit,
      include: {
        muscles: { include: { muscle: { select: { name: true } } } },
        movements: { include: { movement: { select: { name: true } } } },
        sources: { include: { source: true } },
      },
    });
    return rows.map((e) => ({
      type,
      slug: e.slug,
      name: e.name,
      status: e.status,
      confidence: e.confidence,
      context: [
        `Name: ${e.name}`,
        `Description: ${e.description}`,
        `Dosing: ${e.dosing ?? "—"}`,
        `Evidence level: ${e.evidenceLevel ?? "—"}`,
        `EMG notes: ${e.emgNotes ?? "—"}`,
        `Editorial notes: ${e.notes ?? "—"}`,
        `Muscles: ${e.muscles.map((m) => `${m.muscle.name} (${m.role})`).join(", ") || "none"}`,
        `Movements: ${e.movements.map((m) => m.movement.name).join(", ") || "none"}`,
        `Sources (${e.sources.length}): ${e.sources
          .map((s) => `${s.source.title}${s.source.year ? ` (${s.source.year})` : ""}${s.source.doi ? ` doi:${s.source.doi}` : ""}`)
          .join(" | ") || "none"}`,
      ].join("\n"),
    }));
  }

  if (type === "muscle") {
    const rows = await prisma.muscle.findMany({
      where: NEEDS_REVIEW,
      orderBy: [{ confidence: "asc" }, { name: "asc" }],
      take: limit,
      include: { sources: { include: { source: true } } },
    });
    return rows.map((m) => ({
      type,
      slug: m.slug,
      name: m.name,
      status: m.status,
      confidence: m.confidence,
      context: [
        `Name: ${m.name}`,
        `Origin: ${m.origin}`,
        `Insertion: ${m.insertion}`,
        `Action: ${m.action}`,
        `Innervation: ${m.innervation}`,
        `Blood supply: ${m.bloodSupply}`,
        `Editorial notes: ${m.notes ?? "—"}`,
        `Sources (${m.sources.length}): ${m.sources.map((s) => s.source.title).join(" | ") || "none"}`,
      ].join("\n"),
    }));
  }

  if (type === "movement") {
    const rows = await prisma.movement.findMany({
      where: NEEDS_REVIEW,
      orderBy: [{ confidence: "asc" }, { name: "asc" }],
      take: limit,
      include: { sources: { include: { source: true } } },
    });
    return rows.map((m) => ({
      type,
      slug: m.slug,
      name: m.name,
      status: m.status,
      confidence: m.confidence,
      context: [
        `Name: ${m.name}`,
        `Description: ${m.description ?? "—"}`,
        `Plane/axis: ${m.plane ?? "—"} / ${m.axis ?? "—"}`,
        `ROM: AROM ${m.aromMin ?? "?"}–${m.aromMax ?? "?"}, PROM ${m.promMin ?? "?"}–${m.promMax ?? "?"} ${m.romUnit ?? ""} (${m.romSource ?? "no source"})`,
        `Editorial notes: ${m.notes ?? "—"}`,
        `Sources (${m.sources.length}): ${m.sources.map((s) => s.source.title).join(" | ") || "none"}`,
      ].join("\n"),
    }));
  }

  throw new Error(`Unsupported --type "${type}". Use exercise | muscle | movement.`);
}

// ─── Structured review shape ──────────────────────────────────────────────────
type Review = {
  suggestedConfidence: number;
  suggestedStatus: "draft" | "needs_review" | "reviewed" | "verified" | "disputed";
  rationale: string;
  concerns: string[];
};

const REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestedConfidence: { type: "number" },
    suggestedStatus: {
      type: "string",
      enum: ["draft", "needs_review", "reviewed", "verified", "disputed"],
    },
    rationale: { type: "string" },
    concerns: { type: "array", items: { type: "string" } },
  },
  required: ["suggestedConfidence", "suggestedStatus", "rationale", "concerns"],
} as const;

async function reviewOne(
  client: any,
  c: Candidate
): Promise<Review | { error: string }> {
  const system = `You are a physical-therapy evidence reviewer for the Body IQ knowledge graph.
Assess the entity below strictly against its OWN linked sources and established anatomy/biomechanics.
${RUBRIC}
Be conservative: if the evidence shown does not justify a claim, say so in "concerns" and keep confidence low.
Do NOT invent sources. Judge only what is provided.`;

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: REVIEW_SCHEMA },
      },
      system,
      messages: [
        {
          role: "user",
          content: `Current status: ${c.status}\nCurrent confidence: ${c.confidence}\n\n${c.context}`,
        },
      ],
    });
    const text = res.content.find((b: any) => b.type === "text")?.text ?? "";
    return JSON.parse(text) as Review;
  } catch (err: any) {
    return { error: err?.message ?? String(err) };
  }
}

function fmtReport(type: string, results: { c: Candidate; r: Review | { error: string } }[]): string {
  const lines: string[] = [
    `# Validation-agent report — ${type}`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Model: ${MODEL} · reviewed ${results.length} entities`,
    ``,
    `> Suggestions only. Nothing was written to the database. A human decides`,
    `> what to accept. Deltas below compare the model's suggestion to the`,
    `> current stored value.`,
    ``,
    `| Entity | Current | Suggested | Δconf | Suggested status | Concerns |`,
    `|---|---|---|---|---|---|`,
  ];
  for (const { c, r } of results) {
    if ("error" in r) {
      lines.push(`| ${c.name} | ${c.confidence} / ${c.status} | — | — | ERROR | ${r.error} |`);
      continue;
    }
    const delta = (r.suggestedConfidence - c.confidence).toFixed(2);
    const arrow = r.suggestedConfidence > c.confidence ? "↑" : r.suggestedConfidence < c.confidence ? "↓" : "→";
    lines.push(
      `| ${c.name} | ${c.confidence} / ${c.status} | ${r.suggestedConfidence.toFixed(2)} | ${arrow}${delta} | ${r.suggestedStatus} | ${r.concerns.length} |`
    );
  }
  lines.push(``, `---`, ``);
  for (const { c, r } of results) {
    lines.push(`## ${c.name}  \`${c.slug}\``);
    if ("error" in r) {
      lines.push(`**Review failed:** ${r.error}`, ``);
      continue;
    }
    lines.push(
      `- Current: **${c.confidence}** / ${c.status}`,
      `- Suggested: **${r.suggestedConfidence.toFixed(2)}** / ${r.suggestedStatus}`,
      ``,
      `${r.rationale}`,
      ``
    );
    if (r.concerns.length) {
      lines.push(`Concerns:`);
      for (const con of r.concerns) lines.push(`- ${con}`);
      lines.push(``);
    }
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const candidates = await fetchCandidates(args.type, args.limit);

  console.log(`Found ${candidates.length} ${args.type}(s) needing review.`);
  if (candidates.length === 0) {
    await prisma.$disconnect();
    return;
  }

  if (args.dryRun) {
    for (const c of candidates) {
      console.log(`  · ${c.name} (${c.confidence} / ${c.status})`);
    }
    console.log(`\nDry run — no API calls made. Drop --dry-run to review.`);
    await prisma.$disconnect();
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      `\nANTHROPIC_API_KEY is not set. This step calls the Claude API.\n` +
        `Set it and re-run, or use --dry-run to preview candidates without any API call.`
    );
    await prisma.$disconnect();
    process.exit(1);
  }

  // Import lazily so --dry-run works without the SDK installed.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const results: { c: Candidate; r: Review | { error: string } }[] = [];
  for (const c of candidates) {
    process.stdout.write(`  reviewing ${c.name}… `);
    const r = await reviewOne(client, c);
    console.log("error" in r ? "error" : `suggests ${(r as Review).suggestedConfidence.toFixed(2)}`);
    results.push({ c, r });
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outfile = join(OUT_DIR, `${args.type}-${stamp}.md`);
  writeFileSync(outfile, fmtReport(args.type, results), "utf8");
  console.log(`\nReport written to ${outfile}`);
  console.log(`Review it, then update status/confidence by hand or via a seed edit.`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
