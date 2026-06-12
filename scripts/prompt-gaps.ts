#!/usr/bin/env tsx
/**
 * Scan the knowledge graph for coverage gaps and emit:
 *   1. prompts/.gaps-report.md     — human-readable gap audit
 *   2. prompts/auto-<slug>.md      — copy-paste-ready OpenEvidence prompts
 *                                    for the top gaps, following CONVENTIONS.md
 *
 * Run with: pnpm prompts:gaps
 *
 * The prompts/ folder is .gitignored — outputs are for local use only.
 */

import { prisma } from "../src/lib/prisma";
import { writeFileSync, mkdirSync, readdirSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "prompts");
const COMPLETED_DIR = join(OUT_DIR, "completed");
const MAX_AUTO_PROMPTS = 5;

// ─── Gap scans ───────────────────────────────────────────────────────────────

type RegionMovementGap = {
  region: string;
  movement: string;
  movementSlug: string;
  exerciseCount: number;
};

async function findSparseMovements(): Promise<RegionMovementGap[]> {
  // Movements tagged `evidence-gap-accepted` have been reviewed — the sparse
  // exercise count is the intended state (e.g. cervical-protraction is a
  // postural observation, not a training target) and we don't want to re-emit
  // OpenEvidence prompts for them on every scan.
  const rows = await prisma.movement.findMany({
    select: {
      slug: true,
      name: true,
      joint: { select: { region: { select: { name: true, sortOrder: true } } } },
      _count: { select: { exercises: true } },
      tags: { select: { tag: { select: { slug: true } } } },
    },
  });

  return rows
    .filter((r) => !r.tags.some((t) => t.tag.slug === "evidence-gap-accepted"))
    .map((r) => ({
      region: r.joint.region.name,
      movement: r.name,
      movementSlug: r.slug,
      exerciseCount: r._count.exercises,
    }))
    .filter((r) => r.exerciseCount <= 2)
    .sort((a, b) => a.exerciseCount - b.exerciseCount || a.region.localeCompare(b.region));
}

type WeakExercise = {
  slug: string;
  name: string;
  evidenceLevel: string;
  regions: string[];
};

async function findLowEvidenceExercises(): Promise<WeakExercise[]> {
  const rows = await prisma.exercise.findMany({
    where: { evidenceLevel: { in: ["limited", "expert-opinion"] } },
    select: {
      slug: true,
      name: true,
      evidenceLevel: true,
      movements: {
        select: {
          movement: {
            select: { joint: { select: { region: { select: { name: true } } } } },
          },
        },
      },
    },
  });

  return rows.map((e) => ({
    slug: e.slug,
    name: e.name,
    evidenceLevel: e.evidenceLevel ?? "unknown",
    regions: Array.from(
      new Set(e.movements.map((m) => m.movement.joint.region.name))
    ),
  }));
}

type MuscleGap = { slug: string; name: string; asPrimary: number };

async function findUnderrepresentedMuscles(): Promise<MuscleGap[]> {
  const muscles = await prisma.muscle.findMany({
    select: {
      slug: true,
      name: true,
      exercises: { select: { role: true } },
    },
  });

  return muscles
    .map((m) => ({
      slug: m.slug,
      name: m.name,
      asPrimary: m.exercises.filter((e) => e.role === "primary").length,
    }))
    .filter((m) => m.asPrimary <= 1)
    .sort((a, b) => a.asPrimary - b.asPrimary || a.name.localeCompare(b.name));
}

async function findSparseFunctionalTasks() {
  const tasks = await prisma.functionalTask.findMany({
    select: {
      slug: true,
      name: true,
      _count: { select: { exercises: true } },
    },
  });
  return tasks
    .map((t) => ({ slug: t.slug, name: t.name, exerciseCount: t._count.exercises }))
    .filter((t) => t.exerciseCount <= 2)
    .sort((a, b) => a.exerciseCount - b.exerciseCount);
}

// ─── Prompt templates (CONVENTIONS.md compliant — no project references) ─────

function promptForSparseMovement(g: RegionMovementGap): string {
  // Dedupe "Cervical Spine Cervical Retraction" → "Cervical Retraction",
  // "Pelvis Anterior Pelvic Tilt" → "Anterior Pelvic Tilt".
  const regionStem = g.region.split(" ")[0].replace(/s$/, "").toLowerCase();
  const movementHasRegion = g.movement.toLowerCase().includes(regionStem);
  const movement = movementHasRegion ? g.movement : `${g.region} ${g.movement}`;
  const movementLower = movement.toLowerCase();

  return `# Evidence-Based Exercises for ${movement}

Provide **4–6 evidence-based exercises** that train ${movementLower}. Prioritize peer-reviewed support (EMG studies, RCTs, systematic reviews).

For each exercise, provide:

1. **Exercise name** and a 1–2 sentence description
2. **Primary / secondary / stabilizer muscles** with EMG % MVIC where published
3. **Equipment** (bodyweight, dumbbell, band, cable, machine, etc.)
4. **Evidence-based dosing** — sets, reps, frequency, with source
5. **Coaching cues** (2–4 concise cues, mix verbal and tactile)
6. **Regressions and progressions**
7. **Clinical indications** — the patient populations for which this exercise has validation
8. **Evidence level** — strong / moderate / limited / expert-opinion
9. **Citations** — author, year, journal, DOI/PMID

## Companion questions

1. What is the biomechanical rationale for training ${movementLower} in isolation versus as part of compound movement patterns?
2. Which populations benefit most from direct ${movementLower} training (rehabilitation, sport performance, aging)?
3. Are there common substitution patterns or compensations to monitor during ${movementLower} loading?

## Deliverable format

Markdown, H3 per exercise. End with a summary table:

| Exercise | Primary muscle (% MVIC) | Evidence level | Key citation |

If fewer than four evidence-based options exist, say "insufficient evidence" rather than fabricating content.
`;
}

function promptForWeakEvidence(group: WeakExercise[]): string {
  const byName = group
    .slice(0, 12)
    .map((e) => `- **${e.name}** (currently: ${e.evidenceLevel})`)
    .join("\n");

  return `# Stronger-Evidence Alternatives for Low-Evidence Exercises

For each of the exercises listed below, identify whether a **better-validated alternative** exists that targets the same muscle(s) and movement pattern. Prioritize exercises with EMG studies, RCTs, or systematic review support.

${byName}

For each exercise, provide:

1. The original exercise name
2. Whether stronger evidence **exists** for that exercise specifically — cite the strongest available source
3. If stronger evidence does **not** exist, recommend **1–3 validated alternatives** that train the same muscle/movement pattern, with:
   - Exercise name and brief description
   - Primary muscles and EMG % MVIC
   - Dosing from the source RCT/systematic review
   - Evidence level (strong / moderate / limited)
   - Citations (author, year, journal, DOI/PMID)
4. A recommendation: keep the original with a limited-evidence label, replace with the alternative, or supplement with the alternative.

## Deliverable format

Markdown, H3 per original exercise. End with a summary table:

| Original | Stronger evidence exists? | Recommended alternative | Evidence level | Key citation |

If no validated alternative exists for a given exercise, say so — do not generate speculative alternatives.
`;
}

function promptForMuscleCoverage(group: MuscleGap[]): string {
  const byName = group
    .slice(0, 12)
    .map((m) => `- **${m.name}** (currently a primary mover in ${m.asPrimary} exercise${m.asPrimary === 1 ? "" : "s"})`)
    .join("\n");

  return `# Primary-Activator Exercises for Underrepresented Muscles

For each muscle below, identify **2–4 exercises** where it is the **primary activator** (not secondary, synergist, or stabilizer). Prioritize exercises with EMG validation showing the muscle at ≥40% MVIC or peak activation among comparative studies.

${byName}

For each exercise, provide:

1. **Exercise name** and a 1–2 sentence description
2. **EMG data** — % MVIC for the target muscle plus comparator muscles where available
3. **Equipment** and positioning
4. **Evidence-based dosing** from the source study
5. **Coaching cues** (2–4 concise cues, including tactile cues to discourage substitution)
6. **Regressions and progressions**
7. **Clinical indications** and contraindications
8. **Evidence level** — strong / moderate / limited / expert-opinion
9. **Citations** — author, year, journal, DOI/PMID

## Companion questions

1. For each muscle, what is the common **substitution pattern** when it is weak or inhibited? How should the exercise be cued to minimize substitution?
2. Are there muscles in this list for which **isolation training has no evidence** of being superior to compound-movement training? If so, flag them and explain.

## Deliverable format

Markdown, H3 per muscle, H4 per exercise. End with a summary table:

| Muscle | Best-evidence exercise | % MVIC | Evidence level | Key citation |

Flag any muscle for which fewer than two well-validated primary-activator exercises exist.
`;
}

function promptForFunctionalTasks(
  tasks: { name: string; exerciseCount: number }[]
): string {
  const byName = tasks
    .slice(0, 10)
    .map((t) => `- **${t.name}** (${t.exerciseCount} linked exercise${t.exerciseCount === 1 ? "" : "s"})`)
    .join("\n");

  return `# Evidence-Based Exercise Prescription for Sparsely Covered Functional Tasks

For each functional task below, identify **4–6 evidence-based exercises** that transfer to task performance. Prioritize exercises with published transfer evidence (RCTs that measured functional task outcomes, not just strength).

${byName}

For each exercise, provide:

1. **Exercise name** and a 1–2 sentence description
2. **Biomechanical link to the task** — which phase, joint moment, or muscle demand does it train?
3. **Primary / secondary muscles** with EMG % MVIC where published
4. **Evidence of transfer** — RCT or systematic review demonstrating improvement in the functional task, not just isolated strength
5. **Evidence-based dosing** from the source
6. **Regressions and progressions** (criteria-based where possible)
7. **Evidence level** — strong / moderate / limited / expert-opinion
8. **Citations** — author, year, journal, DOI/PMID

## Companion questions

1. What is the minimum **clinically important difference** (MCID) for each task, and which exercises have evidence of reaching it?
2. Which exercise **dose-response** studies exist for each task (e.g., number of sessions required for transfer)?

## Deliverable format

Markdown, H3 per task. End with a summary table:

| Task | Exercise | Evidence of transfer | MCID reached? | Key citation |

If a task has fewer than three transfer-validated exercises, say "insufficient transfer evidence" rather than listing speculative options.
`;
}

// ─── Report + emit ───────────────────────────────────────────────────────────

function toFilename(s: string): string {
  return (
    "auto-" +
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  );
}

function writePrompt(name: string, body: string) {
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${name}.md`);
  writeFileSync(path, body);
  return path;
}

/**
 * Move any auto-*.md files in prompts/ that are NOT in the current emit set
 * to prompts/completed/. The signal is "this gap was a prompt last run, but
 * is no longer one — either it got ingested or its movement was tagged
 * evidence-gap-accepted." Appends an archive footer with the date.
 */
function archiveStalePrompts(currentlyEmitted: Set<string>): string[] {
  mkdirSync(COMPLETED_DIR, { recursive: true });

  let entries: string[] = [];
  try {
    entries = readdirSync(OUT_DIR);
  } catch {
    return [];
  }

  const today = new Date().toISOString().slice(0, 10);
  const archived: string[] = [];

  for (const file of entries) {
    if (!file.startsWith("auto-") || !file.endsWith(".md")) continue;
    if (currentlyEmitted.has(file)) continue;

    const src = join(OUT_DIR, file);
    const dest = join(COMPLETED_DIR, file);

    let body: string;
    try {
      body = readFileSync(src, "utf8");
    } catch {
      continue;
    }
    const footer = `\n\n---\n\n_Archived ${today} — no longer in current gap report. Check \`research/${file.replace(/\.md$/, "-response.md")}\` for the OpenEvidence answer (if processed)._\n`;
    const out = body.includes("_Archived ") ? body : body + footer;
    writeFileSync(dest, out);
    try {
      unlinkSync(src);
    } catch {
      // ignore
    }
    archived.push(dest);
  }

  return archived;
}

async function main() {
  console.log("🔍 Scanning knowledge graph for coverage gaps...\n");

  const [sparseMoves, weakEvidence, muscleGaps, taskGaps] = await Promise.all([
    findSparseMovements(),
    findLowEvidenceExercises(),
    findUnderrepresentedMuscles(),
    findSparseFunctionalTasks(),
  ]);

  // ─── Human-readable report ─────────────────────────────────────────────────
  const report: string[] = [
    "# Coverage Gap Report",
    "",
    `_Generated ${new Date().toISOString().slice(0, 10)}_`,
    "",
    "## Sparse (region × movement) combinations (≤ 2 exercises)",
    "",
    sparseMoves.length
      ? sparseMoves
          .map((g) => `- **${g.region} — ${g.movement}** — ${g.exerciseCount} exercise${g.exerciseCount === 1 ? "" : "s"}`)
          .join("\n")
      : "_No gaps._",
    "",
    `## Exercises with limited / expert-opinion evidence (${weakEvidence.length})`,
    "",
    weakEvidence.length
      ? weakEvidence.map((e) => `- **${e.name}** — _${e.evidenceLevel}_ (${e.regions.join(", ") || "unlinked"})`).join("\n")
      : "_No gaps._",
    "",
    `## Muscles rarely primary (${muscleGaps.length})`,
    "",
    muscleGaps.length
      ? muscleGaps.map((m) => `- **${m.name}** — primary in ${m.asPrimary} exercise${m.asPrimary === 1 ? "" : "s"}`).join("\n")
      : "_No gaps._",
    "",
    `## Sparsely covered functional tasks (${taskGaps.length})`,
    "",
    taskGaps.length
      ? taskGaps.map((t) => `- **${t.name}** — ${t.exerciseCount} exercise${t.exerciseCount === 1 ? "" : "s"}`).join("\n")
      : "_No gaps._",
    "",
  ];

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, ".gaps-report.md"), report.join("\n"));

  // ─── Auto-prompts (top priorities) ─────────────────────────────────────────
  const emitted: string[] = [];

  // One prompt per top-N sparsest region×movement combo
  for (const g of sparseMoves.slice(0, MAX_AUTO_PROMPTS)) {
    const name = toFilename(`${g.region}-${g.movement}`);
    emitted.push(writePrompt(name, promptForSparseMovement(g)));
  }

  // One batch prompt for low-evidence exercises (if any)
  if (weakEvidence.length) {
    emitted.push(
      writePrompt("auto-low-evidence-alternatives", promptForWeakEvidence(weakEvidence))
    );
  }

  // One batch prompt for underrepresented muscles
  if (muscleGaps.length) {
    emitted.push(
      writePrompt("auto-underrepresented-muscles", promptForMuscleCoverage(muscleGaps))
    );
  }

  // One batch prompt for sparse functional tasks
  if (taskGaps.length) {
    emitted.push(
      writePrompt("auto-functional-task-transfer", promptForFunctionalTasks(taskGaps))
    );
  }

  // ─── Archive stale prompts no longer in the current emit set ──────────────
  const emittedFilenames = new Set(emitted.map((p) => p.split("/").pop()!));
  const archived = archiveStalePrompts(emittedFilenames);

  console.log(`✅ Gap report: prompts/.gaps-report.md`);
  console.log(`   Sparse (region × movement) combos: ${sparseMoves.length}`);
  console.log(`   Low-evidence exercises:            ${weakEvidence.length}`);
  console.log(`   Underrepresented muscles:          ${muscleGaps.length}`);
  console.log(`   Sparse functional tasks:           ${taskGaps.length}`);
  console.log(`\n✏️  Emitted ${emitted.length} auto-prompts:`);
  for (const p of emitted) console.log(`   - ${p.replace(process.cwd() + "/", "")}`);
  if (archived.length) {
    console.log(`\n📦 Archived ${archived.length} stale prompt${archived.length === 1 ? "" : "s"} → prompts/completed/:`);
    for (const p of archived) console.log(`   - ${p.replace(process.cwd() + "/", "")}`);
  }
  console.log(
    `\nEdit any prompt before sending, or paste straight into OpenEvidence. Responses go in research/ (also gitignored).`
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Gap scan failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
