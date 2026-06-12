#!/usr/bin/env tsx
/**
 * Generate region-batched OpenEvidence prompts asking for evidence-based cue
 * rewrites across the exercise library, structured Wulf-style:
 *
 *   1 internal (mechanism)  →  2 external (task / outcome / object)  →  1 tactile/imagery
 *
 * Run: `pnpm cue:prompts`
 *
 * Reads the same flagged-exercise list as `pnpm cue:audit` (read-only on DB,
 * no side effects). Emits one prompt per body-region batch to:
 *   prompts/cues-batch-<region>.md
 *
 * The response format is strict so a downstream importer can parse it.
 */

import { prisma } from "../src/lib/prisma";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "prompts");
const MAX_PER_BATCH = 30;

// ─── Region grouping ────────────────────────────────────────────────────────
// Small adjacent regions are merged so each batch is clinically coherent and
// has enough exercises to make the prompt worthwhile.
const REGION_GROUPS: Record<string, string[]> = {
  "cervical-thoracic-spine": ["Cervical Spine", "Thoracic Spine"],
  "shoulder": ["Shoulder"],
  "lumbar-pelvis": ["Lumbar Spine", "Pelvis"],
  "hip": ["Hip"],
  "knee-ankle": ["Knee", "Ankle"],
  "wrist-hand-elbow": ["Wrist", "Hand", "Elbow"],
};

function groupForRegion(region: string): string {
  for (const [group, members] of Object.entries(REGION_GROUPS)) {
    if (members.includes(region)) return group;
  }
  return "other";
}

// ─── Exercise context ──────────────────────────────────────────────────────-

interface ExerciseContext {
  slug: string;
  name: string;
  description: string;
  bodyPosition: string | null;
  primaryMuscles: string[];
  movements: string[];
  region: string; // dominant region from linked movements
  currentCues: { text: string; cueType: string | null }[];
}

async function loadExercises(): Promise<ExerciseContext[]> {
  const rows = await prisma.exercise.findMany({
    select: {
      slug: true,
      name: true,
      description: true,
      bodyPosition: true,
      muscles: {
        where: { role: "primary" },
        select: { muscle: { select: { name: true } } },
      },
      movements: {
        select: {
          movement: {
            select: {
              name: true,
              joint: { select: { region: { select: { name: true } } } },
            },
          },
        },
      },
      cues: {
        select: { text: true, cueType: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((e) => {
    const regionCounts: Record<string, number> = {};
    for (const m of e.movements) {
      const r = m.movement.joint.region.name;
      regionCounts[r] = (regionCounts[r] ?? 0) + 1;
    }
    const region =
      Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "(unlinked)";

    return {
      slug: e.slug,
      name: e.name,
      description: e.description,
      bodyPosition: e.bodyPosition,
      primaryMuscles: e.muscles.map((m) => m.muscle.name),
      movements: e.movements.map((m) => m.movement.name),
      region,
      currentCues: e.cues.map((c) => ({ text: c.text, cueType: c.cueType })),
    };
  });
}

// ─── Prompt template ────────────────────────────────────────────────────────

function promptHeader(groupKey: string, exerciseCount: number): string {
  return `# Evidence-Based Coaching Cue Rewrite — ${groupKey.replace(/-/g, " / ")} (${exerciseCount} exercises)

For each exercise listed below, provide **exactly four coaching cues** structured according to **Wulf's external-focus motor-learning evidence** [Wulf 2013 Int Rev Sport Exerc Psychol; Wulf 2016 Med Sci Sports Exerc; Chua 2021 Psychol Bull meta-analysis]:

1. **One internal-focus cue** establishing the mechanism — what the patient should feel or activate (concise, anatomical).
2. **Two external-focus cues** — direct attention to a task outcome, an object, or the environment (e.g., "drive the floor away," "press into the wall," "reach the cup toward the shelf"). External focus generally produces better motor learning and performance than internal focus.
3. **One tactile or imagery cue** — clinician palpation point, self-palpation, or analogy that consolidates the pattern (e.g., "feel the band stay taut throughout," "as if a string is pulling your sternum to the ceiling").

Cues should be **under 12 words each**, action-oriented, evidence-aligned, and specific to the body region and primary muscle. Do **not** restate setup steps — those belong in the description, not the cues.

## Response format (strict — used for automated import)

For **each exercise**, emit one block in this exact format:

\`\`\`
### <slug> · <Exercise Name>
- **internal** · <cue text>
- **external** · <cue text>
- **external** · <cue text>
- **tactile** · <cue text>
- _citation: <Author Year, Journal, PMID/DOI>_
\`\`\`

Use the original \`<slug>\` exactly as provided. The citation should reference an EMG study, RCT, or motor-learning paper supporting the cueing pattern for that movement family — if no exercise-specific citation exists, cite Wulf 2013 or the most relevant general motor-learning source.

If an exercise has insufficient published evidence to anchor the cues, still provide cues drawn from established motor-learning principles, but mark the citation as \`_citation: Wulf 2013 (general principle — no exercise-specific evidence)_\`.

## Exercises

`;
}

function exerciseBlock(ex: ExerciseContext): string {
  const muscles = ex.primaryMuscles.length
    ? ex.primaryMuscles.join(", ")
    : "(no primary muscle linked)";
  const movements = ex.movements.length
    ? ex.movements.join(", ")
    : "(no movement linked)";
  const cues =
    ex.currentCues.length === 0
      ? "_(no current cues)_"
      : ex.currentCues
          .map((c) => `  - [${c.cueType ?? "verbal"}] ${c.text}`)
          .join("\n");

  return [
    `### \`${ex.slug}\` · ${ex.name}`,
    "",
    `- **Region**: ${ex.region}`,
    `- **Body position**: ${ex.bodyPosition ?? "(unspecified)"}`,
    `- **Primary muscle(s)**: ${muscles}`,
    `- **Movements**: ${movements}`,
    `- **Description**: ${ex.description}`,
    `- **Current cues** (to be replaced):`,
    cues,
    "",
  ].join("\n");
}

// ─── Main ──────────────────────────────────────────────────────────────────-

async function main() {
  console.log("✏️  Generating region-batched cue-rewrite prompts...\n");

  const exercises = await loadExercises();

  // Bucket by region group, then split any bucket >MAX_PER_BATCH alphabetically.
  const buckets = new Map<string, ExerciseContext[]>();
  for (const ex of exercises) {
    const key = groupForRegion(ex.region);
    const arr = buckets.get(key) ?? [];
    arr.push(ex);
    buckets.set(key, arr);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const emitted: { path: string; count: number }[] = [];

  for (const [key, list] of buckets) {
    list.sort((a, b) => a.name.localeCompare(b.name));
    const chunks: ExerciseContext[][] = [];
    for (let i = 0; i < list.length; i += MAX_PER_BATCH) {
      chunks.push(list.slice(i, i + MAX_PER_BATCH));
    }
    for (let i = 0; i < chunks.length; i++) {
      const suffix = chunks.length > 1 ? `-part-${i + 1}` : "";
      const filename = `cues-batch-${key}${suffix}.md`;
      const body =
        promptHeader(key, chunks[i].length) +
        chunks[i].map(exerciseBlock).join("\n");
      const path = join(OUT_DIR, filename);
      writeFileSync(path, body);
      emitted.push({ path, count: chunks[i].length });
    }
  }

  emitted.sort((a, b) => a.path.localeCompare(b.path));

  console.log(`✅ Emitted ${emitted.length} cue-rewrite prompt${emitted.length === 1 ? "" : "s"}:\n`);
  for (const e of emitted) {
    console.log(`   ${e.path.replace(process.cwd() + "/", "")}  (${e.count} exercises)`);
  }
  console.log(`\nTotal exercises covered: ${emitted.reduce((s, e) => s + e.count, 0)}`);
  console.log(
    `\nPaste each prompt into OpenEvidence one at a time. Save responses to research/<filename>-response.md. A separate importer will parse the responses and write a seed extension.`,
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Cue prompt generation failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
