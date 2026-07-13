import { prisma } from "@/lib/prisma";

/** Common includes for validation metadata */
const validationSelect = {
  status: true,
  confidence: true,
  notes: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ─── Regions ─────────────────────────────────────────────────────────────────

export async function getRegions() {
  return prisma.region.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { joints: true } },
    },
  });
}

export async function getRegion(slug: string) {
  return prisma.region.findUnique({
    where: { slug },
    include: {
      joints: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { movements: true } },
        },
      },
      sources: { include: { source: true } },
      tags: { include: { tag: true } },
    },
  });
}

// ─── Joints ──────────────────────────────────────────────────────────────────

export async function getJoints() {
  return prisma.joint.findMany({
    orderBy: { name: "asc" },
    include: {
      region: { select: { slug: true, name: true } },
      _count: { select: { movements: true } },
    },
  });
}

export async function getJoint(slug: string) {
  return prisma.joint.findUnique({
    where: { slug },
    include: {
      region: { select: { slug: true, name: true } },
      movements: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { muscles: true, exercises: true } },
        },
      },
      sources: { include: { source: true } },
      tags: { include: { tag: true } },
    },
  });
}

// ─── Movements ───────────────────────────────────────────────────────────────

export async function getMovements() {
  return prisma.movement.findMany({
    orderBy: { name: "asc" },
    include: {
      joint: {
        select: { slug: true, name: true, region: { select: { slug: true, name: true } } },
      },
      _count: { select: { muscles: true, exercises: true, functionalTasks: true } },
    },
  });
}

export async function getMovementsGroupedByRegion() {
  return prisma.region.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      joints: {
        orderBy: { name: "asc" },
        include: {
          movements: {
            orderBy: { name: "asc" },
            include: {
              _count: { select: { muscles: true, exercises: true, functionalTasks: true } },
            },
          },
        },
      },
    },
  });
}

export async function getMovement(slug: string) {
  return prisma.movement.findUnique({
    where: { slug },
    include: {
      joint: {
        select: { slug: true, name: true, region: { select: { slug: true, name: true } } },
      },
      muscles: {
        include: { muscle: true },
        orderBy: { role: "asc" },
      },
      functionalTasks: {
        include: { functionalTask: true },
      },
      exercises: {
        include: { exercise: true },
      },
      sources: { include: { source: true } },
      tags: { include: { tag: true } },
    },
  });
}

// ─── Muscles ─────────────────────────────────────────────────────────────────

export async function getMuscles() {
  return prisma.muscle.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { movements: true, exercises: true } },
    },
  });
}

export async function getMuscle(slug: string) {
  return prisma.muscle.findUnique({
    where: { slug },
    include: {
      movements: {
        include: {
          movement: {
            select: { slug: true, name: true, joint: { select: { slug: true, name: true } } },
          },
        },
        orderBy: { role: "asc" },
      },
      exercises: {
        include: {
          exercise: { select: { slug: true, name: true } },
        },
        orderBy: { role: "asc" },
      },
      sources: { include: { source: true } },
      tags: { include: { tag: true } },
    },
  });
}

// ─── Functional Tasks ────────────────────────────────────────────────────────

export async function getFunctionalTasks() {
  return prisma.functionalTask.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { movements: true, exercises: true } },
    },
  });
}

export async function getFunctionalTask(slug: string) {
  return prisma.functionalTask.findUnique({
    where: { slug },
    include: {
      movements: {
        include: {
          movement: {
            select: { slug: true, name: true, joint: { select: { slug: true, name: true } } },
          },
        },
      },
      exercises: {
        include: {
          exercise: { select: { slug: true, name: true } },
        },
      },
      sources: { include: { source: true } },
      tags: { include: { tag: true } },
    },
  });
}

// ─── Exercises ───────────────────────────────────────────────────────────────

export async function getExercises() {
  return prisma.exercise.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { muscles: true, movements: true, cues: true, regressions: true, progressions: true } },
    },
  });
}

export async function getExercisesGroupedByRegion() {
  // Get all regions with their joints → movements → exercises
  const regions = await prisma.region.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      slug: true,
      name: true,
      joints: {
        select: {
          id: true,
          movements: {
            select: {
              id: true,
              exercises: {
                select: { exerciseId: true },
              },
            },
          },
        },
      },
    },
  });

  // Collect unique exercise IDs per region
  const regionExerciseIds = new Map<string, Set<string>>();
  for (const region of regions) {
    const ids = new Set<string>();
    for (const joint of region.joints) {
      for (const movement of joint.movements) {
        for (const link of movement.exercises) {
          ids.add(link.exerciseId);
        }
      }
    }
    regionExerciseIds.set(region.slug, ids);
  }

  // Load all exercises with counts in one query
  const allExercises = await prisma.exercise.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { muscles: true, movements: true, cues: true, regressions: true, progressions: true, sources: true } },
    },
  });

  const exerciseById = new Map(allExercises.map((e) => [e.id, e]));

  // Build grouped result
  const grouped = regions.map((region) => {
    const exerciseIds = regionExerciseIds.get(region.slug) ?? new Set();
    const exercises = Array.from(exerciseIds)
      .map((id) => exerciseById.get(id))
      .filter(Boolean)
      .sort((a, b) => a!.name.localeCompare(b!.name));
    return {
      slug: region.slug,
      name: region.name,
      exercises: exercises as NonNullable<(typeof exercises)[number]>[],
    };
  });

  // Collect all assigned exercise IDs to find unassigned ones
  const allAssigned = new Set<string>();
  for (const ids of regionExerciseIds.values()) {
    for (const id of ids) allAssigned.add(id);
  }
  const unassigned = allExercises.filter((e) => !allAssigned.has(e.id));
  if (unassigned.length > 0) {
    grouped.push({ slug: "unassigned", name: "Unassigned", exercises: unassigned });
  }

  return grouped;
}

export async function getExercise(slug: string) {
  return prisma.exercise.findUnique({
    where: { slug },
    include: {
      muscles: {
        include: { muscle: true },
        orderBy: { role: "asc" },
      },
      movements: {
        include: {
          movement: {
            select: { slug: true, name: true, joint: { select: { slug: true, name: true } } },
          },
        },
      },
      functionalTasks: {
        include: { functionalTask: true },
      },
      cues: { orderBy: { order: "asc" } },
      regressions: { orderBy: { order: "asc" }, include: { targetExercise: { select: { slug: true, name: true } } } },
      progressions: { orderBy: { order: "asc" }, include: { targetExercise: { select: { slug: true, name: true } } } },
      sources: { include: { source: true } },
      tags: { include: { tag: true } },
    },
  });
}

// ─── Workout Planner Grid ────────────────────────────────────────────────────

/**
 * Strip a region/joint-specific prefix from a movement name to produce a
 * shareable row label. Example: "Shoulder Flexion" → "Flexion",
 * "Cervical Lateral Flexion" → "Lateral Flexion", "Forearm Pronation" → "Pronation".
 *
 * Designed so movements from different joints in the same conceptual category
 * (flexion, extension, rotation, etc.) collapse into one row in the planner grid.
 */
/**
 * Aliases: regionally-named movements that are anatomical synonyms for a more
 * general movement. Collapsing these into the general column eliminates
 * sparse single-region columns (e.g., the ankle's "Dorsiflexion" only had
 * entries in the Ankle row — it's really the ankle's flavor of flexion).
 *
 * Only includes cases where the movement concept is genuinely equivalent,
 * just regionally named. Concepts that are distinct (e.g., Pronation/Supination
 * of the forearm, Inversion/Eversion at the subtalar joint, Opposition of the
 * thumb) are NOT aliased — they keep their own columns.
 */
const COLUMN_ALIASES: Record<string, string> = {
  // Ankle dorsiflexion/plantarflexion are intentionally NOT aliased — they
  // are unique, clinically distinct movements and deserve their own columns
  // so users don't conflate them with shoulder/hip/etc. flexion/extension.
  "Radial Deviation": "Abduction",
  "Ulnar Deviation": "Adduction",
};

function deriveMovementColumnKey(movementName: string, regionName: string): string {
  // Region → ordered list of prefixes to try (longest first so multi-word prefixes win).
  // Hand intentionally retains "Finger"/"Thumb" prefixes — they're functionally
  // distinct sub-categories within the Hand region.
  const prefixesByRegion: Record<string, string[]> = {
    "Shoulder": ["Shoulder ", "Scapular "],
    "Elbow": ["Forearm ", "Elbow "],
    "Wrist": ["Wrist "], // Radial/Ulnar Deviation handled via COLUMN_ALIASES below
    "Hand": [], // keep Finger/Thumb prefixes
    "Hip": ["Hip "],
    "Knee": ["Knee "],
    "Ankle": ["Foot ", "Ankle "],
    "Cervical Spine": ["Upper Cervical ", "Cervical "],
    "Thoracic Spine": ["Thoracic "],
    "Lumbar Spine": ["Lumbar "],
  };

  let key = movementName;
  for (const prefix of prefixesByRegion[regionName] ?? []) {
    if (key.startsWith(prefix)) {
      key = key.slice(prefix.length).trim();
      break;
    }
  }

  // Collapse joint-suffix variants for hand movements:
  //   "Finger Flexion (DIP)" / "Finger Flexion (PIP)" / "Finger Flexion (MCP)" → "Finger Flexion"
  //   "Thumb Extension (IP)" / "Thumb Extension (MCP)" → "Thumb Extension"
  // Standard practice in workout planning is to treat these as one composite movement;
  // joint-specific variants live on the exercise detail page.
  key = key.replace(/\s*\((MCP|PIP|DIP|IP)\)\s*$/, "");

  // Collapse regional synonyms to their general movement category
  if (COLUMN_ALIASES[key]) key = COLUMN_ALIASES[key];

  return key;
}

/** Normalize equipment slugs (e.g. collapse "dumbbells" → "dumbbell"). */
function normalizeEquipment(slug: string): string {
  if (slug === "dumbbells") return "dumbbell";
  return slug;
}

export type PlannerExercise = {
  id: string;
  slug: string;
  name: string;
  equipment: string[];
  muscles: { role: string; name: string; slug: string }[];
};

export type PlannerData = {
  regions: { slug: string; name: string }[];
  movementColumns: string[];
  // cells[regionSlug][movementColumn] = list of exercises
  cells: Record<string, Record<string, PlannerExercise[]>>;
  equipment: string[];
};

export async function getPlannerData(): Promise<PlannerData> {
  const movements = await prisma.movement.findMany({
    select: {
      id: true,
      name: true,
      joint: {
        select: {
          region: { select: { slug: true, name: true, sortOrder: true } },
        },
      },
      exercises: {
        select: {
          exercise: {
            select: {
              id: true,
              slug: true,
              name: true,
              equipment: true,
              muscles: {
                select: {
                  role: true,
                  muscle: { select: { name: true, slug: true } },
                },
                orderBy: { role: "asc" },
              },
            },
          },
        },
      },
    },
  });

  // Collect regions (deduped + sorted)
  const regionMap = new Map<string, { slug: string; name: string; sortOrder: number }>();
  for (const m of movements) {
    const r = m.joint.region;
    if (!regionMap.has(r.slug)) {
      regionMap.set(r.slug, { slug: r.slug, name: r.name, sortOrder: r.sortOrder });
    }
  }
  const regions = Array.from(regionMap.values())
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map(({ slug, name }) => ({ slug, name }));

  // Build cells: regionSlug → movementColumn → exercises
  const cells: Record<string, Record<string, PlannerExercise[]>> = {};
  // Track exercise IDs per (region, column) to avoid duplicates when multiple
  // movements within a region collapse to the same column key.
  const seen: Record<string, Record<string, Set<string>>> = {};

  for (const m of movements) {
    const region = m.joint.region;
    const colKey = deriveMovementColumnKey(m.name, region.name);

    if (!cells[region.slug]) cells[region.slug] = {};
    if (!cells[region.slug][colKey]) cells[region.slug][colKey] = [];
    if (!seen[region.slug]) seen[region.slug] = {};
    if (!seen[region.slug][colKey]) seen[region.slug][colKey] = new Set();

    for (const link of m.exercises) {
      const ex = link.exercise;
      if (seen[region.slug][colKey].has(ex.id)) continue;
      seen[region.slug][colKey].add(ex.id);
      cells[region.slug][colKey].push({
        id: ex.id,
        slug: ex.slug,
        name: ex.name,
        equipment: Array.from(new Set(ex.equipment.map(normalizeEquipment))),
        muscles: ex.muscles.map((em) => ({
          role: em.role,
          name: em.muscle.name,
          slug: em.muscle.slug,
        })),
      });
    }
  }

  // Sort exercises in each cell by name for stable ordering
  for (const region of Object.values(cells)) {
    for (const list of Object.values(region)) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  // Sort movement columns: pair-based anatomical order, hand-specific moves at the end.
  const orderHints = [
    "Flexion",
    "Extension",
    "Upper Flexion",
    "Upper Extension",
    "Lateral Flexion",
    "Rotation",
    "Upper Rotation",
    "Abduction",
    "Adduction",
    "Horizontal Abduction",
    "Horizontal Adduction",
    "Internal Rotation",
    "External Rotation",
    "Pronation",
    "Supination",
    "Dorsiflexion",
    "Plantarflexion",
    "Inversion",
    "Eversion",
    "Elevation",
    "Depression",
    "Protraction",
    "Retraction",
    "Upward Rotation",
    "Downward Rotation",
    "Finger Flexion",
    "Finger Extension",
    "Finger Abduction",
    "Finger Adduction",
    "Thumb Flexion",
    "Thumb Extension",
    "Thumb Abduction",
    "Thumb Adduction",
    "Thumb Opposition",
  ];
  const orderIndex = (label: string) => {
    const exact = orderHints.indexOf(label);
    return exact !== -1 ? exact : 999;
  };

  // Collect every unique movement column across all regions
  const columnSet = new Set<string>();
  for (const region of Object.values(cells)) {
    for (const col of Object.keys(region)) columnSet.add(col);
  }
  const movementColumns = Array.from(columnSet).sort((a, b) => {
    const oa = orderIndex(a);
    const ob = orderIndex(b);
    if (oa !== ob) return oa - ob;
    return a.localeCompare(b);
  });

  // Collect all equipment values across all exercises
  const equipmentSet = new Set<string>();
  for (const region of Object.values(cells)) {
    for (const list of Object.values(region)) {
      for (const ex of list) {
        for (const eq of ex.equipment) equipmentSet.add(eq);
      }
    }
  }
  const equipment = Array.from(equipmentSet).sort();

  return { regions, movementColumns, cells, equipment };
}

// ─── Sources ─────────────────────────────────────────────────────────────────

export async function getSources() {
  return prisma.researchSource.findMany({
    orderBy: { title: "asc" },
    include: {
      _count: { select: { entities: true } },
    },
  });
}

export async function getSource(slug: string) {
  return prisma.researchSource.findUnique({
    where: { slug },
    include: {
      entities: true,
    },
  });
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function searchEntities(query: string) {
  const q = `%${query}%`;

  const [regions, joints, movements, muscles, tasks, exercises] = await Promise.all([
    prisma.region.findMany({ where: { name: { contains: query, mode: "insensitive" } }, take: 5 }),
    prisma.joint.findMany({ where: { name: { contains: query, mode: "insensitive" } }, take: 5 }),
    prisma.movement.findMany({ where: { name: { contains: query, mode: "insensitive" } }, take: 5 }),
    prisma.muscle.findMany({ where: { name: { contains: query, mode: "insensitive" } }, take: 5 }),
    prisma.functionalTask.findMany({ where: { name: { contains: query, mode: "insensitive" } }, take: 5 }),
    prisma.exercise.findMany({ where: { name: { contains: query, mode: "insensitive" } }, take: 5 }),
  ]);

  return {
    regions: regions.map((r) => ({ ...r, entityType: "region" as const })),
    joints: joints.map((j) => ({ ...j, entityType: "joint" as const })),
    movements: movements.map((m) => ({ ...m, entityType: "movement" as const })),
    muscles: muscles.map((m) => ({ ...m, entityType: "muscle" as const })),
    tasks: tasks.map((t) => ({ ...t, entityType: "task" as const })),
    exercises: exercises.map((e) => ({ ...e, entityType: "exercise" as const })),
  };
}

// ─── Validation Queue ────────────────────────────────────────────────────────

export async function getValidationQueue() {
  const [
    draftItems,
    lowConfidenceItems,
    needsReviewItems,
  ] = await Promise.all([
    // Draft entities across all types
    Promise.all([
      prisma.region.findMany({ where: { status: "draft" }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.joint.findMany({ where: { status: "draft" }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.movement.findMany({ where: { status: "draft" }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.muscle.findMany({ where: { status: "draft" }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.functionalTask.findMany({ where: { status: "draft" }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.exercise.findMany({ where: { status: "draft" }, select: { slug: true, name: true, status: true, confidence: true } }),
    ]),
    // Low confidence (< 0.6) across all types
    Promise.all([
      prisma.region.findMany({ where: { confidence: { lt: 0.6 } }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.joint.findMany({ where: { confidence: { lt: 0.6 } }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.movement.findMany({ where: { confidence: { lt: 0.6 } }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.muscle.findMany({ where: { confidence: { lt: 0.6 } }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.functionalTask.findMany({ where: { confidence: { lt: 0.6 } }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.exercise.findMany({ where: { confidence: { lt: 0.6 } }, select: { slug: true, name: true, status: true, confidence: true } }),
    ]),
    // Needs review
    Promise.all([
      prisma.region.findMany({ where: { status: "needs_review" }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.joint.findMany({ where: { status: "needs_review" }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.movement.findMany({ where: { status: "needs_review" }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.muscle.findMany({ where: { status: "needs_review" }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.functionalTask.findMany({ where: { status: "needs_review" }, select: { slug: true, name: true, status: true, confidence: true } }),
      prisma.exercise.findMany({ where: { status: "needs_review" }, select: { slug: true, name: true, status: true, confidence: true } }),
    ]),
  ]);

  const typeLabels = ["region", "joint", "movement", "muscle", "task", "exercise"] as const;

  const formatItems = (arrays: any[][], label: string) =>
    arrays.flatMap((arr, i) =>
      arr.map((item: any) => ({ ...item, entityType: typeLabels[i], category: label }))
    );

  return {
    draft: formatItems(draftItems, "draft"),
    lowConfidence: formatItems(lowConfidenceItems, "low-confidence"),
    needsReview: formatItems(needsReviewItems, "needs-review"),
  };
}

// Score-ranked exercise worklist: the lowest-scoring exercises first, each with
// its weakest dimension and any unresolved audit flags surfaced so a reviewer
// knows exactly what to fix. This is the actionable companion to getValidationQueue.
export async function getExerciseWorklist() {
  const exercises = await prisma.exercise.findMany({
    select: {
      slug: true, name: true, status: true, qualityScore: true, scoreBreakdown: true, notes: true, provenance: true,
      _count: { select: { muscles: true, movements: true, cues: true, sources: true } },
    },
    orderBy: [{ qualityScore: "asc" }, { name: "asc" }],
  });

  return exercises.map((ex) => {
    const bd = (ex.scoreBreakdown as any) || {};
    // weakest dimension by fraction of its max
    const dims = [
      { key: "evidence", max: 30 }, { key: "coherence", max: 30 },
      { key: "completeness", max: 25 }, { key: "rigor", max: 15 },
    ]
      .map((d) => ({ key: d.key, frac: bd[d.key] ? bd[d.key].score / d.max : 0, notes: bd[d.key]?.notes ?? [] }))
      .sort((a, b) => a.frac - b.frac);
    const weakest = dims[0];
    const notes = ex.notes ?? "";
    const highFlags = (notes.match(/AUDIT\[high\]/g) || []).length;
    const medFlags = (notes.match(/AUDIT\[medium\]/g) || []).length;
    return {
      slug: ex.slug, name: ex.name, status: ex.status, provenance: ex.provenance,
      score: ex.qualityScore,
      weakestDim: weakest?.key,
      weakestNote: weakest?.notes?.[0] ?? null,
      noMuscles: ex._count.muscles === 0,
      noMovements: ex._count.movements === 0,
      highFlags, medFlags,
    };
  });
}
