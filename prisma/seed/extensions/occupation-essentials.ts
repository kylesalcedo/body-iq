import { prisma, logSection, logCount } from "../client"
import { MuscleRole } from "@prisma/client"

/**
 * Occupation-stack essentials — supporting exercises for the 9
 * occupation-specific stacks (literature review response 2026-06-08, Task 3).
 *
 * Source: research/evidence-occupation-stacks-2026-06-08-response.md
 *
 * Adds 10 exercises that the occupation stacks reference but the
 * catalog was missing. Most other components (Pallof press, farmer's
 * carry, Turkish get-up, Nordic hamstring, side plank, hip-hinge
 * deadlift, prone Y-raise, etc.) were already present.
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
  {
    slug: "band-pull-apart",
    name: "Band Pull-Apart",
    description:
      "Stand or sit tall, holding a resistance band at chest height with both hands, palms down, shoulder-width apart. Pull the band outward by squeezing the shoulder blades together until the band reaches the chest. Return slowly.",
    dosing: "2–3 × 12–15 reps, 3–5×/week.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "standing",
    confidence: 0.85,
    notes: "Posterior shoulder / mid-trap activator; mid-trap and rhomboids 30–60% MVIC depending on band tension and elbow angle.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Squeeze the shoulder blades together, not the upper traps", cueType: "verbal" },
      { text: "Elbows soft and straight — don't bend on the pull", cueType: "verbal" },
    ],
    regressions: [{ name: "Lighter Band", description: "Use a lighter band or hold closer to the hands." }],
    progressions: [{ name: "Band Pull-Apart at 90°/120°", description: "Higher arm positions load the lower trapezius progressively." }],
  },
  {
    slug: "cook-hip-lift",
    name: "Cook Hip Lift (Single-Leg Bridge with Contralateral Hip Flexion)",
    description:
      "Supine, both knees bent. Pull one knee firmly toward chest with both hands (this locks the opposite hemipelvis). Press through the heel of the foot still on the floor to lift the hips. Bilateral pelvis stays level — no rotation.",
    dosing: "2 × 8–10 reps each side.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "supine",
    confidence: 0.8,
    notes: "Isolates gluteus maximus by inhibiting hip flexors via the held-knee position (Cook 2010). Reveals lumbar/hamstring substitution patterns.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Pull the held knee to chest hard enough to feel the back lengthen", cueType: "tactile" },
      { text: "If the lifting leg cramps in the hamstring, you've gone too high — lower the hip", cueType: "verbal" },
    ],
    regressions: [{ name: "Standard Glute Bridge", description: "Both feet on floor; build glute activation first." }],
    progressions: [{ name: "Cook Hip Lift with Band Press", description: "Press the held knee against a band loop for added glute med activation." }],
  },
  {
    slug: "scapular-clock",
    name: "Scapular Clock (Wall-Supported)",
    description:
      "Stand facing a wall, forearms and elbows in contact with the wall at shoulder height. Slide both forearms together in a slow circular pattern (clockwise then counter-clockwise), tracing a clock face. Scapulae glide around the rib cage throughout.",
    dosing: "5 circles each direction.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.75,
    notes: "Scapulothoracic control drill; restores upward rotation + posterior tilt patterns disrupted in fine-motor / sustained-posture occupations (musicians, surgeons).",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Forearms stay in light contact with the wall the entire circle", cueType: "tactile" },
      { text: "Move slowly — 6+ seconds per circle", cueType: "verbal" },
    ],
    regressions: [{ name: "Half-Range Clock", description: "Top half (12 → 3 → 6) only until shoulder is steady through full range." }],
    progressions: [{ name: "Resisted Clock", description: "Add a band around both wrists for serratus + lower trap load." }],
  },
  {
    slug: "prone-hip-extension-active",
    name: "Prone Hip Extension (Active, Slow Tempo)",
    description:
      "Prone, forehead on hands or floor, legs straight. Lift one leg toward the ceiling by squeezing the glute — knee stays soft straight, no lumbar arching. Hold 2 s at the top, lower over 3 s.",
    dosing: "2 × 8–10 reps each leg.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "prone",
    confidence: 0.8,
    notes: "Trains hip extension patterning to counter flexion dominance from sitting. Slow tempo prevents lumbar substitution.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Squeeze the glute first; let the leg follow", cueType: "verbal" },
      { text: "If you feel the low back working, lower the leg — height matters less than glute engagement", cueType: "verbal" },
    ],
    regressions: [{ name: "Quadruped Hip Extension", description: "Hands and knees with foot pushing toward ceiling; lower lumbar demand." }],
    progressions: [{ name: "Single-Leg Romanian Deadlift", description: "Standing variant integrates hip extension under load + balance." }],
  },
  {
    slug: "glute-bridge-with-march",
    name: "Glute Bridge with March",
    description:
      "Standard glute bridge held at the top. Slowly march one knee toward chest, lower, then the other — pelvis stays level (no rocking). Trains glute endurance + anti-rotation core.",
    dosing: "2 × 6–8 marches each side from a held bridge.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "supine",
    confidence: 0.8,
    notes: "Reactivates inhibited glutes (driver, desk worker) while challenging pelvic stability.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Hips stay level the entire time — picture a glass of water on each hip", cueType: "tactile" },
      { text: "March slowly; speed is not the goal", cueType: "verbal" },
    ],
    regressions: [{ name: "Static Glute Bridge Hold", description: "Hold the bridge 10–20 s without marching." }],
    progressions: [{ name: "Single-Leg Glute Bridge", description: "Extend one leg straight; bridge on the other." }],
  },
  {
    slug: "arch-doming",
    name: "Arch Doming (Short-Foot Exercise)",
    description:
      "Seated or standing with the foot flat. Without curling the toes, draw the ball of the foot toward the heel — the arch lifts as the foot 'shortens'. Hold 5 s. Distinct from toe yoga: this is intrinsic-arch isolation.",
    dosing: "10 reps × 2–3 sets per foot, daily.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.8,
    notes: "Foot core paradigm (McKeon 2015). Targets the abductor hallucis, flexor hallucis brevis, and intrinsic plantar musculature. Common substitution: curling the toes — this is INCORRECT.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Don't curl the toes — the toes stay long while the arch lifts", cueType: "verbal" },
      { text: "Imagine pulling the big toe toward the heel without bending it", cueType: "verbal" },
    ],
    regressions: [{ name: "Towel Scrunches", description: "Use a towel scrunch as an entry-level intrinsic foot drill if arch doming is too subtle to feel." }],
    progressions: [{ name: "Single-Leg Standing Arch Doming", description: "Perform in single-leg standing for full proprioceptive load." }],
  },
  {
    slug: "standing-lumbar-extension-press-up",
    name: "Standing Lumbar Extension",
    description:
      "Stand with hands on the low back, fingers pointing down. Lean backward as far as comfortable by extending the lumbar spine. Hold 3 seconds at end-range, return to neutral. McKenzie-style press-up performed standing.",
    dosing: "5–10 reps × 1–3 sets/day; more frequent if symptoms are flexion-aggravated.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.8,
    notes: "Standing variant of the prone press-up — useful for drivers, flight crew, and anyone who can't easily get to the floor for the prone version.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Hands support the low back as you lean — they're a hinge, not a push", cueType: "tactile" },
      { text: "Stop at the first sign of pain; chase comfort, not range", cueType: "verbal" },
    ],
    regressions: [{ name: "Hands on Counter", description: "Hands on a counter behind you for added support during the extension." }],
    progressions: [{ name: "Prone Press-Up", description: "Floor variant allows greater isolated lumbar extension." }],
  },
  {
    slug: "seated-figure-4-stretch",
    name: "Seated Figure-4 Stretch",
    description:
      "Seated, place one ankle on the opposite knee. Keep the back tall and gently lean forward at the hip until you feel a stretch in the glute / piriformis. Don't round the back to chase depth.",
    dosing: "30 s each side.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.85,
    notes: "Desk-friendly hip rotator stretch; useful at-the-chair option distinct from supine and standing variants.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Sit on the sit-bones, not the tailbone", cueType: "verbal" },
      { text: "Hinge at the hip — the chest leads forward, not the head", cueType: "verbal" },
    ],
    regressions: [{ name: "Crossed-Leg Sit", description: "Just cross the ankle on the opposite knee and sit upright without forward lean." }],
    progressions: [{ name: "Supine Figure-4 with Pull", description: "Floor variant with active arm pull for deeper stretch." }],
  },
  {
    slug: "diaphragmatic-breathing-with-bracing",
    name: "Diaphragmatic Breathing with Bracing",
    description:
      "Hands on lower abdomen and lateral ribs. Inhale through the nose, expanding into 360° (front, sides, back). On exhale, gently brace the abdominal wall (~30% of max) while continuing to breathe — sustaining intra-abdominal pressure without breath-holding.",
    dosing: "5 cycles × 2–3 sets before heavy lifting tasks.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "supine",
    confidence: 0.75,
    notes: "Bracing skill for lifting populations (construction, healthcare, parents). Distinct from passive diaphragmatic breathing — the value is sustained pressure WITHOUT Valsalva.",
    movementSlugs: [],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary" },
      { muscleSlug: "transversus-abdominis", role: "primary" },
    ],
    cues: [
      { text: "Brace as if expecting a light punch — not maximal, not breath-hold", cueType: "tactile" },
      { text: "Air should be able to flow in and out around the brace", cueType: "verbal" },
    ],
    regressions: [{ name: "Passive Diaphragmatic Breath", description: "Build the 360° breath without the brace first." }],
    progressions: [{ name: "Braced Load Lift", description: "Hold the brace through a light deadlift, suitcase carry, or sit-to-stand." }],
  },
  {
    slug: "pursed-lip-diaphragmatic-breathing",
    name: "Pursed-Lip Diaphragmatic Breathing",
    description:
      "Inhale slowly through the nose, then exhale through pursed lips (as if cooling soup) for twice the inhale duration. Combine with diaphragmatic mechanics — belly rises on inhale, falls on exhale.",
    dosing: "5–10 cycles × 2–3 sets/day; before/during long playing or breath-demanding work.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.8,
    notes: "Standard COPD breathing retraining technique. Useful for wind players to develop sustained breath control and reduce accessory muscle dependence.",
    movementSlugs: [],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary" },
      { muscleSlug: "external-intercostals", role: "synergist" },
    ],
    cues: [
      { text: "The exhale should be quiet — purse just enough to slow airflow, not strain", cueType: "verbal" },
      { text: "Shoulders stay relaxed; no upper-chest lift", cueType: "verbal" },
    ],
    regressions: [{ name: "Plain Diaphragmatic Breathing", description: "Drop the pursed-lip resistance until the 360° breath is comfortable." }],
    progressions: [{ name: "Pursed-Lip during Movement", description: "Maintain pursed-lip breathing during a walk or simple exercise." }],
  },
]

export async function seedOccupationEssentialsExtension() {
  logSection("Occupation stack essentials (literature review 2026-06-08 — Task 3)")

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

  logCount("occupation essentials", exercises.length)
}
