import { prisma, logSection, logCount } from "../client";
import { MuscleRole } from "@prisma/client";

/**
 * Foot/toe movements — the roster lacked metatarsophalangeal (toe) motions, so
 * the toe drills (active hallux extension, toe yoga) had muscles but no joint
 * link. Adds a toe MTP joint + hallux/toe flexion & extension movements (with
 * ROM and muscle links), then wires the toe exercises and a couple of
 * mis-linked hip/gait exercises to their existing movements.
 *
 * Note: breathwork, sensory/vestibular, and pelvic-floor (isometric) exercises
 * legitimately have NO joint movement and are intentionally left unlinked.
 */

const MOVEMENTS = [
  {
    slug: "hallux-extension", name: "Hallux Extension", plane: "sagittal",
    aromMin: 0, aromMax: 70, romSource: "AAOS Joint Motion",
    romNotes: "First metatarsophalangeal (great toe) extension; ~70° active, higher passively. Needed for terminal stance / push-off.",
    muscles: [["extensor-hallucis-longus", "primary"], ["extensor-digitorum-longus", "secondary"]],
  },
  {
    slug: "toe-flexion", name: "Toe Flexion (MTP)", plane: "sagittal",
    aromMin: 0, aromMax: 40, romSource: "AAOS Joint Motion",
    romNotes: "Lesser-toe metatarsophalangeal flexion; ~40°. Contributes to grip/propulsion in the foot.",
    muscles: [["flexor-digitorum-longus", "primary"], ["flexor-hallucis-longus", "secondary"]],
  },
  {
    slug: "toe-extension", name: "Toe Extension (MTP)", plane: "sagittal",
    aromMin: 0, aromMax: 40, romSource: "AAOS Joint Motion",
    romNotes: "Lesser-toe metatarsophalangeal extension; ~40°, more passively. Assessed in windlass/push-off mechanics.",
    muscles: [["extensor-digitorum-longus", "primary"], ["extensor-hallucis-longus", "secondary"]],
  },
];

// exercise slug → movement slugs to link (existing or newly added)
const EXERCISE_LINKS: Record<string, string[]> = {
  "active-hallux-extension": ["hallux-extension"],
  "toe-yoga": ["toe-flexion", "toe-extension", "hallux-extension"],
  "hip-airplane": ["hip-external-rotation", "hip-abduction", "hip-extension"],
  "standing-march-in-place": ["hip-flexion", "knee-flexion"],
};

export async function seedFootToeMovementsExtension() {
  logSection("Foot/toe movements + link fixes");

  const ankle = await prisma.region.findFirst({ where: { slug: "ankle" }, select: { id: true } });
  if (!ankle) { console.log("    (ankle region missing — skipping)"); return; }

  // Toe MTP joint
  const joint = await prisma.joint.upsert({
    where: { slug: "toe-mtp" },
    update: {},
    create: { slug: "toe-mtp", name: "Metatarsophalangeal Joints (Toes)", jointType: "condyloid", regionId: ankle.id, status: "draft", confidence: 0.6 },
    select: { id: true },
  });

  const muscleMap = new Map((await prisma.muscle.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]));

  let movN = 0;
  for (const mv of MOVEMENTS) {
    const movement = await prisma.movement.upsert({
      where: { slug: mv.slug },
      update: { aromMin: mv.aromMin, aromMax: mv.aromMax, romUnit: "degrees", romSource: mv.romSource, romNotes: mv.romNotes },
      create: {
        slug: mv.slug, name: mv.name, plane: mv.plane, jointId: joint.id,
        aromMin: mv.aromMin, aromMax: mv.aromMax, romUnit: "degrees", romSource: mv.romSource, romNotes: mv.romNotes,
        status: "draft", confidence: 0.6,
      },
      select: { id: true },
    });
    for (const [mslug, role] of mv.muscles) {
      const muscleId = muscleMap.get(mslug);
      if (!muscleId) continue;
      await prisma.movementMuscle.upsert({
        where: { movementId_muscleId: { movementId: movement.id, muscleId } },
        update: { role: role as MuscleRole },
        create: { movementId: movement.id, muscleId, role: role as MuscleRole },
      });
    }
    movN++;
  }

  const movMap = new Map((await prisma.movement.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]));
  let linkN = 0;
  for (const [exSlug, movs] of Object.entries(EXERCISE_LINKS)) {
    const ex = await prisma.exercise.findUnique({ where: { slug: exSlug }, select: { id: true } });
    if (!ex) continue;
    for (const ms of movs) {
      const movementId = movMap.get(ms);
      if (!movementId) continue;
      await prisma.exerciseMovement.upsert({
        where: { exerciseId_movementId: { exerciseId: ex.id, movementId } },
        update: {}, create: { exerciseId: ex.id, movementId },
      });
      linkN++;
    }
  }

  logCount("toe movements added", movN);
  console.log(`    linked ${linkN} exercise-movement pairs`);
}
