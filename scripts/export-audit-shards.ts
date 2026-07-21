#!/usr/bin/env tsx
/**
 * One-off: export per-region exercise detail as JSON shards for the clinical
 * audit fan-out. Each shard is self-contained so an auditor (human or agent)
 * can review muscle roles, dosing, cues, citations, and difficulty edges
 * without touching the DB. Writes to the path given as argv[2].
 */
import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2];
if (!outDir) throw new Error("usage: export-audit-shards.ts <outDir>");
mkdirSync(outDir, { recursive: true });

const p = new PrismaClient();

async function main() {
  const regions = await p.region.findMany({ orderBy: { sortOrder: "asc" } });
  const index: Record<string, number> = {};

  for (const region of regions) {
    const exercises = await p.exercise.findMany({
      where: { movements: { some: { movement: { joint: { regionId: region.id } } } } },
      select: {
        slug: true, name: true, description: true, dosing: true, emgNotes: true,
        evidenceLevel: true, difficulty: true, bodyPosition: true, equipment: true,
        status: true, confidence: true, notes: true,
        muscles: { select: { role: true, notes: true, muscle: { select: { slug: true, name: true } } } },
        movements: { select: { movement: { select: { slug: true, name: true, plane: true } } } },
        cues: { select: { text: true, focus: true, citation: true }, orderBy: { order: "asc" } },
        regressions: { select: { name: true, description: true, targetExerciseId: true } },
        progressions: { select: { name: true, description: true, targetExerciseId: true } },
        sources: { select: { source: { select: { slug: true, title: true, authors: true, year: true, journal: true } } } },
      },
      orderBy: { slug: "asc" },
    });

    // Candidate exercise nodes in this region (for difficulty-graph edge matching)
    const roster = exercises.map((e) => ({ slug: e.slug, name: e.name, difficulty: e.difficulty }));

    const shard = {
      region: { slug: region.slug, name: region.name },
      exerciseCount: exercises.length,
      roster,
      exercises,
    };
    writeFileSync(join(outDir, `${region.slug}.json`), JSON.stringify(shard, null, 1));
    index[region.slug] = exercises.length;
  }

  writeFileSync(join(outDir, "_index.json"), JSON.stringify(index, null, 1));
  console.log("shards written:", Object.keys(index).length, "regions →", outDir);
  console.log(index);
}

main().finally(() => p.$disconnect());
