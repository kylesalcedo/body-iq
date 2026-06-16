#!/usr/bin/env tsx
/**
 * Coaching-cue quality audit. Read-only — does not modify the DB or interact
 * with the prompt-gaps flow. Run on demand: `pnpm cue:audit`.
 *
 * Heuristic classification of every Cue against motor-learning best practice
 * (Wulf 2013, 2016 — external focus of attention generally produces better
 * motor learning and performance than internal focus). A balanced cue set
 * for an exercise looks like:
 *
 *   1 internal (mechanism / what to feel)
 *   2 external (task / outcome / object)
 *   1 tactile or imagery (cleanup / consolidation)
 *
 * Output: `prompts/.cue-audit.md`
 */

import { prisma } from "../src/lib/prisma";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

type FocusType =
  | "internal"
  | "external"
  | "tactile"
  | "imagery"
  | "instruction";

const INTERNAL_PATTERNS = [
  /\bsqueeze\b/i,
  /\bengage\b/i,
  /\btighten\b/i,
  /\bactivate\b/i,
  /\bcontract\b/i,
  /\bfeel (your|the)\b/i,
  /\byour (glute|abs|core|muscle|hip|shoulder|neck|chin|elbow|wrist|ankle|knee|back|spine|pelvis|scap)/i,
  /\btuck your\b/i,
  /\bbreathe (in|out|normally)\b/i,
];

const EXTERNAL_PATTERNS = [
  /\bpush\s+(the|away|toward)\b/i,
  /\bdrive\b/i,
  /\bpress\s+(the|into|toward|down|up)\b/i,
  /\breach (toward|for|to|across)\b/i,
  /\bpull (the|toward|the bar|the band)\b/i,
  /\btoward (the wall|the ceiling|the floor|the bar|the bench)\b/i,
  /\bagainst the (wall|floor|ceiling|band|table|surface)\b/i,
  /\binto the (wall|floor|ball|table|surface)\b/i,
  /\btoward your\b/i, // borderline — kept external because it implies a target
];

const IMAGERY_PATTERNS = [
  /\b(as if|imagine|like (a|you)|think of|pretend)\b/i,
  /\bstring (pulling|attached)/i,
];

const INSTRUCTION_PATTERNS = [
  /^\s*(anchor|position|set up|place (the|your|a)|rest (the|your)|cycle (all|through)|progress (when|to|load)|hold .* for \d+ (seconds?|minutes?|reps?)|repeat \d+|perform \d+)/i,
  /\bequipment\b/i,
  /\bevery 1[-–]2 weeks\b/i,
];

// Focus values the cue-rewrite importer stores on Cue.focus. When present we
// trust them over the text heuristic.
const STORED_FOCUS = new Set(["internal", "external", "tactile", "imagery"]);

function classify(text: string, cueType: string | null): FocusType {
  if (cueType === "tactile") return "tactile";
  if (cueType === "imagery") return "imagery";
  if (INSTRUCTION_PATTERNS.some((re) => re.test(text))) return "instruction";
  if (IMAGERY_PATTERNS.some((re) => re.test(text))) return "imagery";
  if (EXTERNAL_PATTERNS.some((re) => re.test(text))) return "external";
  if (INTERNAL_PATTERNS.some((re) => re.test(text))) return "internal";
  // Default: anything not matching pattern is treated as internal — most
  // unmatched cues in our sample are internal-focus prose.
  return "internal";
}

interface ExerciseAudit {
  slug: string;
  name: string;
  totalCues: number;
  counts: Record<FocusType, number>;
  cues: { text: string; cueType: string | null; focus: FocusType }[];
  reviewed: boolean;
  problems: string[];
}

function diagnose(audit: ExerciseAudit): string[] {
  const p: string[] = [];
  const c = audit.counts;

  if (audit.totalCues === 0) {
    p.push("**no cues at all**");
    return p;
  }
  if (c.external === 0) p.push("0 external-focus cues (Wulf evidence favors external)");
  if (c.internal > c.external + c.imagery + c.tactile) {
    p.push("internal-focus dominant (better mix: 1 internal → 2 external → 1 tactile/imagery)");
  }
  if (c.tactile === 0 && c.imagery === 0) {
    p.push("no tactile or imagery cue (consolidation cue missing)");
  }
  if (c.instruction >= 2) {
    p.push(`${c.instruction} setup instructions disguised as cues — move to description/dosing`);
  }
  if (audit.totalCues < 3) p.push(`only ${audit.totalCues} cue${audit.totalCues === 1 ? "" : "s"} (target 3–5)`);
  if (audit.totalCues > 6) p.push(`${audit.totalCues} cues (over-cueing — target 3–5)`);

  return p;
}

async function main() {
  console.log("🔍 Auditing coaching cues for motor-learning best-practice alignment...\n");

  const exercises = await prisma.exercise.findMany({
    select: {
      slug: true,
      name: true,
      cues: {
        select: { text: true, cueType: true, focus: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const audits: ExerciseAudit[] = exercises.map((ex) => {
    const counts: Record<FocusType, number> = {
      internal: 0,
      external: 0,
      tactile: 0,
      imagery: 0,
      instruction: 0,
    };
    let reviewed = false;
    const cues = ex.cues.map((c) => {
      // Prefer the stored Wulf focus (set by the cue-rewrite importer); fall
      // back to the text heuristic for cues that predate it.
      const focus =
        c.focus && STORED_FOCUS.has(c.focus)
          ? (c.focus as FocusType)
          : classify(c.text, c.cueType);
      if (c.focus && STORED_FOCUS.has(c.focus)) reviewed = true;
      counts[focus] += 1;
      return { text: c.text, cueType: c.cueType, focus };
    });
    const audit: ExerciseAudit = {
      slug: ex.slug,
      name: ex.name,
      totalCues: cues.length,
      counts,
      cues,
      reviewed,
      problems: [],
    };
    audit.problems = diagnose(audit);
    return audit;
  });

  // ─── Aggregates ────────────────────────────────────────────────────────────
  const total = audits.length;
  const reviewed = audits.filter((a) => a.reviewed).length;
  const flagged = audits.filter((a) => a.problems.length > 0);
  const flaggedReviewed = flagged.filter((a) => a.reviewed).length;
  const noExternal = audits.filter((a) => a.counts.external === 0 && a.totalCues > 0).length;
  const noTactile = audits.filter(
    (a) => a.counts.tactile === 0 && a.counts.imagery === 0 && a.totalCues > 0,
  ).length;
  const internalDominant = audits.filter(
    (a) => a.counts.internal > a.counts.external + a.counts.imagery + a.counts.tactile,
  ).length;

  // ─── Report ────────────────────────────────────────────────────────────────
  const lines: string[] = [
    "# Coaching-Cue Quality Audit",
    "",
    `_Generated ${new Date().toISOString().slice(0, 10)} — ${total} exercises_`,
    "",
    "## Summary",
    "",
    `- Exercises with literature-reviewed (focus-tagged) cues: **${reviewed} / ${total}**`,
    `- Exercises flagged with at least one problem: **${flagged.length} / ${total}** (${flaggedReviewed} of them literature-reviewed)`,
    `- Exercises with zero external-focus cues: **${noExternal}**`,
    `- Exercises with no tactile or imagery cue: **${noTactile}**`,
    `- Exercises where internal-focus dominates: **${internalDominant}**`,
    "",
    "Reference: Wulf G. *Attentional focus and motor learning: a review of 15 years.* Int Rev Sport Exerc Psychol. 2013. External focus of attention generally produces better motor learning and performance than internal focus.",
    "",
    "## Flagged exercises",
    "",
  ];

  if (flagged.length === 0) {
    lines.push("_No issues found._");
  } else {
    flagged.sort(
      (a, b) =>
        b.problems.length - a.problems.length ||
        b.counts.internal - a.counts.internal,
    );
    for (const a of flagged) {
      lines.push(`### [${a.slug}] ${a.name}${a.reviewed ? " · 📚 literature-reviewed" : ""}`);
      lines.push("");
      lines.push(
        `Counts — internal: ${a.counts.internal}, external: ${a.counts.external}, tactile: ${a.counts.tactile}, imagery: ${a.counts.imagery}, instruction: ${a.counts.instruction}`,
      );
      lines.push("");
      for (const p of a.problems) lines.push(`- ⚠ ${p}`);
      lines.push("");
      lines.push("Current cues:");
      lines.push("");
      for (const c of a.cues) {
        lines.push(`- _${c.focus}_ — ${c.text}`);
      }
      lines.push("");
    }
  }

  const outDir = join(process.cwd(), "prompts");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, ".cue-audit.md"), lines.join("\n"));

  console.log(`✅ Cue audit: prompts/.cue-audit.md`);
  console.log(`   Total exercises:                  ${total}`);
  console.log(`   Literature-reviewed (focus-tagged): ${reviewed}`);
  console.log(`   Flagged with at least 1 problem:  ${flagged.length}  (${flaggedReviewed} reviewed)`);
  console.log(`   No external-focus cues:           ${noExternal}`);
  console.log(`   No tactile/imagery cue:           ${noTactile}`);
  console.log(`   Internal-focus dominant:          ${internalDominant}`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Cue audit failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
