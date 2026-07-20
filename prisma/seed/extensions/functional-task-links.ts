import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma, logSection, logCount } from "../client";

/**
 * Exercise → functional-task links — connects each exercise to the everyday
 * tasks it supports (with an essential/supportive relevance weight), so the app
 * can explain what a movement is *for* ("this deadlift helps you lift things off
 * the floor"). Assigned by a PT-persona workflow against the task roster. Data
 * in the sibling JSON; idempotent upsert.
 */

const FILE = join(__dirname, "functional-task-links-2026-07.json");

export async function seedFunctionalTaskLinksExtension() {
  logSection("Exercise → functional-task links");
  if (!existsSync(FILE)) { console.log("    (no task-links JSON — skipping)"); return; }

  const items: any[] = JSON.parse(readFileSync(FILE, "utf8"));
  const exBySlug = new Map((await prisma.exercise.findMany({ select: { id: true, slug: true } })).map((e) => [e.slug, e.id]));
  const taskBySlug = new Map((await prisma.functionalTask.findMany({ select: { id: true, slug: true } })).map((t) => [t.slug, t.id]));

  let links = 0, exercises = 0, skipped = 0;
  for (const it of items) {
    const exerciseId = exBySlug.get(it.slug);
    if (!exerciseId || !it.tasks?.length) continue;
    exercises++;
    for (const t of it.tasks) {
      const functionalTaskId = taskBySlug.get(t.taskSlug);
      if (!functionalTaskId) { skipped++; continue; }
      const relevance = t.relevance === "essential" || t.relevance === "supportive" ? t.relevance : "supportive";
      await prisma.exerciseFunctionalTask.upsert({
        where: { exerciseId_functionalTaskId: { exerciseId, functionalTaskId } },
        update: { relevance },
        create: { exerciseId, functionalTaskId, relevance },
      });
      links++;
    }
  }
  logCount("exercise→task links created", links);
  console.log(`    across ${exercises} exercises${skipped ? ` (skipped ${skipped} unknown task slugs)` : ""}`);
}
