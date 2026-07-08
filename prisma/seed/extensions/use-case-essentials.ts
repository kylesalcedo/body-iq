import { prisma, logSection, logCount } from "../client"
import { MuscleRole } from "@prisma/client"

/**
 * Use-case stack essentials — supporting exercises for the 9 use-case
 * stacks authored from literature review response 2026-06-08 (Task 2).
 *
 * Source: research/evidence-use-case-stacks-2026-06-08-response.md
 *
 * Each stack composes 7 exercises that need to exist as discrete
 * library entries. Most components were already in the catalog —
 * this file adds the 17 missing pieces so every stack item resolves
 * to a real exercises_v2 slug after sync.
 *
 * These are programming-grade entries — literature review flagged this batch as
 * "programming-based, no novel research." Evidence levels reflect
 * clinical/expert consensus rather than RCT depth.
 */

type MuscleRoleSpec = { muscleSlug: string; role: MuscleRole; notes?: string }
type ExerciseSpec = {
  slug: string
  name: string
  description: string
  dosing?: string
  emgNotes?: string
  evidenceLevel?: string
  difficulty?: string
  equipment?: string[]
  bodyPosition?: string
  confidence?: number
  movementSlugs: string[]
  muscleRoles: MuscleRoleSpec[]
  cues: { text: string; cueType?: string }[]
  regressions: { name: string; description: string }[]
  progressions: { name: string; description: string }[]
  notes?: string
}

const exercises: ExerciseSpec[] = [
  // ─── Hand / Forearm ────────────────────────────────────────────────
  {
    slug: "grip-squeeze-and-release",
    name: "Grip Squeeze and Release",
    description: "Make a firm fist (squeeze a stress ball if available), hold briefly, then fully open the hand with the fingers spread wide. Trains forearm flexor strength and extensor recruitment."during keyboard work.",
    evidenceLevel: "expert-opinion",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.7,
    notes: "Standard hand-therapy micro-break for typing recovery.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Squeeze hard enough to feel the forearm contract", cueType: "verbal" },
      { text: "Open fully — fingers spread wide, not just relaxed", cueType: "verbal" },
    ],
    regressions: [{ name: "Half-Range Squeeze", description: "Partial fist if full grip is painful." }],
    progressions: [{ name: "Resisted Hand Gripper", description: "Add a graded hand gripper for progressive load." }],
  },

  // ─── Trunk / Posture (mid-meeting friendly) ───────────────────────
  {
    slug: "seated-trunk-rotation",
    name: "Seated Trunk Rotation",
    description:
      "Sit tall, hands on opposite knee. Gently rotate the upper body toward that side, keeping hips and pelvis square forward. Trains thoracic rotation in a desk-compatible posture.",
    dosing: "5 reps each side, hold end-range 2 s.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.75,
    notes: "Camera-friendly micro-mobility for video calls.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Hips stay forward — only the trunk turns", cueType: "verbal" },
      { text: "Eyes follow the rotation to add cervical contribution", cueType: "verbal" },
    ],
    regressions: [{ name: "Smaller Range", description: "Half rotation until comfort builds." }],
    progressions: [{ name: "Open Book Variation", description: "Add arm reach overhead and behind for greater range." }],
  },
  {
    slug: "isometric-glute-squeeze",
    name: "Isometric Glute Squeeze",
    description: "Seated or standing, contract both glutes maximally and hold, with no visible movement, purely isometric. Reactivates the posterior chain during prolonged sitting.".",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.7,
    notes: "Camera-invisible; useful during meetings.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Squeeze as if pinching a coin between the cheeks", cueType: "verbal" },
      { text: "Keep breath flowing — don't hold breath during isometric", cueType: "verbal" },
    ],
    regressions: [{ name: "Single-Side Squeeze", description: "Alternate sides 5 s each if bilateral feels cramping." }],
    progressions: [{ name: "Standing Hip Thrust Hold", description: "Standing, posterior pelvic tilt + max glute squeeze." }],
  },

  // ─── Standing mobility (travel + walking-pad + 12-hr reset) ────────
  {
    slug: "standing-hip-circles",
    name: "Standing Hip Circles",
    description:
      "Standing, hand on wall for balance. Lift one knee to hip height and trace large circles with the knee, internal-rotation direction first then external. Opens the hip capsule.",
    dosing: "8 reps each direction, each leg.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.7,
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Knee leads the circle — let the hip move freely through its range", cueType: "verbal" },
      { text: "Stand tall; resist arching the low back to make a bigger circle", cueType: "verbal" },
    ],
    regressions: [{ name: "Seated Hip Circles", description: "Perform seated to remove balance demand." }],
    progressions: [{ name: "90/90 Transitions", description: "Floor-based 90/90 hip rotations for full capsule mobility." }],
  },
  {
    slug: "standing-figure-4-stretch",
    name: "Standing Figure-4 Stretch",
    description:
      "Standing, place one ankle on the opposite thigh just above the knee. Sit back into a partial squat with the standing leg, keeping the lifted shin parallel to the floor. Glute / piriformis stretch.",
    dosing: "30 s each side, 1–2 rounds.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.75,
    notes: "Standing variant of supine figure-4 — useful when getting to the floor isn't practical (travel, work).",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Hold a counter or doorframe for balance", cueType: "tactile" },
      { text: "Sit back as if into a chair — depth controls intensity", cueType: "verbal" },
    ],
    regressions: [{ name: "Seated Figure-4", description: "Sit on a chair, ankle on opposite knee, lean forward." }],
    progressions: [{ name: "Supine Figure-4 with Pull", description: "Floor variant with active arm pull for deeper stretch." }],
  },
  {
    slug: "walking-lunges-with-rotation",
    name: "Walking Lunges with Trunk Rotation",
    description:
      "Step into a forward lunge. At the bottom, rotate the trunk toward the front leg, then return. Step the back foot forward to begin the next lunge on the other side. Integrates lower-body load with thoracic mobility.",
    dosing: "5 reps each side.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.75,
    notes: "Full kinetic-chain integration; useful as post-travel reset.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Front knee tracks over toes; back knee close to floor", cueType: "verbal" },
      { text: "Rotate from the upper back, not the low back", cueType: "verbal" },
    ],
    regressions: [{ name: "Stationary Lunge with Rotation", description: "Stay in place; don't walk the lunge forward." }],
    progressions: [{ name: "Loaded Lunge with Rotation", description: "Hold a medicine ball or dumbbell during rotation." }],
  },
  {
    slug: "standing-march-in-place",
    name: "Standing March in Place",
    description:
      "Stand tall, alternately lift one knee toward hip height then the other. Maintain steady cadence and arm swing. Gradual HR step-down or warm-up.",
    dosing: "1 minute, ~60–80 steps/min.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.8,
    notes: "Standard active recovery / cool-down transition after walking-pad use.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Lift the knee, don't kick", cueType: "verbal" },
      { text: "Land softly through the ball of the foot", cueType: "verbal" },
    ],
    regressions: [{ name: "Seated March", description: "Perform seated, lifting knees alternately." }],
    progressions: [{ name: "High Knees", description: "Knees higher and faster cadence." }],
  },
  {
    slug: "standing-quad-stretch",
    name: "Standing Quad Stretch",
    description:
      "Standing, bend one knee and grab the ankle behind you, pulling the heel toward the glute. Keep knees together and pelvis neutral. Quadriceps + hip flexor stretch.",
    dosing: "25 s each side.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.85,
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Knees side by side — don't let the bent knee flare out", cueType: "verbal" },
      { text: "Tuck the pelvis under to intensify the hip flexor component", cueType: "verbal" },
    ],
    regressions: [{ name: "Wall-Supported", description: "Use a wall for balance with the free hand." }],
    progressions: [{ name: "Couch Stretch", description: "Top of foot on a couch/elevated surface; tall kneeling lunge for deeper hip flexor." }],
  },
  {
    slug: "standing-hamstring-stretch-foot-on-step",
    name: "Standing Hamstring Stretch (Foot on Step)",
    description:
      "Place one heel on a low step or chair, leg straight. Hinge forward from the hip with a flat back until you feel the hamstring stretch. Stop before the spine rounds.",
    dosing: "25 s each side.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.85,
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Hinge at the hip — chest leads down, not the head", cueType: "verbal" },
      { text: "Stop where the back is still flat; don't chase the toes", cueType: "verbal" },
    ],
    regressions: [{ name: "Lower Step", description: "Use a step closer to floor height." }],
    progressions: [{ name: "Active Toe Touch", description: "Standing toe touch with hinge — full posterior chain." }],
  },
  {
    slug: "standing-it-band-stretch",
    name: "Standing IT Band / Lateral Chain Stretch",
    description:
      "Standing, cross one leg behind the other. Reach the same-side arm overhead and lean away to stretch the side body from hip to underarm.",
    dosing: "20 s each side.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.7,
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Push the back-leg hip outward to load the IT band region", cueType: "verbal" },
      { text: "Lengthen up first, then lean to the side", cueType: "verbal" },
    ],
    regressions: [{ name: "Hands on Hips", description: "Skip the overhead arm reach." }],
    progressions: [{ name: "Side Angle with Bend", description: "Bend the front knee and deepen the side-bend." }],
  },

  // ─── Eye / vision (mid-day reset) ──────────────────────────────────
  {
    slug: "eye-break-20-20-20",
    name: "20-20-20 Eye Break",
    description:
      "Every 20 minutes of screen time, look at an object at least 20 feet away for at least 20 seconds. Relaxes the ciliary muscle and breaks accommodative fixation.",
    dosing: "20 s every 20 min of screen work (AAO recommendation).",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.85,
    notes: "American Academy of Ophthalmology recommendation for digital eye strain prevention.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Pick a specific distant target — a building, tree, or fixture", cueType: "verbal" },
      { text: "Blink fully a few times during the gaze — screens reduce blink rate", cueType: "verbal" },
    ],
    regressions: [{ name: "Shorter Distance", description: "Any point >10 ft is better than continued near gaze if 20 ft isn't available." }],
    progressions: [{ name: "Add Near-Far Rocking", description: "After the 20 s distance gaze, refocus to a near point and back 3–5 times." }],
  },
  {
    slug: "eye-palming",
    name: "Eye Palming",
    description:
      "Rub palms together briskly to warm them, close the eyes, and cup the warm palms gently over the closed eyes (without pressing the eyeballs). Combines darkness and warmth.",
    dosing: "30 s, 1–2×/day during long screen sessions.",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.55,
    notes: "Traditional yoga drishti technique. Evidence is largely qualitative.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Palms should not touch the eyeballs — light cupping only", cueType: "tactile" },
      { text: "Breathe slowly while palming", cueType: "verbal" },
    ],
    regressions: [{ name: "Closed-Eye Rest", description: "Just close the eyes for 30 s if rubbing palms isn't feasible." }],
    progressions: [{ name: "Palming + Body Scan", description: "Add a 2-minute body scan during palming." }],
  },
  {
    slug: "slow-eye-circles",
    name: "Slow Eye Circles",
    description:
      "Eyes only (head still), trace large slow circles with the gaze — clockwise then counter-clockwise. Aim for smooth, continuous movement without skipping.",
    dosing: "5 circles each direction.",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.55,
    notes: "Reduces extraocular muscle fatigue from sustained near focus.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Head stays completely still — only the eyes move", cueType: "verbal" },
      { text: "Move at a pace where the eyes never jerk or skip", cueType: "verbal" },
    ],
    regressions: [{ name: "Up-Down + Left-Right Only", description: "Cardinal directions only; skip the curves." }],
    progressions: [{ name: "Figure-8 Tracing", description: "Trace a figure-8 with gaze, then both directions." }],
  },
  {
    slug: "chin-tuck-with-overpressure",
    name: "Chin Tuck with Overpressure",
    description: "Sitting tall, use two fingers on the chin to gently press it straight back (not down) until you feel the back of the neck lengthen.".",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.8,
    notes: "Overpressure variant of basic chin tuck; deepens deep cervical flexor activation.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Chin moves straight back, not down — \"double chin\" cue", cueType: "verbal" },
      { text: "Stop pressure when the back of the neck lengthens; don't force", cueType: "verbal" },
    ],
    regressions: [{ name: "Chin Tuck (No Overpressure)", description: "Pure active chin tuck without finger pressure." }],
    progressions: [{ name: "Supine Chin Tuck Liftoff", description: "Lift the head 1 inch off the floor while maintaining chin tuck." }],
  },

  // ─── Foot / lower-leg (12-hr standing reset) ───────────────────────
  {
    slug: "toe-yoga",
    name: "Toe Yoga (Big Toe Up / 4 Toes Down)",
    description:
      "Sitting or standing with foot on floor: press the 4 small toes into the ground while lifting only the big toe. Then reverse — big toe down, 4 toes up. Trains foot intrinsic motor control.",
    dosing: "10 cycles each foot.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.75,
    notes: "Foot core paradigm (McKeon 2015); trains independent control of FHL/FHB vs FDL/FDB.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Most people can't isolate this at first — that's the point", cueType: "verbal" },
      { text: "Use a finger to physically hold down the toes that shouldn't move while training the others", cueType: "tactile" },
    ],
    regressions: [{ name: "Big Toe Lifts Only", description: "Lift just the big toe while all others stay down — no reverse." }],
    progressions: [{ name: "Standing Toe Yoga", description: "Perform in single-leg standing." }],
  },
  {
    slug: "tennis-ball-foot-roll",
    name: "Tennis Ball Foot Roll",
    description:
      "Place a tennis ball under the bare foot. Roll slowly along the arch from heel to forefoot, lingering on tender spots. Self-mobilizes plantar fascia + foot intrinsics.",
    dosing: "60 s each foot.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["tennis-ball"],
    bodyPosition: "seated",
    confidence: 0.75,
    notes: "Standard self-myofascial release for plantar fasciopathy and post-shift foot fatigue.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Moderate pressure — uncomfortable, not painful", cueType: "tactile" },
      { text: "Pause 5–10 s on the most tender spots", cueType: "verbal" },
    ],
    regressions: [{ name: "Lighter Pressure", description: "Reduce body weight on the ball if tender." }],
    progressions: [{ name: "Frozen Bottle Roll", description: "Use a frozen water bottle to add cryotherapy." }],
  },
  {
    slug: "supine-hamstring-stretch-strap",
    name: "Supine Hamstring Stretch (Strap-Assisted)",
    description:
      "Lie supine. Loop a strap or towel around the ball of one foot and lift the leg straight up, keeping the knee soft. Pull gently with the strap. Less compressive on the low back than seated forward folds.",
    dosing: "30 s each side.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["strap"],
    bodyPosition: "supine",
    confidence: 0.85,
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Slight bend in the knee is fine if hamstring is tight — straight line through the heel matters more than perfect extension", cueType: "verbal" },
      { text: "Opposite leg can be straight or bent — bent is easier on the low back", cueType: "verbal" },
    ],
    regressions: [{ name: "Bent-Knee Variant", description: "Lift the leg with the knee bent and pull the thigh toward the chest." }],
    progressions: [{ name: "Active Straight-Leg Raise", description: "Unassisted lift — trains hip flexor + core endurance alongside." }],
  },
]

export async function seedUseCaseEssentialsExtension() {
  logSection("Use-case stack essentials (literature review 2026-06-08 — Task 2)")

  const [movs, muscs] = await Promise.all([
    prisma.movement.findMany({ select: { id: true, slug: true } }),
    prisma.muscle.findMany({ select: { id: true, slug: true } }),
  ])
  const movementMap = new Map(movs.map((m) => [m.slug, m.id]))
  const muscleMap = new Map(muscs.map((m) => [m.slug, m.id]))

  for (const ex of exercises) {
    const exercise = await prisma.exercise.upsert({
      where: { slug: ex.slug },
      update: {
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
      },
      create: {
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
      },
    })

    for (const ms of ex.movementSlugs) {
      const movementId = movementMap.get(ms)
      if (!movementId) throw new Error(`Movement not found: ${ms} (exercise: ${ex.slug})`)
      await prisma.exerciseMovement.upsert({
        where: { exerciseId_movementId: { exerciseId: exercise.id, movementId } },
        update: {},
        create: { exerciseId: exercise.id, movementId },
      })
    }

    for (const mr of ex.muscleRoles) {
      const muscleId = muscleMap.get(mr.muscleSlug)
      if (!muscleId) throw new Error(`Muscle not found: ${mr.muscleSlug} (exercise: ${ex.slug})`)
      await prisma.exerciseMuscle.upsert({
        where: { exerciseId_muscleId: { exerciseId: exercise.id, muscleId } },
        update: { role: mr.role, notes: mr.notes },
        create: { exerciseId: exercise.id, muscleId, role: mr.role, notes: mr.notes },
      })
    }

    await prisma.cue.deleteMany({ where: { exerciseId: exercise.id } })
    for (let i = 0; i < ex.cues.length; i++) {
      await prisma.cue.create({
        data: {
          text: ex.cues[i].text,
          cueType: ex.cues[i].cueType ?? "verbal",
          order: i,
          exerciseId: exercise.id,
        },
      })
    }

    await prisma.regression.deleteMany({ where: { exerciseId: exercise.id } })
    for (let i = 0; i < ex.regressions.length; i++) {
      await prisma.regression.create({
        data: {
          name: ex.regressions[i].name,
          description: ex.regressions[i].description,
          order: i,
          exerciseId: exercise.id,
        },
      })
    }

    await prisma.progression.deleteMany({ where: { exerciseId: exercise.id } })
    for (let i = 0; i < ex.progressions.length; i++) {
      await prisma.progression.create({
        data: {
          name: ex.progressions[i].name,
          description: ex.progressions[i].description,
          order: i,
          exerciseId: exercise.id,
        },
      })
    }
  }

  logCount("use-case essentials", exercises.length)
}
