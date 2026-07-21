import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma, logSection, logCount } from "../client";

/**
 * Exercise → goal links — connects each exercise to the rehab/performance/
 * prevention/mobility goals it serves, with an essential/supportive relevance
 * and an optional per-pairing caution. Assigned by a PT/coach-persona workflow
 * grounded in each exercise's muscles, movements, and rationale/EMG text. Data
 * in the sibling JSON; idempotent upsert.
 */

const FILE = join(__dirname, "goal-links-2026-07.json");

export async function seedGoalLinksExtension() {
  logSection("Exercise → goal links");
  if (!existsSync(FILE)) { console.log("    (no goal-links JSON — skipping)"); return; }

  const items: any[] = JSON.parse(readFileSync(FILE, "utf8"));
  const exBySlug = new Map((await prisma.exercise.findMany({ select: { id: true, slug: true } })).map((e) => [e.slug, e.id]));
  const goalBySlug = new Map((await prisma.goal.findMany({ select: { id: true, slug: true } })).map((g) => [g.slug, g.id]));

  let links = 0, exercises = 0, cautions = 0, skipped = 0;
  for (const it of items) {
    const exerciseId = exBySlug.get(it.slug);
    if (!exerciseId || !it.goals?.length) continue;
    exercises++;
    for (const g of it.goals) {
      const goalId = goalBySlug.get(g.goalSlug);
      if (!goalId) { skipped++; continue; }
      const relevance = g.relevance === "essential" || g.relevance === "supportive" ? g.relevance : "supportive";
      const caution = g.caution?.trim() || null;
      if (caution) cautions++;
      await prisma.exerciseGoal.upsert({
        where: { exerciseId_goalId: { exerciseId, goalId } },
        update: { relevance, caution },
        create: { exerciseId, goalId, relevance, caution },
      });
      links++;
    }
  }
  logCount("exercise→goal links created", links);
  console.log(`    across ${exercises} exercises, ${cautions} with cautions${skipped ? `, skipped ${skipped} unknown goal slugs` : ""}`);
}
