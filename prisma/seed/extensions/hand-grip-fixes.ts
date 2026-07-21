import { prisma, logSection, logCount } from "../client";
import { MuscleRole } from "@prisma/client";

/**
 * Hand data fixes — connects hand exercises that were missing their muscle and
 * movement links (surfaced by the quality scorer's coherence validator).
 *
 * grip-squeeze-and-release had 0 muscles / 0 movements. Power (gross) grip is
 * well-characterised biomechanically: the long finger flexors generate the force,
 * the thenar/adductor complex opposes it, the intrinsics flex the MCPs, and the
 * wrist extensors co-contract to hold the wrist in slight extension for optimal
 * flexor length-tension (the reason grip strength collapses in wrist flexion).
 */

type MuscleRoleSpec = { muscleSlug: string; role: MuscleRole; notes?: string };
type ExerciseFix = {
  slug: string;
  dosing?: string;
  emgNotes?: string;
  evidenceLevel?: string;
  bodyPosition?: string;
  movementSlugs: string[];
  muscleRoles: MuscleRoleSpec[];
  cues?: { text: string; cueType?: string }[];
  regressions?: { name: string; description: string }[];
  progressions?: { name: string; description: string }[];
  notes?: string;
};

const fixes: ExerciseFix[] = [
  {
    slug: "grip-squeeze-and-release",
    dosing: "10 reps × 2–3 sets, 2–3×/day; hold each squeeze 3–5 s. Progress putty/ball resistance as tolerated.",
    emgNotes:
      "Power grip is driven by FDP and FDS; grip force correlates with their activation. Wrist extensors (ECRB/ECRL) co-activate strongly to stabilise the wrist in ~30° extension — grip strength drops markedly with the wrist flexed (Fong & Ng 2001; O'Driscoll 1992).",
    evidenceLevel: "moderate",
    bodyPosition: "seated",
    movementSlugs: ["finger-flexion", "pip-flexion", "dip-flexion", "thumb-adduction"],
    muscleRoles: [
      { muscleSlug: "flexor-digitorum-profundus", role: "primary", notes: "Distal phalanx flexion; principal power-grip force generator" },
      { muscleSlug: "flexor-digitorum-superficialis", role: "primary", notes: "PIP flexion; grip force" },
      { muscleSlug: "flexor-pollicis-longus", role: "secondary", notes: "Thumb IP flexion clamps the object" },
      { muscleSlug: "adductor-pollicis", role: "secondary", notes: "Thumb adduction generates opposing clamp force" },
      { muscleSlug: "flexor-pollicis-brevis", role: "secondary", notes: "Thumb MCP flexion for grasp" },
      { muscleSlug: "lumbricals", role: "synergist", notes: "MCP flexion contribution" },
      { muscleSlug: "palmar-interossei", role: "synergist", notes: "MCP flexion / finger stabilisation during squeeze" },
      { muscleSlug: "extensor-carpi-radialis-brevis", role: "stabilizer", notes: "Co-contracts to hold wrist extension for optimal flexor length-tension" },
      { muscleSlug: "extensor-carpi-radialis-longus", role: "stabilizer", notes: "Wrist extension stabiliser during grip" },
      { muscleSlug: "flexor-carpi-ulnaris", role: "stabilizer", notes: "Wrist stabilisation against grip torque" },
    ],
    cues: [
      { text: "Squeeze slowly and fully, then open the hand all the way — both directions matter", cueType: "verbal" },
      { text: "Keep the wrist straight or slightly back, not bent forward", cueType: "verbal" },
      { text: "Wrap the thumb around to meet the fingers for a full power grip", cueType: "verbal" },
      { text: "Feel the forearm muscles work, not just the fingers", cueType: "tactile" },
    ],
    regressions: [
      { name: "Softer Resistance", description: "Use a softer ball or lighter putty, or squeeze a rolled towel." },
      { name: "Assisted Release", description: "Use the other hand to help open the fingers if extension is limited." },
    ],
    progressions: [
      { name: "Firmer Putty / Gripper", description: "Advance to firmer putty or a spring hand-gripper as strength improves." },
      { name: "Sustained Holds", description: "Hold each squeeze 10 s to build grip endurance." },
    ],
    notes: "Muscle/movement links added 2026-07-11 to fix a coherence gap (was 0 muscles / 0 movements). Grip biomechanics well established.",
  },
];

export async function seedHandGripFixesExtension() {
  logSection("Hand grip fixes (coherence repair)");

  const [movs, muscs] = await Promise.all([
    prisma.movement.findMany({ select: { id: true, slug: true } }),
    prisma.muscle.findMany({ select: { id: true, slug: true } }),
  ]);
  const movementMap = new Map(movs.map((m) => [m.slug, m.id]));
  const muscleMap = new Map(muscs.map((m) => [m.slug, m.id]));

  for (const fx of fixes) {
    const exercise = await prisma.exercise.findUnique({ where: { slug: fx.slug }, select: { id: true } });
    if (!exercise) throw new Error(`Exercise not found (fix target): ${fx.slug}`);

    await prisma.exercise.update({
      where: { id: exercise.id },
      data: {
        ...(fx.dosing ? { dosing: fx.dosing } : {}),
        ...(fx.emgNotes ? { emgNotes: fx.emgNotes } : {}),
        ...(fx.evidenceLevel ? { evidenceLevel: fx.evidenceLevel } : {}),
        ...(fx.bodyPosition ? { bodyPosition: fx.bodyPosition } : {}),
        ...(fx.notes ? { notes: fx.notes } : {}),
      },
    });

    for (const ms of fx.movementSlugs) {
      const movementId = movementMap.get(ms);
      if (!movementId) throw new Error(`Movement not found: ${ms}`);
      await prisma.exerciseMovement.upsert({
        where: { exerciseId_movementId: { exerciseId: exercise.id, movementId } },
        update: {},
        create: { exerciseId: exercise.id, movementId },
      });
    }

    for (const mr of fx.muscleRoles) {
      const muscleId = muscleMap.get(mr.muscleSlug);
      if (!muscleId) throw new Error(`Muscle not found: ${mr.muscleSlug}`);
      await prisma.exerciseMuscle.upsert({
        where: { exerciseId_muscleId: { exerciseId: exercise.id, muscleId } },
        update: { role: mr.role, notes: mr.notes },
        create: { exerciseId: exercise.id, muscleId, role: mr.role, notes: mr.notes },
      });
    }

    if (fx.cues) {
      await prisma.cue.deleteMany({ where: { exerciseId: exercise.id } });
      for (let i = 0; i < fx.cues.length; i++) {
        await prisma.cue.create({ data: { text: fx.cues[i].text, cueType: fx.cues[i].cueType ?? "verbal", order: i, exerciseId: exercise.id } });
      }
    }
    if (fx.regressions) {
      await prisma.regression.deleteMany({ where: { exerciseId: exercise.id } });
      for (let i = 0; i < fx.regressions.length; i++) {
        await prisma.regression.create({ data: { name: fx.regressions[i].name, description: fx.regressions[i].description, order: i, exerciseId: exercise.id } });
      }
    }
    if (fx.progressions) {
      await prisma.progression.deleteMany({ where: { exerciseId: exercise.id } });
      for (let i = 0; i < fx.progressions.length; i++) {
        await prisma.progression.create({ data: { name: fx.progressions[i].name, description: fx.progressions[i].description, order: i, exerciseId: exercise.id } });
      }
    }
  }

  logCount("hand exercises repaired", fixes.length);
}
