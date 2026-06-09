import { prisma, logSection, logCount } from "../client"
import { MuscleRole } from "@prisma/client"

/**
 * Movement primitives + Pelvic floor — OpenEvidence responses
 * 2026-06-09 (Task 4 + Task 5).
 *
 * Sources:
 *   research/oe-movement-primitives-2026-06-09-response.md
 *   research/oe-pelvic-floor-2026-06-09-response.md
 *
 * Task 4 adds 5 movement primitives whose corrective exercises
 * weren't yet in the catalog. The remaining 7 primitives in the OE
 * response map to existing entries (deep-neck-flexor-training,
 * push-up-plus, sleeper-stretch, half-kneeling-hip-flexor-stretch,
 * arch-doming, diaphragmatic-breathing-with-bracing, scapular-
 * retraction-exercise, etc).
 *
 * Task 5 adds 6 pelvic floor exercises — entirely new clinical
 * territory for the catalog (3 uptrain, 3 downtrain).
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
  // ─── Task 4 — Movement primitives ──────────────────────────────────
  {
    slug: "hip-airplane",
    name: "Hip Airplane",
    description:
      "Single-leg stance, hinge forward into a near-horizontal position. From there, slowly rotate the trunk internally toward the stance hip, then externally — like wings of a plane tilting. Controls hip internal/external rotation under single-leg load.",
    dosing: "3 × 8 reps per side, slow tempo (3 s each direction), 3×/week.",
    evidenceLevel: "moderate",
    difficulty: "advanced",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.8,
    notes:
      "Uniquely loads gluteus medius/minimus in all 3 planes simultaneously — replicating gait stance-phase demands. Progress from wall- or hand-supported to free-standing.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Stance leg slightly bent — never lock the knee", cueType: "verbal" },
      { text: "Rotation comes from the hip, not the spine — hold a stick across the shoulders to feel this", cueType: "tactile" },
    ],
    regressions: [
      { name: "Wall-Supported Hip Airplane", description: "Hand on wall through the rotation phase." },
    ],
    progressions: [
      { name: "Hip Airplane with Reach", description: "Add a contralateral arm reach to amplify rotation demand." },
    ],
  },
  {
    slug: "lateral-band-walk",
    name: "Lateral Band Walk (Monster Walk)",
    description:
      "Loop a band around the ankles or just above the knees. Drop into a quarter-squat (mini-squat). Step sideways slowly, maintaining tension on the band the entire time. Keep feet pointed forward and hips level.",
    dosing: "2 × 10–12 steps each direction, 2–3×/week.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "standing",
    confidence: 0.85,
    notes:
      "Targets gluteus medius and posterior fibers in a frontal-plane pattern. Studies show 33-58% MVIC gluteus medius activation depending on band placement.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Stay low — standing up cheats the glute med work", cueType: "verbal" },
      { text: "Trailing leg should NOT snap inward — control the return step", cueType: "verbal" },
    ],
    regressions: [{ name: "Standing Hip Abduction (No Band)", description: "Build pattern without band first." }],
    progressions: [{ name: "Monster Walk (Forward + Lateral)", description: "Walk forward in mini-squat with band on; alternate sides." }],
  },
  {
    slug: "crocodile-breathing",
    name: "Crocodile Breathing (Prone Diaphragmatic)",
    description:
      "Lie prone with forehead resting on stacked hands. Breathe so the belly presses into the floor on inhale and releases on exhale. The prone position gives clear proprioceptive feedback that the diaphragm is descending posteriorly into the lower ribs.",
    dosing: "5–10 minutes, 1–2×/day; especially valuable for users who chest-breathe.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "prone",
    confidence: 0.8,
    notes:
      "Classic PRI/Gray Cook teaching tool for diaphragmatic breath relearning. The floor gives unambiguous tactile feedback about belly expansion direction.",
    movementSlugs: [],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary" },
      { muscleSlug: "external-intercostals", role: "synergist" },
    ],
    cues: [
      { text: "Belly should push into the floor on every inhale", cueType: "tactile" },
      { text: "Low back should rise slightly with breath, then settle on exhale", cueType: "tactile" },
    ],
    regressions: [{ name: "Supine Diaphragmatic", description: "Same drill supine if prone is uncomfortable for the lumbar spine." }],
    progressions: [{ name: "Quadruped Diaphragmatic", description: "Hands and knees position challenges core + breath integration." }],
  },
  {
    slug: "active-hallux-extension",
    name: "Active Hallux Extension (Big Toe Lifts)",
    description:
      "Sitting or standing with feet flat. Lift ONLY the big toe (hallux) while keeping the lesser four toes pressed firmly into the floor. Hold 3 s at top. Distinct from toe yoga's alternating drill — this is hallux-isolated extension training for first-MTP function.",
    dosing: "15 reps × 2–3 sets per foot, daily.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.8,
    notes:
      "Targets functional hallux limitus. Strong correlation between active weight-bearing hallux dorsiflexion and gait first-MTP motion (r = 0.80). Standard prerequisite for plantar fascia, hallux valgus, and gait-mechanics rehab.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "If small toes lift along with the big toe, press the small toes down with a finger and try again", cueType: "tactile" },
      { text: "Most people can't isolate this at first — that's the training", cueType: "verbal" },
    ],
    regressions: [{ name: "Manual Hallux Extension Stretch", description: "Use the hand to passively lift the big toe to teach the end-range position." }],
    progressions: [{ name: "Single-Leg Standing Hallux Lifts", description: "Perform in single-leg stance for full proprioceptive load." }],
  },
  {
    slug: "ninety-ninety-hip-ir-stretch",
    name: "90/90 Hip Internal Rotation Stretch",
    description:
      "Seated on the floor with front leg at 90° hip flexion + 90° knee flexion, back leg at 90° abduction + 90° knee flexion (the '90/90' position). Lean forward over the front shin to stretch the front-hip external rotators and lengthen toward IR. Switch sides.",
    dosing: "30 s hold × 3 reps each side + 2 × 10 active IR transitions, daily for 6 wk.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.8,
    notes:
      "Standard internal-rotation mobility drill. Add active 90/90 transitions (rotating from one side to the other through both hips simultaneously) to train motor control alongside mobility.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Sit tall before leaning — don't round the spine to reach the shin", cueType: "verbal" },
      { text: "Back-leg knee may want to lift — use that as feedback for capsule restriction", cueType: "tactile" },
    ],
    regressions: [{ name: "Seated Cross-Leg IR Hold", description: "Simpler crossed-leg sit if 90/90 is unreachable." }],
    progressions: [{ name: "Active 90/90 Transitions", description: "Rotate hips actively from one 90/90 side to the other — trains hip rotation under load." }],
  },

  // ─── Task 5 — Pelvic floor (uptrain) ───────────────────────────────
  {
    slug: "pfm-sustained-hold",
    name: "Pelvic Floor Sustained Contraction (Kegel — Endurance)",
    description:
      "Contract the pelvic floor muscles as if stopping urine flow AND lifting the perineum upward toward the head. Hold 6–10 seconds, then fully relax for equal time. Progress hold time and positions over 12 weeks (supine → sitting → standing).",
    dosing: "8–12 reps × 3 sets/day. Progress hold to 10 s over 12 wk.",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    confidence: 0.9,
    notes:
      "Audience: postpartum, perimenopausal, general conditioning. Cochrane evidence: minimum 8 contractions × 2–10 s holds × 3×/day × 3–6 months; supervised programs outperform unsupervised. Common substitution errors: visible gluteal clenching, abdominal bracing, breath-holding (Valsalva).",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Breathe normally throughout the hold — breath-holding signals you're substituting", cueType: "verbal" },
      { text: "If glutes or inner thighs squeeze, the contraction is wrong — relax everything else", cueType: "tactile" },
      { text: "Imagine drawing a blueberry up into the body, not just clenching", cueType: "verbal" },
    ],
    regressions: [
      { name: "Shorter Hold (3-5 s)", description: "Build endurance from 3 s holds before progressing to 10 s." },
    ],
    progressions: [
      { name: "Standing PFM Holds", description: "Same drill in standing — adds gravity load." },
      { name: "Functional Integration", description: "Hold during sit-to-stand, light lifting, walking." },
    ],
  },
  {
    slug: "pfm-quick-flick",
    name: "Pelvic Floor Quick Flicks (Power Contractions)",
    description:
      "Rapid maximal pelvic floor contractions held 1–2 seconds each. Targets Type II fast-twitch fibers needed for cough/sneeze/laugh continence. Perform after each sustained-hold set.",
    dosing: "10 rapid reps after each set of sustained Kegels.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "supine",
    confidence: 0.8,
    notes:
      "Audience: postpartum, perimenopausal, general conditioning. Correct execution = brief visible perineal 'wink' without thigh adductor or gluteal co-contraction. If user bears down instead of lifting, the pattern is reversed (Valsalva).",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Fast in, fast out — full relaxation between reps", cueType: "verbal" },
      { text: "If you fatigue and the contraction weakens, stop the set — quality over quantity", cueType: "verbal" },
    ],
    regressions: [{ name: "Submaximal Quick Flicks", description: "50% intensity first to learn the rhythm." }],
    progressions: [{ name: "Quick Flicks in Standing", description: "Same drill standing." }],
  },
  {
    slug: "pfm-the-knack",
    name: "The Knack (Pre-Contraction for Functional Continence)",
    description:
      "Brisk pelvic floor contraction timed JUST BEFORE and DURING a cough, sneeze, lift, or sudden activity. Trains anticipatory PFM activation so the floor braces against pressure spikes.",
    dosing: "Practice 3–5×/day with coached cough first; then integrate into every cough/sneeze/lift for life.",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.9,
    notes:
      "Audience: postpartum, perimenopausal, stress incontinence, general conditioning. Correct execution = bladder-base elevation on ultrasound during cough. Incorrect (Valsalva) = bladder-base descent. Transversus abdominis co-activates gently. Glutes stay relaxed.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Contract BEFORE the cough/sneeze/lift — anticipation is the whole skill", cueType: "verbal" },
      { text: "Practice with intentional coughs first so you can feel the timing", cueType: "verbal" },
    ],
    regressions: [
      { name: "Knack with Light Effort", description: "Use a soft cough or light lift while learning the timing." },
    ],
    progressions: [
      { name: "Knack During Real Activities", description: "Apply automatically before any lift, cough, jump." },
    ],
  },

  // ─── Task 5 — Pelvic floor (downtrain) ─────────────────────────────
  {
    slug: "pfm-diaphragmatic-release",
    name: "Diaphragmatic Breathing with Pelvic Floor Release",
    description:
      "Slow 360° diaphragmatic inhale (4–6 s) while consciously letting the pelvic floor descend with the breath — NO active contraction. Gentle exhale; pelvic floor passively recoils. Re-trains downtrain in chronic PF tension.",
    dosing: "10 minutes, 1–2×/day.",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    confidence: 0.85,
    notes:
      "Audience: chronic pelvic pain, perimenopausal, general conditioning. Verification: hands on lower ribs feel lateral expansion (no chest rise); perineum bulges slightly on inhale. If user paradoxically contracts PFM on inhale, cue: 'let the belly AND pelvic floor drop toward the floor.' Glutes and adductors stay slack.",
    movementSlugs: [],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary" },
    ],
    cues: [
      { text: "Inhale: belly + pelvic floor drop. Exhale: passive recoil — no squeezing", cueType: "verbal" },
      { text: "If you feel a Kegel happening, you're doing the wrong drill — this is the opposite", cueType: "verbal" },
    ],
    regressions: [
      { name: "Side-Lying Breath", description: "Side-lying with knees curled in if supine triggers guarding." },
    ],
    progressions: [
      { name: "Standing PFM Release Breath", description: "Same drill in standing — harder; gravity assists." },
    ],
  },
  {
    slug: "pfm-sniff-flop-drop",
    name: "Sniff, Flop, and Drop (PFM Downtrain Technique)",
    description:
      "Three-part sequence: (1) quick abdominal SNIFF expanding the belly outward, (2) FLOP the stomach outward (easier in forward-kneeling), (3) DROP — consciously release pelvic floor sphincters. Combine with breath retraining. NOT a contraction technique.",
    dosing: "10–15 reps × 2×/day.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "kneeling",
    confidence: 0.7,
    notes:
      "Audience: chronic pelvic pain, general conditioning. Caution in prolapse or diastasis recti — requires PFPT assessment first. Correct execution = outward abdominal expansion + subjective sense of sphincter opening. Bearing down/straining = incorrect.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Hands on belly — abdomen expands outward, not chest up", cueType: "tactile" },
      { text: "Drop should feel like a sigh in the pelvis, not a push", cueType: "verbal" },
    ],
    regressions: [{ name: "Supine Sniff-Drop", description: "Skip the flop phase if forward-kneeling is uncomfortable." }],
    progressions: [{ name: "Standing Integration", description: "Use as a quick reset during prolonged sitting/standing." }],
  },
  {
    slug: "pfm-lengthening-positions",
    name: "Supported Pelvic Floor Lengthening Positions",
    description:
      "Static holds in gravity-assisted positions that passively lengthen the pelvic floor. Modified butterfly (supine, soles together, knees apart) was most effective for PFM relaxation on sEMG, followed by deep squat with yoga block and child's pose. Hold 60–90 s with diaphragmatic breathing.",
    dosing: "60–90 s hold × 3–5 cycles per position, 1×/day.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["yoga-block"],
    bodyPosition: "supine",
    confidence: 0.75,
    notes:
      "Audience: chronic pelvic pain, postpartum (after tissue healing), general conditioning. sEMG shows decreased resting tone vs supine baseline. Subjective sense of 'opening' or 'heaviness' in perineum is desired — NOT bearing down. Modify (add bolster) if pain or guarding increases.",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Soles together, knees apart and supported by pillows if they fall too low", cueType: "tactile" },
      { text: "Combine each hold with slow diaphragmatic breathing — the breath IS the release mechanism", cueType: "verbal" },
    ],
    regressions: [{ name: "Bolstered Butterfly", description: "Pillows under both knees so they don't drop into discomfort." }],
    progressions: [
      { name: "Deep Squat with Block", description: "Sit on a yoga block in a deep squat — block supports without sacrificing range." },
      { name: "Sequenced Flow", description: "Cycle through butterfly → deep squat → child's pose, 60 s each, with breath." },
    ],
  },
]

export async function seedPrimitivesAndPfmExtension() {
  logSection("Movement primitives + Pelvic floor (OE 2026-06-09)")

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

  logCount("primitives + pfm exercises", exercises.length)
}
