/**
 * Export every Exercise row to a flat JSON array shaped for downstream
 * consumers (Positions's `scripts/migrate-exercises.ts` upserts into
 * Supabase `exercises_v2` from this exact shape).
 *
 * Usage:
 *   pnpm tsx scripts/export-all-exercises.ts
 *   pnpm tsx scripts/export-all-exercises.ts --out exports/all-exercises.json
 *
 * Field shape matches scripts/export-region.ts so this is just the
 * unscoped variant — no region filtering, no graph traversal, just the
 * full exercise list with the relations Positions needs.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { prisma } from "../src/lib/prisma"

const args = process.argv.slice(2)
const outFlag = args.indexOf("--out")
const outPath =
  outFlag !== -1 && args[outFlag + 1]
    ? resolve(args[outFlag + 1])
    : resolve("exports/all-exercises.json")

async function main() {
  const rows = await prisma.exercise.findMany({
    include: {
      muscles: { include: { muscle: true } },
      movements: { include: { movement: true } },
      functionalTasks: { include: { functionalTask: true } },
      cues: { orderBy: { order: "asc" } },
      regressions: { orderBy: { order: "asc" } },
      progressions: { orderBy: { order: "asc" } },
    },
    orderBy: { slug: "asc" },
  })

  const exercises = rows.map((ex) => ({
    slug: ex.slug,
    name: ex.name,
    description: ex.description,
    dosing: ex.dosing,
    emgNotes: ex.emgNotes,
    evidenceLevel: ex.evidenceLevel,
    difficulty: ex.difficulty,
    equipment: ex.equipment,
    bodyPosition: ex.bodyPosition,
    confidence: ex.confidence,
    notes: ex.notes,
    movementSlugs: ex.movements.map((em) => em.movement.slug),
    muscleRoles: ex.muscles.map((xm) => ({
      muscleSlug: xm.muscle.slug,
      role: xm.role,
      notes: xm.notes,
    })),
    functionalTaskSlugs: ex.functionalTasks.map((eft) => eft.functionalTask.slug),
    cues: ex.cues.map((c) => ({ text: c.text, cueType: c.cueType })),
    regressions: ex.regressions.map((r) => ({ name: r.name, description: r.description })),
    progressions: ex.progressions.map((p) => ({ name: p.name, description: p.description })),
  }))

  if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(exercises, null, 2))
  console.log(`Wrote ${exercises.length} exercises to ${outPath}`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
