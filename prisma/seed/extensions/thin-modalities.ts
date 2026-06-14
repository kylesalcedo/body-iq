import { prisma, logSection, logCount } from "../client"
import { MuscleRole } from "@prisma/client"

/**
 * Thin-modality coverage — literature review response 2026-06-08.
 *
 * Source: research/evidence-thin-modalities-2026-06-08-response.md
 *
 * Adds discrete oculomotor, vestibular, breathing-variety, somatic/
 * interoceptive, and mindfulness-of-movement exercises that the
 * pre-existing catalog lacked (each region had <10 entries pre-sync).
 *
 * Several entries from the literature review response — Microbreak protocols,
 * Postural shifts, Attention-redirection patterns, Web-based active
 * break programs — were SKIPPED here because they describe protocol
 * patterns rather than discrete exercises and are better surfaced as
 * Featured Stacks in the consuming app.
 *
 * Most of these exercises have no musculoskeletal movement/muscle
 * graph since they are visual / vestibular / autonomic / attentional
 * in nature. Empty muscleRoles/movementSlugs is intentional. Where a
 * clear muscle linkage exists (breathing → diaphragm/intercostals),
 * we use it.
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
  // ─── (a) Oculomotor / Vision ────────────────────────────────────────
  {
    slug: "saccadic-eye-movements",
    name: "Saccadic Eye Movements",
    description:
      "Refixate the eyes rapidly between two near targets held ~2 ft apart, 1–2 ft from the face. Horizontal pairs first, then vertical. Aim for quick, symmetric, accurate jumps without overshooting.",
    dosing: "10–20 refixations × 2–3 sets per direction, daily.",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.6,
    notes:
      "AAP/AAO endorse structured saccade training as part of combined oculomotor protocols after concussion. Evidence for saccade training in isolation in mTBI remains limited [Master 2022 Pediatrics; AAO 2022].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Move only the eyes, keep the head still", cueType: "verbal" },
      { text: "Eyes should land on the target — no drift, no overshoot", cueType: "verbal" },
      { text: "If symptoms appear (nausea, fog), pause and rest before continuing", cueType: "verbal" },
    ],
    regressions: [
      { name: "Larger Target Separation", description: "Hold targets 3+ ft apart and farther from the face to reduce angular demand." },
    ],
    progressions: [
      { name: "Saccades with Background Motion", description: "Perform saccades against a moving visual background to add visual-vestibular conflict." },
    ],
  },
  {
    slug: "smooth-pursuit-tracking",
    name: "Smooth Pursuit Tracking",
    description:
      "Follow a near target with both eyes as it moves slowly and steadily through ~160° horizontally and ~120° vertically, 1–2 ft from the face. Pursuit should be smooth — no jerks, no head turn.",
    dosing: "2–3 horizontal sweeps + 2–3 vertical sweeps, 1–2×/day.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.7,
    notes:
      "Used in BEEMS protocol for multiple sclerosis (twice weekly supervised) and post-concussion vision rehab [Hebert 2018; AAP/AAO 2022].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Keep the head still — only the eyes move", cueType: "verbal" },
      { text: "Track at a comfortable speed where pursuit stays smooth", cueType: "verbal" },
    ],
    regressions: [
      { name: "Reduced Excursion", description: "Use a smaller arc (60–80°) until pursuit stays smooth without symptoms." },
    ],
    progressions: [
      { name: "Pursuit with Cognitive Load", description: "Add a simple counting or naming task while tracking." },
    ],
  },
  {
    slug: "convergence-push-ups",
    name: "Convergence Push-Ups (Near-Far Convergence)",
    description:
      "Hold a small near target (pencil tip, letter card) at arm's length and slowly bring it toward the bridge of the nose while keeping the target single. Use a background card to monitor physiological diplopia and detect suppression.",
    dosing: "15 min/day, 5 days/week (CITT protocol).",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.9,
    notes:
      "Office-based vergence/accommodative therapy (weekly 60-min sessions + 15 min/day home) was superior to home pencil push-ups and placebo in children with symptomatic convergence insufficiency [CITT — Scheiman 2020 Cochrane; Chang 2021 Ophthalmology].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Stop when the target doubles — that's your near point of convergence", cueType: "verbal" },
      { text: "Use a background card behind the target to see physiological diplopia of the background", cueType: "verbal" },
    ],
    regressions: [
      { name: "Brock String (Two-Bead)", description: "Use a Brock string with only two beads at fixed distances — easier vergence target than free push-ups." },
    ],
    progressions: [
      { name: "Jump Convergence", description: "Alternate fixation between a far target and a near target without smooth approach — trains step vergence." },
    ],
  },
  {
    slug: "vor-x1-gaze-stabilization",
    name: "Gaze Stabilization — VOR ×1",
    description:
      "Fixate a stationary target at arm's length while rotating the head side-to-side, then up-and-down, at a pace where the target stays in focus. Foundational vestibular adaptation drill.",
    dosing: "20–30 minutes/day total, split across 4–5 sessions (ANPT/APTA guideline).",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.95,
    notes:
      "Level I evidence: significantly improves dynamic visual acuity and reduces disequilibrium vs smooth-pursuit-only controls [Hall 2022 JNPT — ANPT/APTA CPG].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Keep the target in clear focus throughout the head movement", cueType: "verbal" },
      { text: "Increase head speed only as long as the target stays sharp", cueType: "verbal" },
      { text: "If dizziness builds, slow down and shorten duration — do not push through", cueType: "verbal" },
    ],
    regressions: [
      { name: "Seated, Plain Background", description: "Perform seated against a blank wall to reduce visual-vestibular conflict." },
    ],
    progressions: [
      { name: "Standing on Foam", description: "Stand on a compliant surface to add postural-vestibular integration demand." },
    ],
  },
  {
    slug: "vor-x2-gaze-stabilization",
    name: "Gaze Stabilization — VOR ×2",
    description:
      "Hold a target in front of you and move the head and target in OPPOSITE directions simultaneously while maintaining clear fixation. Doubles the angular demand on the VOR vs ×1.",
    dosing: "Layer in after VOR×1 is tolerated. 1–2 minutes per direction, multiple times daily.",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.9,
    notes:
      "Standard progression in vestibular PT. Eye-head substitution variant (large saccade to target before head follows) promotes central preprogramming of compensatory eye movements [Hall 2022 — ANPT/APTA CPG].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Move head and target in opposite directions at the same speed", cueType: "verbal" },
      { text: "Target stays sharp — slow down before it blurs", cueType: "verbal" },
    ],
    regressions: [{ name: "VOR ×1", description: "Return to VOR ×1 if the target blurs or symptoms build." }],
    progressions: [
      { name: "VOR ×2 on Foam", description: "Add a foam pad to integrate vestibular-postural demand." },
    ],
  },
  {
    slug: "brock-string",
    name: "Brock String",
    description:
      "A string with 3–5 colored beads is held from the bridge of the nose to a fixed point. The user fixates each bead in sequence; correct fixation produces a single bead with two strings crossing through it (physiological diplopia of the un-fixated beads).",
    dosing: "5–10 minutes/day as part of an office-based vergence program (CITT pattern).",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["brock-string"],
    bodyPosition: "seated",
    confidence: 0.7,
    notes:
      "Develops fusional vergence awareness and helps suppress suppression. Evidence sits within the broader CITT vergence/accommodative therapy program rather than as an isolated intervention [Scheiman 2020 Cochrane; Chang 2021 Ophthalmology].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "When fixating the bead, the other beads should appear doubled — that's the X pattern of physiological diplopia", cueType: "verbal" },
      { text: "If one string disappears, that eye is suppressing — close the other and reopen to re-engage", cueType: "verbal" },
    ],
    regressions: [{ name: "Two-Bead String", description: "Reduce to two beads at fixed distances to simplify the vergence task." }],
    progressions: [{ name: "Jump Vergence with String", description: "Alternate fixation between far and near beads without smooth scan." }],
  },
  {
    slug: "hart-chart",
    name: "Hart Chart (Near-Far Accommodative Rock)",
    description:
      "A near letter chart and matched far letter chart are placed at distance. The user alternates reading rows on the near and far chart as quickly as possible while maintaining clarity. Trains accommodative facility.",
    dosing: "5–10 minutes/day as part of an office-based vergence/accommodative program.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["hart-chart"],
    bodyPosition: "seated",
    confidence: 0.7,
    notes:
      "Component of the CITT office-based protocol sequence. Effect is studied within the multimodal vergence/accommodative program rather than in isolation [Scheiman 2020 Cochrane; Chang 2021 Ophthalmology].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Letters must be sharp at both distances before moving on", cueType: "verbal" },
      { text: "If text stays blurry on switch, slow down — you're outpacing accommodation", cueType: "verbal" },
    ],
    regressions: [{ name: "Larger Letter Chart", description: "Use a larger font chart at both distances to reduce accommodative demand." }],
    progressions: [{ name: "Smaller Font / Longer Distance", description: "Move the far chart farther or use a smaller font row." }],
  },

  // ─── (b) Vestibular ─────────────────────────────────────────────────
  {
    slug: "cawthorne-cooksey-progression",
    name: "Cawthorne-Cooksey Progression",
    description:
      "Graded hierarchy of head, eye, body, and gait movements. Stage 1 (sitting): eye/head/shoulder movements. Stage 2 (standing): trunk movements + standing eye/head. Stage 3 (walking): turning while walking, slopes, stairs eyes open/closed. Stage 4 (functional): eye-hand coordination tasks.",
    dosing: "Each stage 1–2 min, full sequence 2×/day, progress when symptoms tolerable.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.75,
    notes:
      "Generic Cawthorne-Cooksey improved mCTSIB, VAS, DHI, ABC vs no exercise but was inferior to supervised customized vestibular PT [Hall 2022 JNPT; Lee 2025 Front Neurol].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Progress only when the current stage no longer triggers symptoms", cueType: "verbal" },
      { text: "If symptoms build, return to the prior stage for 1–2 days", cueType: "verbal" },
    ],
    regressions: [{ name: "Stage 1 Only", description: "Stay at seated eye/head movements until symptom-free." }],
    progressions: [{ name: "Customized Stage 4 Tasks", description: "Replace generic stage-4 tasks with the user's symptom-provoking real-world tasks." }],
  },
  {
    slug: "foam-pad-sensory-perturbation",
    name: "Foam Pad Balance with Sensory Perturbation",
    description:
      "Stand on a compliant foam surface and progressively manipulate visual input (eyes open → eyes closed → busy visual background) and base of support (Romberg → tandem → single-leg). Trains the somatosensory-vestibular-visual balance system.",
    dosing: "30–60 seconds per condition, 3–5 conditions, 1–2×/day.",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: ["balance-pad"],
    bodyPosition: "standing",
    confidence: 0.85,
    notes:
      "The mCTSIB foam-eyes-closed condition is both a clinical test and a training condition. BEEMS protocol (MS) used progressive surface complexity (firm → compliant → rocking → reactive) [Hebert 2018 Neurology; Hall 2022 JNPT].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Stand near a wall or counter for safety — fall risk increases with eyes closed", cueType: "tactile" },
      { text: "Hold each condition until balance feels easy, then progress", cueType: "verbal" },
    ],
    regressions: [
      { name: "Romberg on Firm Surface", description: "Drop the foam pad until firm-surface eyes-closed Romberg is steady." },
    ],
    progressions: [
      { name: "Foam + Head Turns", description: "Add slow horizontal then vertical head movements while balancing." },
    ],
  },
  {
    slug: "vestibular-habituation-drills",
    name: "Vestibular Habituation Drills",
    description:
      "Repeated controlled exposure to specific positions or movements that provoke the user's vestibular symptoms (motion sensitivity, visual motion, head-position changes). Selected based on a Motion Sensitivity Quotient or symptom diary.",
    dosing: "Provoke to mild symptom intensity, hold 30 s, recover. 3–5 reps per provoking movement, 2×/day.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.75,
    notes:
      "Mechanism is central neural plasticity, distinct from VOR adaptation (gain change). Must be customized to the individual's provoking movements [Hall 2022 JNPT; McDonnell & Hillier 2015 Cochrane].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Provoke to a tolerable symptom level — not maximum. Recovery should be complete within 60 s", cueType: "verbal" },
      { text: "Pick 2–3 specific provoking movements from your symptom diary — not generic ones", cueType: "verbal" },
    ],
    regressions: [
      { name: "Reduced Amplitude", description: "Use a smaller range of the provoking movement until intensity tolerable." },
    ],
    progressions: [
      { name: "Functional Habituation", description: "Replace generic provoking moves with the actual real-world activity that triggers symptoms." },
    ],
  },
  {
    slug: "dynamic-gait-with-head-turns",
    name: "Dynamic Gait with Head Turns",
    description:
      "Walk in a straight line while turning the head horizontally on a cadence (every 2–3 steps), then vertically. Progress to walking with head turns in busy visual environments and adding cognitive or motor secondary tasks.",
    dosing: "2–3 minutes per direction, 1–2×/day. Progress visual complexity weekly.",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.85,
    notes:
      "Integrates gaze stabilization, balance, and habituation into functional mobility [Hall 2022 JNPT — ANPT/APTA CPG].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Walk slowly enough to keep balance steady — head turns should not stagger your gait", cueType: "verbal" },
      { text: "Try this in a hallway first, busy environments later", cueType: "verbal" },
    ],
    regressions: [
      { name: "Standing + Head Turns", description: "Stop walking; do head turns in standing with a fixed gaze target." },
    ],
    progressions: [
      { name: "Dual-Task Gait + Head Turns", description: "Add a cognitive task (serial subtraction, naming) while walking with head turns." },
    ],
  },
  {
    slug: "optokinetic-stimulation",
    name: "Optokinetic Stimulation",
    description:
      "Brief exposure to repetitive moving visual patterns (optokinetic discs, scrolling text videos, busy environment footage) to habituate visual-vestibular conflict symptoms.",
    dosing: "30 s–2 min per session, 1–2×/day, increase as tolerated.",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.85,
    notes:
      "Level I RCT showed customized vestibular exercises performed in an optokinetic environment improved symptom measures more than customized exercises alone [Hall 2022 JNPT].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Start with 30 s. Stop if symptoms exceed mild — they should subside within a minute", cueType: "verbal" },
      { text: "Stand near a wall if upright — visual flow can perturb balance", cueType: "tactile" },
    ],
    regressions: [{ name: "Slower Pattern Speed", description: "Use slower optokinetic content (low scroll speed) initially." }],
    progressions: [{ name: "Standing + Optokinetic", description: "Stand on firm then foam while watching the moving pattern." }],
  },

  // ─── (c) Breathing Variety ──────────────────────────────────────────
  {
    slug: "box-breathing",
    name: "Box Breathing (4-4-4-4)",
    description:
      "Equal-ratio breathing: 4 s inhale → 4 s hold → 4 s exhale → 4 s hold. Repeat. Useful for acute anxiety reduction and attention regulation.",
    dosing: "1 minute minimum (effective); 5–10 min for sustained effect.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.8,
    notes:
      "1-min ecological momentary intervention RCT reduced state anxiety and improved inhibition accuracy vs passive control. Box breathing has a distinct autonomic profile (RSA differs from other slow-breathing patterns) [Riedl 2026 Anxiety Stress Coping; Little 2025].",
    movementSlugs: [],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary" },
      { muscleSlug: "external-intercostals", role: "synergist" },
    ],
    cues: [
      { text: "Count silently to 4 on each phase — pace through the nose where comfortable", cueType: "verbal" },
      { text: "Holds should be relaxed, not strained. Drop to 3-3-3-3 if 4-4-4-4 feels effortful", cueType: "verbal" },
    ],
    regressions: [
      { name: "3-3-3-3", description: "Shorter counts if 4-second holds feel strained." },
    ],
    progressions: [
      { name: "5-5-5-5 or 6-6-6-6", description: "Longer counts as comfort grows; ~6 breaths/min is a parasympathetic sweet spot." },
    ],
  },
  {
    slug: "cyclic-sighing",
    name: "Cyclic Sighing (Physiological Sigh)",
    description:
      "Double inhale through the nose (short inhale, then a second stacking inhale to top off lung volume), followed by a prolonged exhale through the mouth. Repeat continuously.",
    dosing: "5 min/day (Balban 2023 RCT dose).",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.9,
    notes:
      "Balban et al. (n=114) RCT — cyclic sighing for 5 min/day × 28 days was the most effective breathwork technique for increasing positive affect and decreasing respiratory rate vs box breathing, cyclic hyperventilation, and mindfulness meditation [Riedl 2026; Vlemincx 2022 Biol Psychol].",
    movementSlugs: [],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary" },
      { muscleSlug: "external-intercostals", role: "synergist" },
    ],
    cues: [
      { text: "Make the exhale clearly longer than the inhale — twice as long is typical", cueType: "verbal" },
      { text: "The second inhale tops off lungs that are already mostly full", cueType: "verbal" },
    ],
    regressions: [
      { name: "Slow Diaphragmatic Breath", description: "If the double inhale is uncomfortable, default to slow nasal in / long mouth out." },
    ],
    progressions: [{ name: "Longer Exhale", description: "Extend the exhale to 2–3× the combined inhale time." }],
  },
  {
    slug: "four-seven-eight-breathing",
    name: "4-7-8 Breathing",
    description:
      "Inhale through the nose for 4 counts → hold for 7 counts → exhale through the mouth for 8 counts. Prolonged-exhalation slow-breathing pattern.",
    dosing: "4 cycles per round, 1–2 rounds, 1–2×/day.",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.6,
    notes:
      "Direct RCT evidence for the 4-7-8 ratio specifically is limited. Broader evidence supports prolonged-exhalation slow breathing for parasympathetic enhancement via Hering-Breuer reflex and baroreceptor activation [Little 2025; Zaccaro 2018].",
    movementSlugs: [],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary" },
      { muscleSlug: "external-intercostals", role: "synergist" },
    ],
    cues: [
      { text: "Exhale should be slow and audible — like fogging a mirror", cueType: "verbal" },
      { text: "If light-headed, shorten counts to 3-5-6 and rebuild", cueType: "verbal" },
    ],
    regressions: [{ name: "3-5-6 Variant", description: "Smaller counts in the same ratio." }],
    progressions: [{ name: "Repeat Multiple Rounds", description: "Build to 3 rounds of 4 cycles." }],
  },
  {
    slug: "alternate-nostril-breathing",
    name: "Alternate-Nostril Breathing (Nadi Shodhana)",
    description:
      "Close right nostril with right thumb; inhale through left. Close left nostril with ring finger; exhale through right. Inhale through right. Close right; exhale through left. One full cycle.",
    dosing: "5–10 minutes, 1×/day.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.75,
    notes:
      "Pranayama technique. Improves HRV, reduces BP, and enhances baroreflex sensitivity in systematic reviews of yoga breathing [Zaccaro 2018 Front Hum Neurosci; Holland 2024 ERS CPG].",
    movementSlugs: [],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary" },
    ],
    cues: [
      { text: "Breath should be silent and slow, not forced", cueType: "verbal" },
      { text: "If congested, drop the nostril seal and breathe slowly through both nostrils", cueType: "verbal" },
    ],
    regressions: [
      { name: "Visualization Only", description: "Imagine the breath alternating between nostrils without manual closure (for nasal congestion days)." },
    ],
    progressions: [
      { name: "Add Brief Retention", description: "Add a 1–2 s hold after inhale before the nostril switch." },
    ],
  },
  {
    slug: "lateral-costal-breathing",
    name: "Lateral Costal Breathing",
    description:
      "Place hands on the lower lateral ribs. Breathe so that the ribs expand sideways into your hands rather than the chest lifting upward. Targets lateral intercostal expansion and the diaphragmatic zone of apposition.",
    dosing: "5–10 cycles × 2–3 rounds, daily.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.75,
    notes:
      "Standard component of breathing retraining in dysfunctional breathing/hyperventilation syndrome. Shifts from upper-chest accessory-muscle patterns to lower-chest diaphragmatic and costal expansion [Jones 2013 Cochrane].",
    movementSlugs: [],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary" },
      { muscleSlug: "external-intercostals", role: "primary", notes: "Lateral expansion" },
      { muscleSlug: "internal-intercostals", role: "synergist" },
    ],
    cues: [
      { text: "Feel the ribs push your hands sideways — shoulders stay relaxed", cueType: "tactile" },
      { text: "No chest lift, no shoulder shrug on inhale", cueType: "verbal" },
    ],
    regressions: [{ name: "Side-Lying", description: "Lie on one side; the up-side ribs are easier to feel expanding." }],
    progressions: [{ name: "Quadruped", description: "Perform on hands and knees with hand on lateral ribs — gravity makes the upper side easier to isolate." }],
  },
  {
    slug: "ujjayi-breathing",
    name: "Ujjayi Breathing (Ocean Breath)",
    description:
      "Slow breathing with partial glottal constriction creating an audible, soft whisper-like sound on both inhale and exhale. Adds light airway resistance and intrathoracic pressure.",
    dosing: "5–10 minutes, 1×/day after slow-breathing tolerance is established.",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.7,
    notes:
      "At 6 breaths/min increased baroreflex sensitivity and oxygen saturation in 17 yoga-naive participants (slightly less than equal-ratio slow breathing without glottic constriction). Best treated as a progression from basic slow breathing [Mason 2013 eCAM; Cramer 2019 Clin Rehabil].",
    movementSlugs: [],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary" },
      { muscleSlug: "external-intercostals", role: "synergist" },
    ],
    cues: [
      { text: "Mouth closed; the sound comes from a gentle glottal narrowing in the throat, like fogging a mirror with your mouth closed", cueType: "verbal" },
      { text: "Drop the constriction if it feels straining — gentleness is the cue", cueType: "verbal" },
    ],
    regressions: [{ name: "Plain Slow Breathing", description: "Drop the glottal constriction; just slow the breath." }],
    progressions: [{ name: "Ujjayi during Movement", description: "Maintain ujjayi during gentle mobility flow (vinyasa, sun salutation)." }],
  },

  // ─── (d) Somatic / Interoceptive ────────────────────────────────────
  {
    slug: "body-scan-with-movement",
    name: "Body Scan with Movement",
    description:
      "Sustained mindful interoceptive attention directed sequentially through body regions (feet → legs → pelvis → trunk → arms → head), combined with gentle micro-movements at each region (toe wiggle, ankle circle, pelvic rock).",
    dosing: "10–20 minutes per session, 3–5×/week.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    confidence: 0.7,
    notes:
      "MBSR-style body scan with added movement. Strongest chronic-pain evidence for MBSR overall: SMD −0.76 for pain intensity at 8 weeks, weekly 90–120 min sessions [Zhu 2025 J Psychosom Res; Price & Weng 2020].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Pause at each region for 30–60 s — note what you notice without changing it", cueType: "verbal" },
      { text: "Then move that region gently and notice the change", cueType: "verbal" },
    ],
    regressions: [{ name: "Static Body Scan", description: "Drop the movement; just direct attention." }],
    progressions: [{ name: "Body Scan + Breath Pacing", description: "Sync the body-region transitions with slow inhale/exhale." }],
  },
  {
    slug: "supine-90-90-with-breath",
    name: "Supine 90-90 with Breath Pacing",
    description:
      "Lie supine with hips and knees flexed to 90° (calves on a chair, ottoman, or wall). Place hands on belly. Breathe slow diaphragmatic breaths (~6/min). Optimizes zone of apposition for the diaphragm and provides maximal somatosensory grounding.",
    dosing: "5–10 minutes, 1–2×/day.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    confidence: 0.75,
    notes:
      "Pilot RCT demonstrated neurobiological and anti-inflammatory effects of structured diaphragmatic breathing in this position — vagal stimulation, increased parasympathetic activity, normalized BP/HR, reduced cortisol [Maniaci 2024 Stress and Health].",
    movementSlugs: [],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary" },
    ],
    cues: [
      { text: "Low back stays in light contact with the floor — no arching", cueType: "tactile" },
      { text: "Belly rises before chest on each inhale", cueType: "tactile" },
    ],
    regressions: [
      { name: "Hooklying (Feet on Floor)", description: "Use hooklying if calves-on-elevation isn't available." },
    ],
    progressions: [
      { name: "Add Cyclic Sigh", description: "Replace plain slow breathing with cyclic sighing in this position." },
    ],
  },
  {
    slug: "childs-pose-breathing",
    name: "Child's Pose Breathing",
    description:
      "Kneeling with sit-bones toward heels, forehead supported, arms forward or alongside body. Breathe slowly into the back of the rib cage — abdominal contact against the thighs provides proprioceptive feedback for diaphragmatic breathing.",
    dosing: "1–3 minutes, 1–2×/day.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "prone",
    confidence: 0.7,
    notes:
      "Component of therapeutic yoga protocols for chronic low back pain — MD −0.83 for pain at 4–8 weeks vs non-exercise [Zhu 2020 PLOS One; Wieland 2022 Cochrane].",
    movementSlugs: [],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary" },
      { muscleSlug: "external-intercostals", role: "synergist" },
    ],
    cues: [
      { text: "Feel the breath move into the back of the rib cage, against the thighs", cueType: "tactile" },
      { text: "Knees wider apart if abdomen compression feels restrictive", cueType: "verbal" },
    ],
    regressions: [
      { name: "Sit-bones on a Block", description: "Place a yoga block under the sit-bones to reduce knee/ankle demand." },
    ],
    progressions: [{ name: "Add Lateral Costal Cue", description: "Hand on lateral ribs to layer in lateral-costal breathing." }],
  },
  {
    slug: "constructive-rest-position",
    name: "Constructive Rest Position",
    description:
      "Supine with knees bent and feet flat on the floor, arms resting on the abdomen or out to the sides. No active effort — let gravity and the breath do the work. Used to reduce muscular guarding and facilitate interoceptive awareness.",
    dosing: "5–20 minutes, 1×/day or as needed.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    confidence: 0.65,
    notes:
      "Used in mind-body therapies bridging physical and mental well-being. The Italian Consensus Conference on Pain in Neurorehabilitation found relaxation training and body-based psychological interventions effective for pain reduction across multiple neurological conditions [Maniaci 2024; Castelnuovo 2016 Front Psychol].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Let the floor support all of your weight — soften any unnecessary muscle effort", cueType: "verbal" },
      { text: "Knees lean inward and the inner thighs touch is fine — let it happen", cueType: "tactile" },
    ],
    regressions: [{ name: "Calves Elevated", description: "Place calves on a low surface to reduce low-back load further." }],
    progressions: [{ name: "Constructive Rest + Body Scan", description: "Layer in a 5-min body scan during the rest." }],
  },
  {
    slug: "limbic-downregulation-pendulation",
    name: "Limbic Downregulation — Pendulation",
    description:
      "Alternate attention between an area of body comfort (e.g. warm feet, soft hands) and an area of mild discomfort/activation (e.g. tight shoulders, held breath). Spend 30–60 s on each, oscillating. Trains capacity to stay present with dysregulation without overwhelm.",
    dosing: "5–10 minutes, 1×/day or before stress-loading tasks.",
    evidenceLevel: "limited",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.55,
    notes:
      "Somatic Experiencing technique. SR for co-occurring chronic pain + PTSD recommends trauma-focused components (SMD −0.75 PTSD; −0.34 pain intensity) [Payne 2015 Front Psychol; O'Donnell 2026 Pain].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Stay within tolerable activation — if the discomfort area becomes overwhelming, return to the comfort area", cueType: "verbal" },
      { text: "Small doses — 30–60 s per side is enough", cueType: "verbal" },
    ],
    regressions: [{ name: "Comfort-Only Anchor", description: "Stay in the comfort area only — build interoceptive baseline first." }],
    progressions: [{ name: "Pendulation + Breath", description: "Add slow breath pacing across the pendulation swings." }],
  },
  {
    slug: "ankle-tip-rocking",
    name: "Ankle-Tip Rocking",
    description:
      "Stand with feet hip-width, weight balanced. Rock slowly forward onto the balls of the feet, then backward onto the heels — small amplitude, slow tempo. Attend to proprioceptive and interoceptive feedback throughout.",
    dosing: "1–2 minutes, 2–3×/day. Useful before or between focused work blocks.",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.55,
    notes:
      "Mindful-movement framework: motor plans, attention, and executive goals are reciprocally linked; movement training engages higher-order inhibition. Brief mindfulness interventions increase bodily awareness in sedentary adults [Clark 2015 Front Hum Neurosci; Meggs & Chen 2021].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Rock at a pace where you can feel the weight shift through every part of your foot", cueType: "verbal" },
      { text: "Eyes can be open or closed — closed adds vestibular load", cueType: "verbal" },
    ],
    regressions: [{ name: "Seated Rocking", description: "Perform seated with feet on the floor — same intent, less balance demand." }],
    progressions: [{ name: "Eyes Closed + Reduced Base", description: "Narrow stance and close eyes." }],
  },

  // ─── (e) Mindfulness-of-Movement Primitives ─────────────────────────
  {
    slug: "single-task-posture-awareness",
    name: "Single-Task Posture Awareness Drill",
    description:
      "During a routine task (typing, reading, drinking water), pick ONE postural element to attend to — foot contact, ribcage stack, shoulder position. Hold deliberate attention on that single element for ~30 s without trying to change it, then for ~30 s while gently adjusting.",
    dosing: "30–60 s, 3–5×/day. Cycle through different postural elements across the week.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.7,
    notes:
      "Feldenkrais-informed mindful learning — attention to organizing the body in movement cultivates a transferrable skill of attention. Active attentional component distinguishes from passive ergonomic reminders [Clark 2015 Front Hum Neurosci].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "One element at a time — multitasking attention defeats the drill", cueType: "verbal" },
      { text: "Noticing without judgment first; correction second", cueType: "verbal" },
    ],
    regressions: [{ name: "Pre-Task Check-In", description: "Just notice for 10 s before starting the task, no correction." }],
    progressions: [{ name: "Element Cycling", description: "Stack two postural elements: notice foot contact AND breath rate together." }],
  },
  {
    slug: "mindfulness-integrated-stretching",
    name: "Mindfulness-Integrated Stretching",
    description:
      "Static or dynamic stretches paired with mindful body awareness. Hold 20–30 s, rest 10–15 s, transition slowly between poses, breathe through the nose at a slow pace. Attention stays on the sensations in the stretched tissue and the breath.",
    dosing: "30 min/session, 2–3×/week (Terzioğlu 2025 RCT protocol).",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.7,
    notes:
      "RCT of online mindfulness-based stretching (30-min sessions × 5 sessions) improved well-being in health-sciences students. Distinct from passive stretching by the active attention component [Terzioğlu & Çakır-Çelebi 2025 J Clin Psychol — RCT].",
    movementSlugs: [],
    muscleRoles: [],
    cues: [
      { text: "Hold each stretch at the edge where sensation is clear but not painful", cueType: "verbal" },
      { text: "Transition slowly — the transitions are part of the practice, not interruptions", cueType: "verbal" },
    ],
    regressions: [
      { name: "Single-Pose Awareness", description: "Pick one stretch; spend 3 minutes with full attention rather than running a sequence." },
    ],
    progressions: [
      { name: "Add Breath Pacing", description: "Sync the stretch hold with 4–6 slow breaths; transition on the exhale." },
    ],
  },
]

export async function seedThinModalitiesExtension() {
  logSection("Thin-modality additions (literature review 2026-06-08)")

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

  logCount("thin-modality exercises", exercises.length)
}
