/**
 * Scoped JSON bundle export for a single region.
 *
 * Usage:
 *   npx tsx scripts/export-region.ts ankle
 *   npx tsx scripts/export-region.ts hip --out exports/hip-bundle.json
 *
 * Produces a self-contained JSON file with:
 *   - the region itself
 *   - all joints in the region
 *   - all movements of those joints
 *   - all muscles referenced by those movements or their exercises
 *     (full anatomy: O/I/A/N/B preserved)
 *   - all exercises linked to those movements
 *     (with cues, regressions, progressions, muscle roles, functional tasks)
 *   - all functional tasks referenced by exercises or movements
 *   - only the research sources actually cited by any of the above
 *
 * Entities are stored as flat arrays keyed by slug, so the receiving
 * project can import the JSON and look things up by slug without
 * worrying about cuid collisions.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { prisma } from "../src/lib/prisma";

// ─── CLI parsing ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const regionSlug = args.find((a) => !a.startsWith("--")) ?? "ankle";
const outFlag = args.indexOf("--out");
const outPath =
  outFlag !== -1 && args[outFlag + 1]
    ? resolve(args[outFlag + 1])
    : resolve(`exports/${regionSlug}-bundle.json`);

// ─── Bundle types ────────────────────────────────────────────────────────────

type MuscleRoleLink = {
  muscleSlug: string;
  role: string;
  notes: string | null;
};

type SourceLink = {
  sourceSlug: string;
  notes: string | null;
};

type Bundle = {
  meta: {
    exportedAt: string;
    sourceRepo: string;
    sourceCommit: string;
    regionSlug: string;
    counts: Record<string, number>;
  };
  region: any;
  joints: any[];
  movements: any[];
  muscles: any[];
  exercises: any[];
  functionalTasks: any[];
  sources: any[];
  tags: any[];
};

// ─── Export ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`→ Exporting region "${regionSlug}"...`);

  const region = await prisma.region.findUnique({
    where: { slug: regionSlug },
    include: {
      joints: {
        orderBy: { name: "asc" },
        include: {
          movements: {
            orderBy: { name: "asc" },
            include: {
              muscles: { include: { muscle: true } },
              functionalTasks: { include: { functionalTask: true } },
              exercises: {
                include: {
                  exercise: {
                    include: {
                      muscles: { include: { muscle: true } },
                      cues: { orderBy: { order: "asc" } },
                      regressions: { orderBy: { order: "asc" } },
                      progressions: { orderBy: { order: "asc" } },
                      movements: { include: { movement: true } },
                      functionalTasks: { include: { functionalTask: true } },
                      sources: { include: { source: true } },
                      tags: { include: { tag: true } },
                    },
                  },
                },
              },
              sources: { include: { source: true } },
              tags: { include: { tag: true } },
            },
          },
          sources: { include: { source: true } },
          tags: { include: { tag: true } },
        },
      },
      sources: { include: { source: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!region) {
    console.error(`✗ Region "${regionSlug}" not found.`);
    process.exit(1);
  }

  // ─── Dedupe containers ─────────────────────────────────────────────────
  const muscles = new Map<string, any>();
  const functionalTasks = new Map<string, any>();
  const sources = new Map<string, any>();
  const tags = new Map<string, any>();

  function addSource(s: any, notes?: string | null): SourceLink {
    if (!sources.has(s.slug)) {
      const { id: _id, ...rest } = s;
      sources.set(s.slug, { ...rest, sourceId: _id });
    }
    return { sourceSlug: s.slug, notes: notes ?? null };
  }

  function addTag(t: any) {
    if (!tags.has(t.slug)) {
      const { id: _id, ...rest } = t;
      tags.set(t.slug, { ...rest, sourceId: _id });
    }
  }

  function addMuscle(m: any) {
    if (!muscles.has(m.slug)) {
      const { id: _id, ...rest } = m;
      muscles.set(m.slug, { ...rest, sourceId: _id });
    }
  }

  function addFunctionalTask(ft: any) {
    if (!functionalTasks.has(ft.slug)) {
      const { id: _id, ...rest } = ft;
      functionalTasks.set(ft.slug, { ...rest, sourceId: _id });
    }
  }

  // ─── Flatten ──────────────────────────────────────────────────────────
  const joints: any[] = [];
  const movements: any[] = [];
  const exercises = new Map<string, any>();

  for (const joint of region.joints) {
    joints.push({
      slug: joint.slug,
      name: joint.name,
      description: joint.description,
      jointType: joint.jointType,
      regionSlug: region.slug,
      status: joint.status,
      confidence: joint.confidence,
      notes: joint.notes,
      sources: joint.sources.map((sl: any) => addSource(sl.source, sl.notes)),
      tagSlugs: joint.tags.map((tl: any) => {
        addTag(tl.tag);
        return tl.tag.slug;
      }),
      sourceId: joint.id,
    });

    for (const movement of joint.movements) {
      const muscleRoles: MuscleRoleLink[] = movement.muscles.map((mm: any) => {
        addMuscle(mm.muscle);
        return { muscleSlug: mm.muscle.slug, role: mm.role, notes: mm.notes };
      });

      const funcTaskSlugs = movement.functionalTasks.map((mft: any) => {
        addFunctionalTask(mft.functionalTask);
        return mft.functionalTask.slug;
      });

      movements.push({
        slug: movement.slug,
        name: movement.name,
        description: movement.description,
        plane: movement.plane,
        axis: movement.axis,
        jointSlug: joint.slug,
        regionSlug: region.slug,
        status: movement.status,
        confidence: movement.confidence,
        notes: movement.notes,
        muscleRoles,
        functionalTaskSlugs: funcTaskSlugs,
        sources: movement.sources.map((sl: any) => addSource(sl.source, sl.notes)),
        tagSlugs: movement.tags.map((tl: any) => {
          addTag(tl.tag);
          return tl.tag.slug;
        }),
        sourceId: movement.id,
      });

      for (const em of movement.exercises) {
        const ex = em.exercise;
        if (exercises.has(ex.slug)) continue;

        const exMuscleRoles: MuscleRoleLink[] = ex.muscles.map((xm: any) => {
          addMuscle(xm.muscle);
          return { muscleSlug: xm.muscle.slug, role: xm.role, notes: xm.notes };
        });

        const exFuncTaskSlugs = ex.functionalTasks.map((eft: any) => {
          addFunctionalTask(eft.functionalTask);
          return eft.functionalTask.slug;
        });

        const exMovementSlugs = ex.movements.map((xm: any) => xm.movement.slug);

        exercises.set(ex.slug, {
          slug: ex.slug,
          name: ex.name,
          description: ex.description,
          dosing: ex.dosing,
          emgNotes: ex.emgNotes,
          evidenceLevel: ex.evidenceLevel,
          imageUrl: ex.imageUrl,
          videoUrl: ex.videoUrl,
          videoType: ex.videoType,
          startPosition: ex.startPosition,
          endPosition: ex.endPosition,
          rom: ex.rom,
          cameraView: ex.cameraView,
          videoPrompt: ex.videoPrompt,
          difficulty: ex.difficulty,
          equipment: ex.equipment,
          bodyPosition: ex.bodyPosition,
          status: ex.status,
          confidence: ex.confidence,
          notes: ex.notes,
          muscleRoles: exMuscleRoles,
          movementSlugs: exMovementSlugs,
          functionalTaskSlugs: exFuncTaskSlugs,
          cues: ex.cues.map((c: any) => ({
            text: c.text,
            cueType: c.cueType,
            order: c.order,
          })),
          regressions: ex.regressions.map((r: any) => ({
            name: r.name,
            description: r.description,
            order: r.order,
          })),
          progressions: ex.progressions.map((p: any) => ({
            name: p.name,
            description: p.description,
            order: p.order,
          })),
          sources: ex.sources.map((sl: any) => addSource(sl.source, sl.notes)),
          tagSlugs: ex.tags.map((tl: any) => {
            addTag(tl.tag);
            return tl.tag.slug;
          }),
          sourceId: ex.id,
        });
      }
    }
  }

  // Region-level sources and tags
  const regionSources = region.sources.map((sl: any) => addSource(sl.source, sl.notes));
  const regionTags = region.tags.map((tl: any) => {
    addTag(tl.tag);
    return tl.tag.slug;
  });

  // ─── Git SHA for traceability ─────────────────────────────────────────
  let commit = "unknown";
  try {
    commit = execSync("git rev-parse HEAD", { cwd: process.cwd() })
      .toString()
      .trim();
  } catch {}

  // ─── Assemble bundle ──────────────────────────────────────────────────
  const bundle: Bundle = {
    meta: {
      exportedAt: new Date().toISOString(),
      sourceRepo: "body-iq",
      sourceCommit: commit,
      regionSlug: region.slug,
      counts: {
        joints: joints.length,
        movements: movements.length,
        muscles: muscles.size,
        exercises: exercises.size,
        functionalTasks: functionalTasks.size,
        sources: sources.size,
        tags: tags.size,
      },
    },
    region: {
      slug: region.slug,
      name: region.name,
      description: region.description,
      sortOrder: region.sortOrder,
      status: region.status,
      confidence: region.confidence,
      notes: region.notes,
      sources: regionSources,
      tagSlugs: regionTags,
      sourceId: region.id,
    },
    joints,
    movements,
    muscles: Array.from(muscles.values()).sort((a, b) =>
      a.slug.localeCompare(b.slug),
    ),
    exercises: Array.from(exercises.values()).sort((a, b) =>
      a.slug.localeCompare(b.slug),
    ),
    functionalTasks: Array.from(functionalTasks.values()).sort((a, b) =>
      a.slug.localeCompare(b.slug),
    ),
    sources: Array.from(sources.values()).sort((a, b) =>
      a.slug.localeCompare(b.slug),
    ),
    tags: Array.from(tags.values()).sort((a, b) => a.slug.localeCompare(b.slug)),
  };

  // ─── Write ────────────────────────────────────────────────────────────
  const dir = dirname(outPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(outPath, JSON.stringify(bundle, null, 2));

  console.log(`✓ Wrote ${outPath}`);
  console.log("  Counts:");
  for (const [k, v] of Object.entries(bundle.meta.counts)) {
    console.log(`    ${k.padEnd(18)} ${v}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
