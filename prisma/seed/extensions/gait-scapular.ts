import { prisma, logSection, logCount } from "../client";
import { MuscleRole } from "@prisma/client";

// ─── New Region / Joint / Movements ──────────────────────────────────────────

async function seedPelvisAndNewMovements() {
  logSection("Pelvis + new movements");

  const pelvis = await prisma.region.upsert({
    where: { slug: "pelvis" },
    update: {},
    create: {
      slug: "pelvis",
      name: "Pelvis",
      description:
        "The lumbopelvic unit. Pelvic tilt (anterior, posterior, lateral) is distinct from lumbar spine motion and is central to posture, gait, and low-back mechanics.",
      sortOrder: 75,
      status: "reviewed",
      confidence: 0.9,
    },
  });

  const lumbopelvic = await prisma.joint.upsert({
    where: { slug: "lumbopelvic" },
    update: {},
    create: {
      slug: "lumbopelvic",
      name: "Lumbopelvic",
      regionId: pelvis.id,
      jointType: "functional-unit",
      description:
        "Functional unit comprising the sacroiliac joint, hip joints, and lumbosacral junction. Motion measured as pelvic tilt (sagittal and frontal planes).",
      status: "reviewed",
      confidence: 0.85,
    },
  });

  const pelvicMovements = [
    {
      slug: "anterior-pelvic-tilt",
      name: "Anterior Pelvic Tilt",
      description:
        "Forward rotation of the pelvis in the sagittal plane (ASIS moves anterior-inferior relative to pubic symphysis). Coupled with lumbar extension.",
      plane: "sagittal",
      axis: "medial-lateral",
      aromMin: 0,
      aromMax: 13,
      romSource: "Levangie & Norkin",
    },
    {
      slug: "posterior-pelvic-tilt",
      name: "Posterior Pelvic Tilt",
      description:
        "Backward rotation of the pelvis in the sagittal plane (ASIS moves posterior-superior). Coupled with lumbar flexion.",
      plane: "sagittal",
      axis: "medial-lateral",
      aromMin: 0,
      aromMax: 9,
      romSource: "Levangie & Norkin",
    },
    {
      slug: "lateral-pelvic-tilt",
      name: "Lateral Pelvic Tilt",
      description:
        "Frontal plane pelvic motion (hip hiking / hip dropping). One iliac crest elevates while the contralateral drops. Clinically relevant to gait (mid stance, Trendelenburg).",
      plane: "frontal",
      axis: "anterior-posterior",
      aromMin: 0,
      aromMax: 10,
      romSource: "Neumann",
    },
  ];

  for (const m of pelvicMovements) {
    await prisma.movement.upsert({
      where: { slug: m.slug },
      update: {},
      create: {
        ...m,
        jointId: lumbopelvic.id,
        status: "reviewed",
        confidence: 0.85,
      },
    });
  }

  // Cervical retraction (chin tuck) — distinct from cervical extension
  const cervicalJoint = await prisma.joint.findUnique({
    where: { slug: "cervical-intervertebral" },
  });
  if (cervicalJoint) {
    await prisma.movement.upsert({
      where: { slug: "cervical-retraction" },
      update: {},
      create: {
        slug: "cervical-retraction",
        name: "Cervical Retraction",
        description:
          "Posterior translation of the head on the neck (chin tuck). Distinct from cervical extension — combines upper cervical flexion with lower cervical extension.",
        plane: "sagittal",
        axis: "medial-lateral",
        aromMin: 0,
        aromMax: 3,
        romUnit: "cm",
        romNotes:
          "Measured as linear translation of the tragus posteriorly, not goniometric degrees.",
        jointId: cervicalJoint.id,
        status: "reviewed",
        confidence: 0.9,
      },
    });
    await prisma.movement.upsert({
      where: { slug: "cervical-protraction" },
      update: {},
      create: {
        slug: "cervical-protraction",
        name: "Cervical Protraction",
        description:
          "Anterior translation of the head on the neck (forward-head posture). Upper cervical extension with lower cervical flexion.",
        plane: "sagittal",
        axis: "medial-lateral",
        aromMin: 0,
        aromMax: 3,
        romUnit: "cm",
        jointId: cervicalJoint.id,
        status: "reviewed",
        confidence: 0.9,
      },
    });
  }

  logCount("pelvic + cervical retraction/protraction movements", pelvicMovements.length + 2);
}

// ─── Gait Phases (Rancho Los Amigos) ─────────────────────────────────────────

const gaitPhases = [
  {
    slug: "initial-contact",
    name: "Initial Contact",
    shortName: "IC",
    cycleStartPct: 0,
    cycleEndPct: 2,
    phaseGroup: "stance",
    order: 1,
    kinematics: "Hip ~30° flexion, knee 0–5° flexion, ankle neutral to slight plantarflexion, contralateral pelvis elevated ~5°.",
    kinetics: "Rapid vertical GRF rise; heel pad strain 39% in ~150 ms.",
    muscleActivity: "Tibialis anterior peak (~40–50% MVIC), vastus lateralis initiating, hamstrings decelerating swing.",
    functionalGoal: "Position limb for weight acceptance; prepare for shock absorption.",
    commonDeficits: "Foot slap (weak DF); forefoot/flatfoot contact (PF contracture); excessive knee flexion (quad weakness or hamstring spasticity).",
  },
  {
    slug: "loading-response",
    name: "Loading Response",
    shortName: "LR",
    cycleStartPct: 0,
    cycleEndPct: 10,
    phaseGroup: "stance",
    order: 2,
    kinematics: "Hip 30° flexion beginning extension; knee flexes 15–20° (shock absorption); ankle PF 10–15°; contralateral pelvis drops.",
    kinetics: "First vertical GRF peak ~110% BW; eccentric DF moment at ankle, eccentric quad extension moment at knee; energy absorption at knee and ankle.",
    muscleActivity: "Quads 60–80% MVIC (VL peak), TA, gastroc 20–30% MVIC initiating; glute med/max stabilizing.",
    functionalGoal: "Weight acceptance and shock absorption; decelerate downward momentum.",
    commonDeficits: "Excessive knee flexion (quad weakness); knee hyperextension (PF contracture, quad spasticity); lateral trunk lean (glute med weakness — Trendelenburg).",
  },
  {
    slug: "mid-stance",
    name: "Mid Stance",
    shortName: "MSt",
    cycleStartPct: 10,
    cycleEndPct: 30,
    phaseGroup: "stance",
    order: 3,
    kinematics: "Hip extends 30° → 0°; knee extends 15° → 5° flexion; ankle PF 10° → DF 10° (tibia advances); contralateral pelvis at lowest.",
    kinetics: "Vertical GRF minimum ~80% BW; increasing DF moment (eccentric PF control); ankle absorbs energy.",
    muscleActivity: "Soleus/gastroc 30–60% MVIC (increasing); TA decreasing; glute med peak for pelvic stability.",
    functionalGoal: "Single-limb support; controlled tibial advancement over fixed foot.",
    commonDeficits: "Excessive knee flexion (PF weakness); lateral trunk lean (glute med weakness); increased step width (ataxia).",
  },
  {
    slug: "terminal-stance",
    name: "Terminal Stance",
    shortName: "TSt",
    cycleStartPct: 30,
    cycleEndPct: 50,
    phaseGroup: "stance",
    order: 4,
    kinematics: "Hip 10–20° hyperextension; knee near full extension; ankle max DF 10–15° then PF begins; pelvis forward rotation begins.",
    kinetics: "Second GRF peak; peak concentric PF moment; ankle positive power generation (push-off prep).",
    muscleActivity: "Gastroc/soleus peak 60–80% MVIC; hip flexors initiating.",
    functionalGoal: "Prepare push-off; begin forward propulsion.",
    commonDeficits: "Premature heel rise (PF contracture); delayed heel rise (PF weakness); insufficient hip extension (HF contracture, weak hip extensors).",
  },
  {
    slug: "pre-swing",
    name: "Pre-Swing (Toe Off)",
    shortName: "PSw",
    cycleStartPct: 50,
    cycleEndPct: 60,
    phaseGroup: "stance",
    order: 5,
    kinematics: "Hip neutral to 10° flexion; knee flexes rapidly 35–40°; ankle peak PF 15–20° at toe off; pelvis continues forward rotation.",
    kinetics: "Second vertical GRF peak ~110% BW then rapid unloading; maximum ankle positive power; knee absorbs energy.",
    muscleActivity: "Gastroc/soleus maximum; TA second peak begins; iliopsoas and rectus femoris initiate.",
    functionalGoal: "Push-off, limb unloading, swing initiation; generate forward propulsion.",
    commonDeficits: "Inadequate push-off (PF weakness); excessive knee flexion (RF weakness); toe drag (weak DF).",
  },
  {
    slug: "initial-swing",
    name: "Initial Swing",
    shortName: "ISw",
    cycleStartPct: 60,
    cycleEndPct: 73,
    phaseGroup: "swing",
    order: 6,
    kinematics: "Hip flexes 15–20°; knee peak flexion 60–65° (clearance); ankle DF toward neutral; pelvis continues forward rotation.",
    kinetics: "No GRF; hip flexion moment, passive knee flexion, DF moment; hip generates power, knee absorbs.",
    muscleActivity: "Iliopsoas, TA, RF (regulates knee flexion); hamstrings control velocity.",
    functionalGoal: "Foot clearance and limb advancement; accelerate limb forward.",
    commonDeficits: "Stiff-knee gait (RF overactivity, quad spasticity); toe drag (weak DF); hip hiking (compensation).",
  },
  {
    slug: "mid-swing",
    name: "Mid Swing",
    shortName: "MSw",
    cycleStartPct: 73,
    cycleEndPct: 87,
    phaseGroup: "swing",
    order: 7,
    kinematics: "Hip 25–30° flexion; knee extends 60° → 25–30° flexion; ankle neutral DF; pelvis max forward rotation.",
    kinetics: "No GRF; passive pendulum mechanics; minimal active power.",
    muscleActivity: "TA sustained (clearance); hip flexors decreasing; hamstrings initiate deceleration.",
    functionalGoal: "Continued limb advancement; position limb for terminal swing.",
    commonDeficits: "Toe drag (persistent weak DF); circumduction (compensation for inadequate knee/ankle control).",
  },
  {
    slug: "terminal-swing",
    name: "Terminal Swing",
    shortName: "TSw",
    cycleStartPct: 87,
    cycleEndPct: 100,
    phaseGroup: "swing",
    order: 8,
    kinematics: "Hip 25–30° flexion; knee extends near full extension; ankle neutral; pelvis decelerating forward rotation.",
    kinetics: "No GRF; hip extension deceleration moment; energy absorption at hip and knee.",
    muscleActivity: "Hamstrings peak (deceleration); quads eccentric; TA preparing for heel strike. Quad/hamstring co-contraction in ~90% of strides.",
    functionalGoal: "Limb deceleration; position for next initial contact.",
    commonDeficits: "Hyperextended knee (hamstring weakness); flexed knee (hamstring contracture, quad weakness); foot drop (weak DF).",
  },
] as const;

async function seedGaitPhases() {
  logSection("Gait Phases");
  for (const p of gaitPhases) {
    await prisma.gaitPhase.upsert({
      where: { slug: p.slug },
      update: { ...p },
      create: { ...p },
    });
  }
  logCount("gait phases", gaitPhases.length);
}

// ─── New Exercises ───────────────────────────────────────────────────────────

type MuscleRoleSpec = { muscleSlug: string; role: MuscleRole; notes?: string };
type ExerciseSpec = {
  slug: string;
  name: string;
  description: string;
  dosing?: string;
  emgNotes?: string;
  evidenceLevel?: string;
  difficulty?: string;
  equipment?: string[];
  bodyPosition?: string;
  confidence?: number;
  movementSlugs: string[];
  muscleRoles: MuscleRoleSpec[];
  cues: { text: string; cueType?: string }[];
  regressions: { name: string; description: string }[];
  progressions: { name: string; description: string }[];
  gaitPhaseSlugs?: { slug: string; rationale?: string }[];
};

const newExercises: ExerciseSpec[] = [
  // ─── Scapular ──────────────────────────────────────────────────────────────
  {
    slug: "prone-t-with-external-rotation",
    name: "Prone T with External Rotation",
    description:
      "Prone with arms abducted 90° in a T, thumbs up. Lift arms toward ceiling while externally rotating shoulders and retracting/depressing scapulae.",
    dosing: "3×10–15, 3×/week × 6–12 weeks; 1–3 lb progressing to 5 lb",
    emgNotes:
      "Middle trap >50% MVIC; lower trap >50% MVIC; upper trap <20% MVIC. UT:MT ratio 0.43, UT:LT 0.30 [Mendez-Rebolledo 2024].",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "prone",
    confidence: 0.9,
    movementSlugs: ["scapular-retraction", "scapular-depression", "shoulder-horizontal-abduction", "shoulder-external-rotation"],
    muscleRoles: [
      { muscleSlug: "trapezius-middle", role: "primary", notes: ">50% MVIC" },
      { muscleSlug: "trapezius-lower", role: "primary", notes: ">50% MVIC" },
      { muscleSlug: "rhomboid-major", role: "secondary", notes: "25–45% MVIC" },
      { muscleSlug: "infraspinatus", role: "secondary" },
      { muscleSlug: "posterior-deltoid", role: "secondary" },
      { muscleSlug: "trapezius-upper", role: "stabilizer", notes: "<20% MVIC — intentionally low" },
    ],
    cues: [
      { text: "Lift arms and rotate thumbs toward ceiling", cueType: "verbal" },
      { text: "Squeeze shoulder blades together and down", cueType: "verbal" },
      { text: "Keep chin tucked, don't lift head", cueType: "verbal" },
      { text: "Lead with thumbs pointing up", cueType: "verbal" },
    ],
    regressions: [
      { name: "Incline Prone T", description: "Perform on an incline bench (30–45°) to reduce gravity load." },
    ],
    progressions: [
      { name: "Add Light Dumbbells", description: "Progress from 1–3 lb to 5 lb while maintaining ratios." },
      { name: "Prone Y-Raise", description: "Move to 135° abduction for greater lower trap activation." },
    ],
  },
  {
    slug: "wall-slide",
    name: "Wall Slide",
    description:
      "Standing facing a wall with forearms/hands on the wall, slide arms upward while maintaining scapular posterior tilt and upward rotation.",
    dosing: "3×10–12 daily × 6–12 weeks",
    emgNotes:
      "Serratus anterior 32–46% MVIC; lower trap moderate; upper trap 0–15% MVIC. Adding theraband at wrists improves all UT ratios [Hardwick 2006; Uysal 2022].",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "standing",
    confidence: 0.92,
    movementSlugs: ["scapular-upward-rotation", "scapular-protraction", "shoulder-flexion"],
    muscleRoles: [
      { muscleSlug: "serratus-anterior", role: "primary", notes: "32–46% MVIC; activates SA ≥90° elevation" },
      { muscleSlug: "trapezius-lower", role: "primary", notes: "Moderate activation ≥90° elevation" },
      { muscleSlug: "trapezius-middle", role: "secondary" },
      { muscleSlug: "infraspinatus", role: "secondary" },
      { muscleSlug: "trapezius-upper", role: "stabilizer", notes: "0–15% MVIC — kept low intentionally" },
    ],
    cues: [
      { text: "Slide arms up the wall while keeping shoulder blades down and back", cueType: "verbal" },
      { text: "Maintain wall contact throughout", cueType: "verbal" },
      { text: "Rotate shoulder blades upward, don't shrug", cueType: "verbal" },
      { text: "Finger pressure between the scapulae encourages protraction", cueType: "tactile" },
    ],
    regressions: [
      { name: "Partial Range Wall Slide", description: "Limit to 0–90° elevation initially." },
    ],
    progressions: [
      { name: "Theraband Wall Slide", description: "Add a resistance band at the wrists for greater SA activation and improved UT ratios." },
      { name: "Single-Arm Wall Slide", description: "Perform one arm at a time to increase demand and expose asymmetries." },
    ],
  },
  {
    slug: "scaption-with-external-rotation",
    name: "Scaption with External Rotation",
    description:
      "Standing with arms elevated in the scapular plane (30–45° anterior to coronal), thumbs up, externally rotate to bias posterior rotator cuff.",
    dosing: "3×10–12, 3×/week × 12 weeks",
    emgNotes:
      "Activates all three upward-rotation force couple components (UT, LT, SA) [Castelein 2016; Decker 1999].",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: ["dumbbell"],
    bodyPosition: "standing",
    confidence: 0.85,
    movementSlugs: ["scapular-upward-rotation", "shoulder-flexion", "shoulder-abduction", "shoulder-external-rotation"],
    muscleRoles: [
      { muscleSlug: "serratus-anterior", role: "primary" },
      { muscleSlug: "trapezius-upper", role: "primary" },
      { muscleSlug: "trapezius-lower", role: "primary" },
      { muscleSlug: "supraspinatus", role: "secondary" },
      { muscleSlug: "middle-deltoid", role: "secondary" },
      { muscleSlug: "anterior-deltoid", role: "secondary" },
      { muscleSlug: "infraspinatus", role: "synergist" },
    ],
    cues: [
      { text: "Lift arms at a 45° angle in front of you", cueType: "verbal" },
      { text: "Thumbs point toward ceiling", cueType: "verbal" },
      { text: "Rotate shoulder blades upward as you lift", cueType: "verbal" },
      { text: "Stop at shoulder height initially", cueType: "verbal" },
    ],
    regressions: [
      { name: "Unweighted Scaption", description: "Bodyweight only, full ROM." },
    ],
    progressions: [
      { name: "Increased Load", description: "Progress to 3–5 lb, then 8 lb." },
      { name: "Full Overhead Scaption", description: "Progress to full overhead elevation." },
      { name: "Single-Arm Scaption", description: "Unilateral to challenge trunk stability." },
    ],
  },
  {
    slug: "dynamic-hug",
    name: "Dynamic Hug",
    description:
      "Standing with resistance band or cable behind you, arms forward at 90° flexion. Horizontally adduct arms across body while maintaining scapular protraction.",
    dosing: "3×12–15, 3×/week × 8–12 weeks",
    emgNotes: "Serratus anterior >20% MVIC; upper trap low [Decker 1999].",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: ["resistance-band"],
    bodyPosition: "standing",
    confidence: 0.85,
    movementSlugs: ["scapular-protraction", "shoulder-horizontal-adduction"],
    muscleRoles: [
      { muscleSlug: "serratus-anterior", role: "primary", notes: ">20% MVIC" },
      { muscleSlug: "pectoralis-major", role: "secondary" },
      { muscleSlug: "anterior-deltoid", role: "secondary" },
      { muscleSlug: "trapezius-upper", role: "stabilizer", notes: "Low activation" },
    ],
    cues: [
      { text: "Reach forward and wrap arms across your chest", cueType: "verbal" },
      { text: "Keep shoulder blades spread apart", cueType: "verbal" },
      { text: "Don't let shoulders round forward", cueType: "verbal" },
      { text: "Squeeze at end range", cueType: "verbal" },
    ],
    regressions: [{ name: "Light Band", description: "Start with a light resistance band." }],
    progressions: [
      { name: "Heavy Band / Cable", description: "Progress load." },
      { name: "Single-Arm Dynamic Hug", description: "Unilateral to expose asymmetries." },
    ],
  },
  {
    slug: "supine-scapular-punch",
    name: "Supine Scapular Punch",
    description:
      "Supine holding a light dumbbell, arm pointing toward ceiling with elbow locked. Punch toward ceiling by protracting scapula 2–3 inches off the table.",
    dosing: "3×10–15 daily (early rehabilitation). 1–5 lb.",
    emgNotes:
      "Serratus anterior 28.9–44.3% MVIC; upper trap <6%; UT:SA ratio 0.09–0.18 [Intelangelo 2022].",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: ["dumbbell"],
    bodyPosition: "supine",
    confidence: 0.9,
    movementSlugs: ["scapular-protraction", "scapular-upward-rotation"],
    muscleRoles: [
      { muscleSlug: "serratus-anterior", role: "primary", notes: "28.9–44.3% MVIC" },
      { muscleSlug: "trapezius-upper", role: "stabilizer", notes: "<6% MVIC — excellent UT:SA ratio 0.09–0.18" },
      { muscleSlug: "infraspinatus", role: "stabilizer", notes: "<10% MVIC" },
      { muscleSlug: "pectoralis-major", role: "stabilizer", notes: "Minimal" },
    ],
    cues: [
      { text: "Push the weight toward the ceiling by lifting the shoulder blade off the table", cueType: "verbal" },
      { text: "Elbow stays locked throughout", cueType: "verbal" },
      { text: "Small movement — 2–3 inches", cueType: "verbal" },
      { text: "Hand under the scapula to feel protraction", cueType: "tactile" },
    ],
    regressions: [{ name: "Unweighted Punch", description: "No dumbbell, focus on motion quality." }],
    progressions: [
      { name: "3–5 lb Punch", description: "Add light load as tolerated." },
      { name: "Standing Cable Punch", description: "Progress to upright cable punch." },
    ],
  },
  {
    slug: "side-lying-external-rotation",
    name: "Side-Lying External Rotation",
    description:
      "Side-lying on uninvolved side with a towel roll under the working elbow. Elbow at 90°, externally rotate shoulder against light resistance.",
    dosing: "3×12–15, 3×/week × 6–12 weeks. 1–5 lb.",
    emgNotes:
      "Lower trap moderate; serratus anterior moderate; upper trap low. UT:SA 0.26, UT:LT 0.21 [Mendez-Rebolledo 2024; Cools 2007].",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: ["dumbbell"],
    bodyPosition: "sidelying",
    confidence: 0.92,
    movementSlugs: ["shoulder-external-rotation", "scapular-depression"],
    muscleRoles: [
      { muscleSlug: "infraspinatus", role: "primary" },
      { muscleSlug: "teres-minor", role: "primary" },
      { muscleSlug: "posterior-deltoid", role: "secondary" },
      { muscleSlug: "trapezius-lower", role: "secondary", notes: "Moderate — good below 90° elevation" },
      { muscleSlug: "serratus-anterior", role: "stabilizer" },
      { muscleSlug: "trapezius-upper", role: "stabilizer", notes: "Low — excellent UT:LT ratio" },
    ],
    cues: [
      { text: "Keep elbow tucked to side", cueType: "verbal" },
      { text: "Rotate arm outward slowly", cueType: "verbal" },
      { text: "Don't let shoulder blade roll forward", cueType: "verbal" },
      { text: "Small towel roll under the elbow for comfort", cueType: "tactile" },
    ],
    regressions: [{ name: "Light Load", description: "1–2 lb dumbbell." }],
    progressions: [
      { name: "Standing Cable ER", description: "Upright cable external rotation." },
      { name: "90° Abducted ER", description: "Full can position at 90° abduction." },
    ],
  },
  {
    slug: "prone-y-raise",
    name: "Prone Y-Raise",
    description:
      "Prone with arms elevated overhead in a Y (135° abduction, thumbs up). Lift arms toward ceiling while squeezing blades down and together.",
    dosing: "3×10–12, 3×/week × 8–12 weeks. 1–3 lb.",
    emgNotes:
      "Highest lower trapezius activation among prone exercises; middle trap moderate [Arlotta 2011; Garcia 2023].",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "prone",
    confidence: 0.9,
    movementSlugs: ["scapular-depression", "scapular-upward-rotation", "shoulder-flexion"],
    muscleRoles: [
      { muscleSlug: "trapezius-lower", role: "primary", notes: "Highest prone-exercise activation" },
      { muscleSlug: "trapezius-middle", role: "secondary" },
      { muscleSlug: "serratus-anterior", role: "secondary" },
      { muscleSlug: "posterior-deltoid", role: "secondary" },
      { muscleSlug: "supraspinatus", role: "stabilizer" },
    ],
    cues: [
      { text: "Lift arms in a Y, thumbs up", cueType: "verbal" },
      { text: "Squeeze shoulder blades down and together", cueType: "verbal" },
      { text: "Keep chin tucked", cueType: "verbal" },
      { text: "Pull shoulder blades into back pockets", cueType: "verbal" },
    ],
    regressions: [{ name: "Incline Prone Y", description: "30–45° incline to reduce load." }],
    progressions: [
      { name: "Loaded Prone Y", description: "Add 1–2 lb, then 3–5 lb." },
      { name: "Prone I-Raise", description: "Arms fully overhead for greater LT demand." },
    ],
  },
  {
    slug: "low-row-band",
    name: "Low Row (Band/Cable)",
    description:
      "Seated or standing, pull a resistance band or cable toward the abdomen while retracting scapulae, elbows close to body.",
    dosing: "3×10–15, 3×/week × 12 weeks",
    emgNotes:
      "Middle trap moderate-high; lower trap moderate; rhomboid major moderate [Kibler 2008]. Appropriate early rehab (limited ROM).",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: ["resistance-band", "cable-machine"],
    bodyPosition: "seated",
    confidence: 0.9,
    movementSlugs: ["scapular-retraction", "scapular-depression", "shoulder-extension"],
    muscleRoles: [
      { muscleSlug: "trapezius-middle", role: "primary" },
      { muscleSlug: "trapezius-lower", role: "primary" },
      { muscleSlug: "rhomboid-major", role: "secondary" },
      { muscleSlug: "latissimus-dorsi", role: "secondary" },
      { muscleSlug: "biceps-brachii", role: "synergist" },
      { muscleSlug: "posterior-deltoid", role: "secondary" },
    ],
    cues: [
      { text: "Pull elbows straight back toward hips", cueType: "verbal" },
      { text: "Squeeze shoulder blades together at end", cueType: "verbal" },
      { text: "Keep shoulders down, don't shrug", cueType: "verbal" },
      { text: "Lead with elbows, not hands", cueType: "verbal" },
    ],
    regressions: [{ name: "Light Band", description: "Begin with light resistance." }],
    progressions: [
      { name: "Heavy Band/Cable", description: "Progress load." },
      { name: "Single-Arm Low Row", description: "Unilateral to expose asymmetries." },
    ],
  },
  {
    slug: "inverted-row",
    name: "Inverted Row",
    description:
      "Supine under a bar or suspension trainer, pull body toward the bar while maintaining scapular retraction and a rigid plank body line.",
    dosing: "3×8–12, 2–3×/week × 8–12 weeks",
    emgNotes:
      "Lower trap >61% MVIC; middle trap 41–60%; upper trap 41–60%; lat and biceps >61% [Youdas 2016].",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: ["suspension-trainer", "barbell"],
    bodyPosition: "supine",
    confidence: 0.9,
    movementSlugs: ["scapular-retraction", "shoulder-extension", "elbow-flexion"],
    muscleRoles: [
      { muscleSlug: "trapezius-lower", role: "primary", notes: ">61% MVIC" },
      { muscleSlug: "trapezius-middle", role: "primary", notes: "41–60% MVIC" },
      { muscleSlug: "latissimus-dorsi", role: "primary", notes: ">61% MVIC" },
      { muscleSlug: "biceps-brachii", role: "secondary", notes: ">61% MVIC" },
      { muscleSlug: "posterior-deltoid", role: "secondary", notes: ">61% MVIC" },
      { muscleSlug: "trapezius-upper", role: "secondary", notes: "41–60% MVIC" },
      { muscleSlug: "rectus-abdominis", role: "stabilizer" },
    ],
    cues: [
      { text: "Pull chest to bar", cueType: "verbal" },
      { text: "Squeeze shoulder blades together", cueType: "verbal" },
      { text: "Body straight like a plank", cueType: "verbal" },
      { text: "Lead with chest, not chin", cueType: "verbal" },
    ],
    regressions: [
      { name: "Vertical Inverted Row", description: "Feet on ground, body more vertical to offload." },
    ],
    progressions: [
      { name: "Horizontal Inverted Row", description: "Feet further forward, body more horizontal." },
      { name: "Feet-Elevated Inverted Row", description: "Feet on a box for greater load." },
      { name: "Weighted Vest Inverted Row", description: "Add external load." },
    ],
  },
  {
    slug: "upward-rotation-shrug-30-abduction",
    name: "Upward Rotation Shrug (30° Abduction)",
    description:
      "Standing with arms abducted 30° in the coronal plane, elevate shoulders (shrug) while maintaining arm position. Modified shrug to bias upward rotators.",
    dosing: "3×10–15, 3×/week × 6 weeks. 5–10 lb, progress thereafter.",
    emgNotes:
      "Significantly greater upper trap and lower trap activation vs. standard shrug; levator scapulae moderate [Pizzari 2014; Choi 2015].",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: ["dumbbell"],
    bodyPosition: "standing",
    confidence: 0.85,
    movementSlugs: ["scapular-elevation", "scapular-upward-rotation"],
    muscleRoles: [
      { muscleSlug: "trapezius-upper", role: "primary" },
      { muscleSlug: "trapezius-lower", role: "primary" },
      { muscleSlug: "levator-scapulae", role: "secondary" },
      { muscleSlug: "serratus-anterior", role: "secondary" },
      { muscleSlug: "trapezius-middle", role: "synergist" },
    ],
    cues: [
      { text: "Hold arms out at 30° angle", cueType: "verbal" },
      { text: "Shrug shoulders up toward ears", cueType: "verbal" },
      { text: "Rotate shoulder blades upward", cueType: "verbal" },
      { text: "Don't let arms drop during the shrug", cueType: "verbal" },
    ],
    regressions: [{ name: "Bodyweight Shrug", description: "No load, focus on coordination." }],
    progressions: [
      { name: "Load Progression", description: "5–10 lb → moderate load." },
      { name: "90° Abduction Shrug", description: "Higher upper and lower trap activation." },
      { name: "150° Abduction Shrug", description: "Greatest serratus anterior contribution." },
    ],
  },

  // ─── Gait / Lower-Limb Exercises ───────────────────────────────────────────
  {
    slug: "eccentric-step-down",
    name: "Eccentric Step-Down",
    description:
      "Stand on a step on the working leg; slowly lower the non-working heel toward the floor, then return. Progress height 4\" → 8\" → 12\".",
    dosing: "3×10, 2–3×/week. Progress step height.",
    emgNotes:
      "Produces highest hip flexion and adduction moment impulses among stepping tasks; effective for hip strengthening [Hatfield 2017].",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: ["step-box"],
    bodyPosition: "standing",
    confidence: 0.9,
    movementSlugs: ["knee-flexion", "knee-extension", "hip-flexion", "hip-extension"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "Eccentric control — shock absorption analogue for loading response" },
      { muscleSlug: "gluteus-medius", role: "primary", notes: "Pelvic stability during single-limb loading" },
      { muscleSlug: "gluteus-maximus", role: "secondary" },
      { muscleSlug: "hamstrings", role: "stabilizer" },
      { muscleSlug: "soleus", role: "stabilizer" },
    ],
    cues: [
      { text: "Lower slowly — 3-second count down", cueType: "verbal" },
      { text: "Keep knee tracking over second toe", cueType: "verbal" },
      { text: "Don't let the hip drop on the non-working side", cueType: "verbal" },
    ],
    regressions: [{ name: "4-inch Step-Down", description: "Reduce step height." }],
    progressions: [
      { name: "8-inch Step-Down", description: "Increase height." },
      { name: "12-inch Step-Down", description: "Maximum height." },
      { name: "Weighted Step-Down", description: "Add dumbbells or weighted vest." },
    ],
    gaitPhaseSlugs: [
      { slug: "loading-response", rationale: "Eccentric quadriceps control for shock absorption during weight acceptance." },
      { slug: "initial-contact", rationale: "Prepares quadriceps for controlled knee flexion on heel strike." },
    ],
  },
  {
    slug: "lateral-step-up",
    name: "Lateral Step-Up",
    description:
      "Stand beside a step; step up sideways onto it by driving through the top leg's heel, then lower with control.",
    dosing: "3×10 per side, 2×/week. Progress height and load.",
    emgNotes: "Lateral step-ups produce >45% MVIC VMO, beneficial for strengthening [Ekstrom 2007].",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["step-box"],
    bodyPosition: "standing",
    confidence: 0.88,
    movementSlugs: ["knee-extension", "hip-extension", "hip-abduction"],
    muscleRoles: [
      { muscleSlug: "gluteus-medius", role: "primary" },
      { muscleSlug: "vastus-medialis", role: "primary", notes: ">45% MVIC" },
      { muscleSlug: "quadriceps", role: "primary" },
      { muscleSlug: "gluteus-maximus", role: "secondary" },
      { muscleSlug: "soleus", role: "stabilizer" },
    ],
    cues: [
      { text: "Drive through the heel of the top leg", cueType: "verbal" },
      { text: "Keep hips level throughout", cueType: "verbal" },
      { text: "Lower with control — don't drop", cueType: "verbal" },
    ],
    regressions: [{ name: "Low Lateral Step-Up", description: "4-inch box to start." }],
    progressions: [
      { name: "Higher Box", description: "8\" then 12\"." },
      { name: "Weighted Lateral Step-Up", description: "Add dumbbells." },
    ],
    gaitPhaseSlugs: [
      { slug: "loading-response", rationale: "Pelvic stability and frontal-plane control during single-limb loading." },
      { slug: "mid-stance", rationale: "Glute med engagement to prevent contralateral pelvic drop." },
    ],
  },
  {
    slug: "heel-raise-eccentric",
    name: "Heel Raise (Eccentric Emphasis)",
    description:
      "Standing heel raise with slow eccentric lowering (4 seconds). Progress from bilateral to unilateral.",
    dosing: "3×15 bilateral → 3×10 unilateral, 3×/week.",
    emgNotes:
      "Ankle plantarflexor strengthening improves PF strength SMD=0.35 and balance SMD=0.41 [Liang 2025].",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.9,
    movementSlugs: ["ankle-plantarflexion"],
    muscleRoles: [
      { muscleSlug: "gastrocnemius", role: "primary" },
      { muscleSlug: "soleus", role: "primary", notes: "Eccentric tibial-advancement control" },
      { muscleSlug: "tibialis-posterior", role: "secondary" },
      { muscleSlug: "peroneus-longus", role: "stabilizer" },
      { muscleSlug: "flexor-hallucis-longus", role: "synergist" },
    ],
    cues: [
      { text: "Rise up onto the balls of the feet", cueType: "verbal" },
      { text: "Lower slowly — 4-second count", cueType: "verbal" },
      { text: "Keep weight evenly distributed across all toes", cueType: "verbal" },
    ],
    regressions: [{ name: "Supported Heel Raise", description: "Hold a counter for balance." }],
    progressions: [
      { name: "Single-Leg Heel Raise", description: "Unilateral loading." },
      { name: "Loaded Single-Leg Heel Raise", description: "Add dumbbell or weighted vest." },
      { name: "Seated Heel Raise (Soleus Focus)", description: "Knee bent 90° to isolate soleus." },
    ],
    gaitPhaseSlugs: [
      { slug: "mid-stance", rationale: "Eccentric soleus control during tibial advancement." },
      { slug: "terminal-stance", rationale: "Concentric gastroc/soleus for push-off preparation." },
      { slug: "pre-swing", rationale: "Maximum concentric plantarflexor power generation at toe-off." },
    ],
  },
  {
    slug: "single-leg-stance-unstable",
    name: "Single-Leg Stance on Unstable Surface",
    description:
      "Balance on one leg on an unstable surface (foam pad, BOSU, Airex). Progress with eyes closed, perturbations, or dual-task.",
    dosing: "3×30–60 s per leg, daily.",
    emgNotes: "Unstable-surface training improves balance ES=0.52 [Dipietro 2019].",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["foam-pad", "bosu"],
    bodyPosition: "standing",
    confidence: 0.88,
    movementSlugs: ["ankle-dorsiflexion", "ankle-plantarflexion", "foot-inversion", "foot-eversion"],
    muscleRoles: [
      { muscleSlug: "soleus", role: "primary" },
      { muscleSlug: "gastrocnemius", role: "primary" },
      { muscleSlug: "gluteus-medius", role: "primary", notes: "Pelvic stability" },
      { muscleSlug: "tibialis-anterior", role: "secondary" },
      { muscleSlug: "peroneus-longus", role: "secondary" },
      { muscleSlug: "peroneus-brevis", role: "stabilizer" },
    ],
    cues: [
      { text: "Stand tall, ribs stacked over pelvis", cueType: "verbal" },
      { text: "Soft micro-adjustments through the foot, not big sways", cueType: "verbal" },
      { text: "Eyes forward at a fixed point", cueType: "verbal" },
    ],
    regressions: [{ name: "Firm-Surface Single-Leg Stance", description: "Start on stable ground." }],
    progressions: [
      { name: "Eyes Closed", description: "Remove visual feedback." },
      { name: "Perturbations", description: "Add external perturbations." },
      { name: "Dual-Task", description: "Add a cognitive or motor second task." },
    ],
    gaitPhaseSlugs: [
      { slug: "mid-stance", rationale: "Single-limb support demand replicated in isolation." },
    ],
  },
  {
    slug: "forward-lunge",
    name: "Forward Lunge",
    description:
      "Step forward into a lunge, lowering the back knee toward the floor, then drive back to standing.",
    dosing: "3×10/leg, 2×/week.",
    emgNotes: ">45% MVIC VMO during lunges [Ekstrom 2007].",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.85,
    movementSlugs: ["hip-flexion", "hip-extension", "knee-flexion", "knee-extension"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: ">45% MVIC VMO" },
      { muscleSlug: "gluteus-maximus", role: "primary" },
      { muscleSlug: "adductor-group", role: "secondary" },
      { muscleSlug: "hamstrings", role: "stabilizer" },
      { muscleSlug: "gluteus-medius", role: "stabilizer" },
    ],
    cues: [
      { text: "Step far enough forward to keep front shin near vertical", cueType: "verbal" },
      { text: "Lower the back knee toward the floor", cueType: "verbal" },
      { text: "Drive straight up through the front heel", cueType: "verbal" },
    ],
    regressions: [{ name: "Split Squat", description: "Stationary split stance instead of stepping." }],
    progressions: [
      { name: "Walking Lunge", description: "Alternate forward lunges while walking." },
      { name: "Weighted Lunge", description: "Dumbbells or barbell." },
    ],
    gaitPhaseSlugs: [
      { slug: "mid-stance", rationale: "Hip extension under single-limb load." },
      { slug: "terminal-stance", rationale: "Hip-extension strength for push-off." },
    ],
  },
  {
    slug: "side-bridge",
    name: "Side-Bridge",
    description:
      "Sidelying on forearm, lift hips so body forms a straight line from head to feet; hold.",
    dosing: "3×30 s per side, 3×/week.",
    emgNotes: ">45% MVIC gluteus medius and external obliques [Ekstrom 2007].",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "sidelying",
    confidence: 0.88,
    movementSlugs: ["hip-abduction", "lateral-pelvic-tilt"],
    muscleRoles: [
      { muscleSlug: "gluteus-medius", role: "primary", notes: ">45% MVIC" },
      { muscleSlug: "external-oblique", role: "primary", notes: ">45% MVIC" },
      { muscleSlug: "quadratus-lumborum", role: "secondary" },
      { muscleSlug: "internal-oblique", role: "secondary" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer" },
    ],
    cues: [
      { text: "Stack shoulders, hips, and ankles in one line", cueType: "verbal" },
      { text: "Drive the bottom hip up, not forward", cueType: "verbal" },
      { text: "Keep head aligned with spine", cueType: "verbal" },
    ],
    regressions: [{ name: "Short-Lever Side-Bridge", description: "Knees bent, side-plank from knees." }],
    progressions: [
      { name: "Top-Leg Lift Side-Bridge", description: "Lift the top leg for extra glute med demand." },
      { name: "Side-Bridge with Rotation", description: "Thread top arm under body and return." },
    ],
    gaitPhaseSlugs: [
      { slug: "mid-stance", rationale: "Frontal-plane pelvic stability during single-limb support." },
      { slug: "loading-response", rationale: "Prevent Trendelenburg-type lateral trunk lean." },
    ],
  },
  {
    slug: "calf-raise-explosive",
    name: "Calf Raise (Explosive Concentric)",
    description:
      "Heel raise with a 1-second explosive concentric and 3-second controlled eccentric. Progress to single-leg with load.",
    dosing: "3×12, 3×/week. 70–80% 1RM when loaded.",
    emgNotes:
      "Progressive resistance at 70–80% 1RM improves gait speed MD=0.13 m/s [Van Abbema 2015].",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: ["dumbbell"],
    bodyPosition: "standing",
    confidence: 0.88,
    movementSlugs: ["ankle-plantarflexion"],
    muscleRoles: [
      { muscleSlug: "gastrocnemius", role: "primary" },
      { muscleSlug: "soleus", role: "primary" },
      { muscleSlug: "flexor-hallucis-longus", role: "secondary" },
      { muscleSlug: "peroneus-longus", role: "stabilizer" },
    ],
    cues: [
      { text: "Explode up to the ball of the foot", cueType: "verbal" },
      { text: "Lower slowly — 3 seconds down", cueType: "verbal" },
      { text: "Pause at the bottom before the next rep", cueType: "verbal" },
    ],
    regressions: [{ name: "Slow Calf Raise", description: "Remove tempo emphasis, focus on range." }],
    progressions: [
      { name: "Single-Leg Explosive Calf Raise", description: "Unilateral loading." },
      { name: "Loaded Single-Leg Calf Raise", description: "Dumbbell or barbell." },
      { name: "Plyometric Bounding", description: "Horizontal bounding for eccentric overload." },
    ],
    gaitPhaseSlugs: [
      { slug: "terminal-stance", rationale: "Concentric PF power for propulsion." },
      { slug: "pre-swing", rationale: "Maximum PF power at toe-off." },
    ],
  },
  {
    slug: "active-straight-leg-raise",
    name: "Active Straight Leg Raise (ASLR)",
    description:
      "Supine, lift a straight leg to approximately 60° hip flexion while keeping the opposite leg flat.",
    dosing: "3×10/leg, 2–3×/week.",
    emgNotes: "Iliopsoas >60% MVIC at 60° hip flexion [Juan 2024].",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    confidence: 0.9,
    movementSlugs: ["hip-flexion"],
    muscleRoles: [
      { muscleSlug: "iliopsoas", role: "primary", notes: ">60% MVIC at 60° hip flexion" },
      { muscleSlug: "rectus-femoris", role: "secondary" },
      { muscleSlug: "tibialis-anterior", role: "secondary" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer" },
    ],
    cues: [
      { text: "Keep the lifting leg straight", cueType: "verbal" },
      { text: "Opposite knee stays flat on the floor", cueType: "verbal" },
      { text: "Pelvis stays level — don't hike the lifting side", cueType: "verbal" },
    ],
    regressions: [{ name: "Partial ASLR", description: "30° range only." }],
    progressions: [
      { name: "Ankle-Weight ASLR", description: "Add 1–3 lb ankle weight." },
      { name: "Band-Resisted ASLR", description: "Light band around the thigh." },
    ],
    gaitPhaseSlugs: [
      { slug: "initial-swing", rationale: "Primary hip-flexor drive for limb advancement." },
      { slug: "mid-swing", rationale: "Sustained iliopsoas activity to clear the foot." },
    ],
  },
  {
    slug: "a-skip-drill",
    name: "A-Skip Drill",
    description:
      "Running drill combining high-knee drive, quick ground contact, and coordinated arm action. Emphasizes hip flexion initiation and plantarflexor push-off.",
    dosing: "3×20 m, 2×/week (athletic population).",
    emgNotes:
      "Lower plantarflexor loads than running — appropriate for progressive loading [Trowell 2022].",
    evidenceLevel: "moderate",
    difficulty: "advanced",
    equipment: [],
    bodyPosition: "standing",
    confidence: 0.82,
    movementSlugs: ["hip-flexion", "ankle-plantarflexion"],
    muscleRoles: [
      { muscleSlug: "iliopsoas", role: "primary" },
      { muscleSlug: "rectus-femoris", role: "primary" },
      { muscleSlug: "gastrocnemius", role: "primary" },
      { muscleSlug: "soleus", role: "secondary" },
      { muscleSlug: "tibialis-anterior", role: "secondary" },
      { muscleSlug: "gluteus-maximus", role: "stabilizer" },
    ],
    cues: [
      { text: "Drive knee up, toe up", cueType: "verbal" },
      { text: "Quick ground contact — think hot coals", cueType: "verbal" },
      { text: "Arms swing opposite to legs, elbows at 90°", cueType: "verbal" },
    ],
    regressions: [{ name: "Marching A-Skip", description: "Walking tempo to learn the pattern." }],
    progressions: [
      { name: "B-Skip", description: "Add leg extension after the high-knee drive." },
      { name: "Bounding", description: "Exaggerated horizontal stride." },
    ],
    gaitPhaseSlugs: [
      { slug: "pre-swing", rationale: "Coordinate push-off with hip-flexion initiation." },
      { slug: "initial-swing", rationale: "Rapid hip flexion with dorsiflexion for foot clearance." },
    ],
  },
  {
    slug: "nordic-hamstring-curl",
    name: "Nordic Hamstring Curl",
    description:
      "Kneeling with ankles anchored, lower the upper body toward the floor as slowly as possible using hamstrings eccentrically, then push back up.",
    dosing: "3×6–8, 2×/week.",
    emgNotes:
      "Hamstrings show greatest activity during swing deceleration; eccentric training reduces hamstring injury risk [Dubo 1976; Askling series].",
    evidenceLevel: "strong",
    difficulty: "advanced",
    equipment: ["partner-or-anchor"],
    bodyPosition: "kneeling",
    confidence: 0.9,
    movementSlugs: ["knee-flexion", "hip-extension"],
    muscleRoles: [
      { muscleSlug: "biceps-femoris-long", role: "primary", notes: "Maximal eccentric loading" },
      { muscleSlug: "semitendinosus", role: "primary" },
      { muscleSlug: "semimembranosus", role: "primary" },
      { muscleSlug: "gluteus-maximus", role: "secondary" },
      { muscleSlug: "erector-spinae", role: "stabilizer" },
    ],
    cues: [
      { text: "Resist the fall as long as possible", cueType: "verbal" },
      { text: "Keep hips extended — no piking at the hips", cueType: "verbal" },
      { text: "Catch with hands only if needed", cueType: "verbal" },
    ],
    regressions: [{ name: "Band-Assisted Nordic", description: "Overhead band to offload." }],
    progressions: [
      { name: "Full-Range Nordic", description: "No assistance, full descent." },
      { name: "Weighted Nordic", description: "Hold a plate at the chest for added load." },
    ],
    gaitPhaseSlugs: [
      { slug: "terminal-swing", rationale: "Eccentric hamstring deceleration of the swing limb." },
      { slug: "initial-contact", rationale: "Hamstrings prepare for heel strike co-contraction." },
    ],
  },
];

async function seedNewExercises() {
  logSection("New exercises (scapular + gait)");

  const [movs, muscs, phases] = await Promise.all([
    prisma.movement.findMany({ select: { id: true, slug: true } }),
    prisma.muscle.findMany({ select: { id: true, slug: true } }),
    prisma.gaitPhase.findMany({ select: { id: true, slug: true } }),
  ]);

  const movementMap = new Map(movs.map((m) => [m.slug, m.id]));
  const muscleMap = new Map(muscs.map((m) => [m.slug, m.id]));
  const phaseMap = new Map(phases.map((p) => [p.slug, p.id]));

  for (const ex of newExercises) {
    const exercise = await prisma.exercise.upsert({
      where: { slug: ex.slug },
      update: {
        name: ex.name,
        description: ex.description,
        dosing: ex.dosing,
        emgNotes: ex.emgNotes,
        evidenceLevel: ex.evidenceLevel,
        difficulty: ex.difficulty,
        equipment: ex.equipment ?? [],
        bodyPosition: ex.bodyPosition,
        confidence: ex.confidence ?? 0.85,
      },
      create: {
        slug: ex.slug,
        name: ex.name,
        description: ex.description,
        status: "draft",
        confidence: ex.confidence ?? 0.85,
        dosing: ex.dosing,
        emgNotes: ex.emgNotes,
        evidenceLevel: ex.evidenceLevel,
        difficulty: ex.difficulty,
        equipment: ex.equipment ?? [],
        bodyPosition: ex.bodyPosition,
      },
    });

    for (const ms of ex.movementSlugs) {
      const movementId = movementMap.get(ms);
      if (!movementId) throw new Error(`Movement not found: ${ms}`);
      await prisma.exerciseMovement.upsert({
        where: { exerciseId_movementId: { exerciseId: exercise.id, movementId } },
        update: {},
        create: { exerciseId: exercise.id, movementId },
      });
    }

    for (const mr of ex.muscleRoles) {
      const muscleId = muscleMap.get(mr.muscleSlug);
      if (!muscleId) throw new Error(`Muscle not found: ${mr.muscleSlug}`);
      await prisma.exerciseMuscle.upsert({
        where: { exerciseId_muscleId: { exerciseId: exercise.id, muscleId } },
        update: { role: mr.role, notes: mr.notes },
        create: { exerciseId: exercise.id, muscleId, role: mr.role, notes: mr.notes },
      });
    }

    await prisma.cue.deleteMany({ where: { exerciseId: exercise.id } });
    for (let i = 0; i < ex.cues.length; i++) {
      await prisma.cue.create({
        data: {
          text: ex.cues[i].text,
          cueType: ex.cues[i].cueType ?? "verbal",
          order: i,
          exerciseId: exercise.id,
        },
      });
    }

    await prisma.regression.deleteMany({ where: { exerciseId: exercise.id } });
    for (let i = 0; i < ex.regressions.length; i++) {
      await prisma.regression.create({
        data: {
          name: ex.regressions[i].name,
          description: ex.regressions[i].description,
          order: i,
          exerciseId: exercise.id,
        },
      });
    }

    await prisma.progression.deleteMany({ where: { exerciseId: exercise.id } });
    for (let i = 0; i < ex.progressions.length; i++) {
      await prisma.progression.create({
        data: {
          name: ex.progressions[i].name,
          description: ex.progressions[i].description,
          order: i,
          exerciseId: exercise.id,
        },
      });
    }

    if (ex.gaitPhaseSlugs) {
      for (const gp of ex.gaitPhaseSlugs) {
        const gaitPhaseId = phaseMap.get(gp.slug);
        if (!gaitPhaseId) throw new Error(`Gait phase not found: ${gp.slug}`);
        await prisma.exerciseGaitPhase.upsert({
          where: { exerciseId_gaitPhaseId: { exerciseId: exercise.id, gaitPhaseId } },
          update: { rationale: gp.rationale },
          create: { exerciseId: exercise.id, gaitPhaseId, rationale: gp.rationale },
        });
      }
    }
  }

  logCount("new exercises", newExercises.length);
}

export async function seedGaitAndScapularExtension() {
  await seedPelvisAndNewMovements();
  await seedGaitPhases();
  await seedNewExercises();
}
