import { prisma, logSection, logCount } from "./client";
import { MuscleRole } from "@prisma/client";

interface ExerciseDef {
  slug: string;
  name: string;
  description: string;
  confidence: number;
  notes?: string;
  dosing?: string;
  emgNotes?: string;
  evidenceLevel?: string;
  difficulty?: string;
  equipment?: string[];
  bodyPosition?: string;
  movementSlugs: string[];
  muscleRoles: { muscleSlug: string; role: MuscleRole; notes?: string }[];
  functionalTaskSlugs?: string[];
  cues: { text: string; cueType: string }[];
  regressions: { name: string; description: string }[];
  progressions: { name: string; description: string }[];
}

const exercises: ExerciseDef[] = [
  {
    slug: "bridge",
    name: "Bridge",
    description: "Supine hip extension exercise. Patient lies on back with knees bent, feet flat on floor, and lifts hips toward ceiling by squeezing glutes.",
    confidence: 0.9,
    dosing: "3×10-15 reps, 2-3x/week",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    evidenceLevel: "moderate",
    emgNotes: "Glute max 20-40% MVIC; hamstrings 15-25% MVIC; single-leg variation significantly increases activation [Ekstrom 2007, Hirose 2018]",
    movementSlugs: ["hip-extension"],
    muscleRoles: [
      { muscleSlug: "gluteus-maximus", role: "primary" },
      { muscleSlug: "hamstrings", role: "secondary", notes: "15-25% MVIC — co-contraction pattern" },
      { muscleSlug: "erector-spinae", role: "stabilizer" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer" },
      { muscleSlug: "gluteus-medius", role: "stabilizer", notes: "Pelvic stabilizer during hip extension" },
    ],
    functionalTaskSlugs: ["pushing-up-from-chair", "squat-to-stand", "walking", "carrying-lifting", "floor-transfers", "bed-mobility"],
    cues: [
      { text: "Squeeze your glutes to lift your hips, don't push through your back", cueType: "verbal" },
      { text: "Keep your knees hip-width apart throughout the movement", cueType: "verbal" },
      { text: "Hold briefly at the top, then lower slowly", cueType: "verbal" },
    ],
    regressions: [
      { name: "Partial Bridge", description: "Lift hips only partway, reducing range of motion. Focus on glute activation rather than height." },
      { name: "Supported Bridge", description: "Place a pillow or yoga block under sacrum for supported hold. Focus on engaging glutes isometrically." },
    ],
    progressions: [
      { name: "Single-Leg Bridge", description: "Extend one leg while bridging on the other. Increases demand on the working glute and challenges pelvic stability." },
      { name: "Marching Bridge", description: "Hold bridge position and alternately lift knees toward chest. Challenges pelvic stability and hip flexor control." },
    ],
  },
  {
    slug: "clamshell",
    name: "Clamshell",
    description: "Sidelying hip external rotation exercise. Patient lies on side with hips and knees bent, feet together, and opens top knee like a clamshell.",
    confidence: 0.90,
    dosing: "3×15-20 reps per side, 2-3x/week",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "sidelying",
    evidenceLevel: "strong",
    emgNotes: "Glute med 26-67% MVIC; highest glute med-to-TFL ratio (115) among exercises [Selkowitz 2013]; 60° hip flexion optimal [Willcox 2013]",
    movementSlugs: ["hip-external-rotation", "hip-abduction"],
    muscleRoles: [
      { muscleSlug: "gluteus-medius", role: "primary", notes: "Posterior fibers" },
      { muscleSlug: "piriformis", role: "synergist", notes: "14.5% T2 change (fMRI) [Kim 2025]" },
      { muscleSlug: "gluteus-maximus", role: "synergist" },
      { muscleSlug: "tensor-fasciae-latae", role: "secondary", notes: "20-34% MVIC — monitor for over-activation [Selkowitz 2013]" },
      { muscleSlug: "gluteus-minimus", role: "synergist", notes: "4.5-7.2% T2 change [Kim 2025]" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing"],
    cues: [
      { text: "Keep your feet together as you open your knee", cueType: "verbal" },
      { text: "Don't let your pelvis roll backward — keep your hips stacked", cueType: "verbal" },
      { text: "Move slowly and control the return", cueType: "verbal" },
    ],
    regressions: [
      { name: "Reduced Range Clamshell", description: "Open the knee only partway. Focus on maintaining pelvic stability." },
    ],
    progressions: [
      { name: "Resisted Clamshell", description: "Add a resistance band around the thighs just above the knees." },
      { name: "Elevated Clamshell", description: "Lift feet off the surface while performing the clamshell. Increases gluteus medius demand." },
    ],
  },
  {
    slug: "squat",
    name: "Squat",
    description: "Compound lower extremity exercise. Standing hip and knee flexion-extension against gravity. Fundamental movement pattern for functional strength.",
    confidence: 0.95,
    notes: "EMG: quadriceps 67-79% MVIC [Andersen 2006]. VL and VM highest activity among evaluated muscles [Muyor 2020]. Monopodal squat significantly higher EMG than lunge/step-up (d>0.6) [Muyor 2020]. Squat with hip adduction increases VMO/VL ratio [Thongduang 2022]. Biomechanics: 0-50° flexion minimal joint forces (early rehab); parallel squat (0-100°) for healthy knees; forward trunk tilt reduces ACL loading [Escamilla 2001, 2012]. Dosing: moderate intensity, 3x/week, 20-60 min [Whitfield 2024].",
    dosing: "3×8-12 reps, 2-3x/week; moderate intensity",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "strong",
    emgNotes: "Quad 40-70% MVIC; glute max increases with depth: partial 16.9%, parallel 28.0%, full 35.4% [Caterisano 2002]",
    movementSlugs: ["hip-flexion", "hip-extension", "knee-flexion", "knee-extension", "ankle-dorsiflexion"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary" },
      { muscleSlug: "gluteus-maximus", role: "primary" },
      { muscleSlug: "hamstrings", role: "stabilizer", notes: "15-25% MVIC — co-contraction pattern for knee stability [Barrett 2023]" },
      { muscleSlug: "adductor-group", role: "secondary" },
      { muscleSlug: "erector-spinae", role: "stabilizer" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer" },
      { muscleSlug: "gastrocnemius", role: "stabilizer" },
      { muscleSlug: "soleus", role: "stabilizer" },
      { muscleSlug: "gluteus-medius", role: "stabilizer", notes: "30-45% MVIC pelvic stability [Muyor 2020]" },
    ],
    functionalTaskSlugs: ["squat-to-stand", "stair-climbing", "pushing-up-from-chair", "carrying-lifting", "dressing-lower-body", "floor-transfers"],
    cues: [
      { text: "Maintain a slight forward trunk tilt to reduce ACL stress", cueType: "verbal" },
      { text: "Keep your chest up and weight through your heels", cueType: "verbal" },
      { text: "Push your knees out over your toes — don't let them cave inward", cueType: "verbal" },
      { text: "For early rehab, restrict to 0-50° knee flexion; healthy knees can go to parallel", cueType: "verbal" },
      { text: "Squeeze a ball between your knees to preferentially activate VMO", cueType: "verbal" },
    ],
    regressions: [
      { name: "Wall Squat (Partial Range)", description: "Squat against a wall to 0-50° knee flexion. Minimal joint forces, appropriate for early rehabilitation." },
      { name: "Chair Squat", description: "Squat down to a chair and use it as a depth target. Reduces fear of falling and limits range." },
    ],
    progressions: [
      { name: "Bodyweight Parallel Squat", description: "Full squat to thighs parallel. 0-100° knee flexion." },
      { name: "Single-Leg Squat", description: "Significantly higher EMG activity than bilateral squat in all muscles (d > 0.6). Advanced balance and strength challenge." },
      { name: "Jump Squat", description: "Add an explosive jump at the top. Peak Fz/BW significantly higher. For advanced patients with no joint restrictions." },
    ],
  },
  {
    slug: "sit-to-stand",
    name: "Sit-to-Stand",
    description: "Functional transfer exercise. Patient rises from a seated position without using arms, emphasizing lower extremity strength and weight shift.",
    confidence: 0.9,
    dosing: "3×10 reps, daily; progress to 5×STS timed test",
    difficulty: "beginner",
    equipment: ["chair"],
    bodyPosition: "seated",
    evidenceLevel: "strong",
    movementSlugs: ["hip-extension", "knee-extension"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary" },
      { muscleSlug: "gluteus-maximus", role: "primary" },
      { muscleSlug: "hamstrings", role: "secondary" },
      { muscleSlug: "erector-spinae", role: "stabilizer" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer" },
      { muscleSlug: "tibialis-anterior", role: "stabilizer", notes: "Preparatory postural muscle — active during forward lean phase [Goulart 1999]" },
    ],
    functionalTaskSlugs: ["pushing-up-from-chair", "squat-to-stand", "dressing-lower-body", "bathing-hygiene", "floor-transfers", "bed-mobility"],
    cues: [
      { text: "Lean forward — nose over toes — before you stand", cueType: "verbal" },
      { text: "Push through your heels to stand up", cueType: "verbal" },
      { text: "Try not to use your hands", cueType: "verbal" },
    ],
    regressions: [
      { name: "Elevated Sit-to-Stand", description: "Use a higher chair or add cushions to reduce the range of motion required." },
      { name: "Armrest-Assisted", description: "Allow use of armrests for push-off while building strength." },
    ],
    progressions: [
      { name: "Slow Eccentric Sit-to-Stand", description: "Take 5 seconds to lower back to the chair. Builds eccentric quad and glute control." },
      { name: "Single-Leg Emphasis", description: "Place more weight on one leg during the transfer. Progress toward single-leg sit-to-stand." },
    ],
  },
  {
    slug: "heel-raise",
    name: "Heel Raise (Calf Raise)",
    description: "Standing plantarflexion exercise. Patient rises onto balls of feet, lifting heels off the ground.",
    confidence: 0.9,
    dosing: "3×15-20 reps bilateral, progress to 3×10-15 single-leg",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "moderate",
    emgNotes: "Gastroc and soleus co-primary ~23% MVIC each; knee bent shifts to soleus dominant [Hébert-Losier 2012]",
    movementSlugs: ["ankle-plantarflexion"],
    muscleRoles: [
      { muscleSlug: "gastrocnemius", role: "primary" },
      { muscleSlug: "soleus", role: "primary" },
      { muscleSlug: "tibialis-posterior", role: "synergist" },
      { muscleSlug: "peroneus-longus", role: "synergist", notes: "Dynamic lateral ankle stabilizer during heel raise" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing", "running-jogging"],
    cues: [
      { text: "Rise straight up — avoid leaning forward", cueType: "verbal" },
      { text: "Go as high as you can, then lower slowly", cueType: "verbal" },
      { text: "Keep your ankles straight — don't roll outward", cueType: "verbal" },
    ],
    regressions: [
      { name: "Seated Heel Raise", description: "Perform seated to reduce body weight load. Targets soleus more than gastrocnemius." },
      { name: "Wall-Supported Heel Raise", description: "Use a wall or counter for balance support." },
    ],
    progressions: [
      { name: "Single-Leg Heel Raise", description: "Perform on one leg to double the load. Progress when bilateral is easy for 15+ reps." },
      { name: "Eccentric Heel Lower", description: "Rise on two feet, lower on one foot slowly off a step edge. Excellent for Achilles tendinopathy rehab." },
    ],
  },
  {
    slug: "calf-stretch",
    name: "Calf Stretch (Wall Stretch)",
    description: "Standing stretch for the gastrocnemius and soleus. Patient places hands on wall with one foot forward and one back, leaning into the wall.",
    confidence: 0.90,
    dosing: "3×30 seconds per side, 2x daily",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "moderate",
    emgNotes: "Meta-analysis: increases dorsiflexion 2-3° across all durations [Radford 2006]",
    movementSlugs: ["ankle-dorsiflexion"],
    muscleRoles: [
      { muscleSlug: "gastrocnemius", role: "primary", notes: "Stretched with knee straight" },
      { muscleSlug: "soleus", role: "primary", notes: "Stretched with knee bent" },
    ],
    functionalTaskSlugs: ["walking", "running-jogging"],
    cues: [
      { text: "Keep your back heel on the ground", cueType: "verbal" },
      { text: "For gastrocnemius: keep back knee straight. For soleus: bend back knee slightly", cueType: "verbal" },
    ],
    regressions: [
      { name: "Seated Calf Stretch with Towel", description: "Sit with legs extended, loop a towel around the ball of the foot, and pull gently." },
    ],
    progressions: [
      { name: "Step Stretch", description: "Stand on the edge of a step and let the heel drop below the step level for a deeper stretch." },
    ],
  },
  {
    slug: "wrist-flexor-stretch",
    name: "Wrist Flexor Stretch",
    description: "Stretch for the forearm flexor group. Extend the elbow and use the other hand to gently extend the wrist and fingers.",
    confidence: 0.85,
    dosing: "3×30 seconds per side, before and after activity",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "moderate",
    movementSlugs: ["wrist-extension"],
    muscleRoles: [
      { muscleSlug: "flexor-carpi-radialis", role: "primary", notes: "Being stretched" },
      { muscleSlug: "flexor-carpi-ulnaris", role: "primary", notes: "Being stretched" },
      { muscleSlug: "flexor-digitorum-superficialis", role: "secondary", notes: "Being stretched" },
    ],
    functionalTaskSlugs: ["typing", "gripping-cup"],
    cues: [
      { text: "Keep your elbow straight and palm facing up", cueType: "verbal" },
      { text: "Use your other hand to gently pull the fingers back", cueType: "verbal" },
    ],
    regressions: [
      { name: "Table Stretch", description: "Place palms flat on a table with fingers pointing toward you. Gently lean back." },
    ],
    progressions: [
      { name: "Prayer Stretch with Fingers", description: "Press palms together in prayer position and lower hands while keeping palms together to increase stretch." },
    ],
  },
  {
    slug: "wrist-extensor-stretch",
    name: "Wrist Extensor Stretch",
    description: "Stretch for the forearm extensor group. Extend the elbow and use the other hand to gently flex the wrist.",
    confidence: 0.85,
    dosing: "3×30-45 seconds per side, before and after eccentric exercises",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "moderate",
    movementSlugs: ["wrist-flexion"],
    muscleRoles: [
      { muscleSlug: "extensor-carpi-radialis-longus", role: "primary", notes: "Being stretched" },
      { muscleSlug: "extensor-digitorum", role: "primary", notes: "Being stretched" },
    ],
    functionalTaskSlugs: ["typing", "gripping-cup"],
    cues: [
      { text: "Keep your elbow straight and palm facing down", cueType: "verbal" },
      { text: "Use your other hand to gently press the back of your hand down", cueType: "verbal" },
    ],
    regressions: [
      { name: "Gravity-Assisted Stretch", description: "Let the wrist hang over the edge of a table with palm down, allowing gravity to provide the stretch." },
    ],
    progressions: [
      { name: "Resisted Wrist Extension Eccentric", description: "Slowly lower a light weight from wrist extension to flexion. Combines stretch with eccentric strengthening." },
    ],
  },
  {
    slug: "scapular-retraction-exercise",
    name: "Scapular Retraction Exercise",
    description: "Squeeze shoulder blades together in a seated or standing position. Foundational exercise for scapular stability and posture.",
    confidence: 0.90,
    dosing: "3×10-15 reps with 5-second holds",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    evidenceLevel: "moderate",
    movementSlugs: ["scapular-retraction"],
    muscleRoles: [
      { muscleSlug: "trapezius-middle", role: "primary" },
      { muscleSlug: "rhomboid-major", role: "primary" },
    ],
    functionalTaskSlugs: ["reaching-overhead", "typing", "dressing-upper-body"],
    cues: [
      { text: "Pull your shoulder blades together as if pinching a pencil between them", cueType: "verbal" },
      { text: "Keep your shoulders down — don't shrug", cueType: "verbal" },
      { text: "Hold for 5 seconds, then release slowly", cueType: "verbal" },
    ],
    regressions: [
      { name: "Supine Scapular Retraction", description: "Perform lying on back to eliminate gravity. Press shoulder blades into the mat." },
    ],
    progressions: [
      { name: "Resisted Retraction (Band)", description: "Use a resistance band anchored at chest height. Pull elbows back to retract scapulae against resistance." },
      { name: "Prone Y Raise", description: "Lying face down, lift arms in a Y position overhead. Combines retraction with upward rotation." },
    ],
  },
  {
    slug: "resisted-external-rotation",
    name: "Resisted External Rotation",
    description: "Side-lying or standing with band/cable. Rotate forearm outward against resistance while keeping elbow at side. Key rotator cuff exercise.",
    confidence: 0.9,
    dosing: "3×8 at 8-RM, 3 days/week; 2-second eccentric",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "sidelying",
    evidenceLevel: "strong",
    emgNotes: "Infraspinatus 62% MVIC, teres minor 67% MVIC [Reinold 2004]",
    movementSlugs: ["shoulder-external-rotation"],
    muscleRoles: [
      { muscleSlug: "infraspinatus", role: "primary" },
      { muscleSlug: "teres-minor", role: "primary" },
      { muscleSlug: "posterior-deltoid", role: "secondary" },
    ],
    functionalTaskSlugs: ["reaching-overhead", "dressing-upper-body", "bathing-hygiene"],
    cues: [
      { text: "Keep your elbow pinned to your side — a towel roll helps", cueType: "verbal" },
      { text: "Rotate outward slowly, then return even slower", cueType: "verbal" },
      { text: "Don't let your shoulder hike up", cueType: "verbal" },
    ],
    regressions: [
      { name: "Active-Assisted External Rotation", description: "Use a cane or dowel to assist the motion with the other hand. Reduces load on the rotator cuff." },
    ],
    progressions: [
      { name: "90/90 External Rotation", description: "Shoulder abducted to 90°, elbow at 90°. Rotate forearm up against resistance. Higher demand position." },
      { name: "Prone External Rotation", description: "Lie face down on edge of table with arm hanging. Rotate forearm up against gravity." },
    ],
  },
  {
    slug: "straight-leg-raise",
    name: "Straight Leg Raise",
    description: "Supine hip flexion with knee extended. Patient lifts leg while keeping the knee straight. Common early quad and hip flexor exercise.",
    confidence: 0.95,
    notes: "EMG: highest rectus femoris activity among CKC/OKC exercises [Thongduang 2022]. OKC generates higher ACL forces than CKC [Escamilla 2012]. Dosing: moderate intensity, 3x/week [Whitfield 2024]. ACL-safe since no knee flexion/extension moment.",
    dosing: "3×10-15 reps per leg; progress with ankle weights",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    evidenceLevel: "strong",
    emgNotes: "Psoas >60% MVIC at end-range; rectus femoris 40-50% MVIC [Okubo 2021]",
    movementSlugs: ["hip-flexion", "knee-extension"],
    muscleRoles: [
      { muscleSlug: "iliopsoas", role: "primary" },
      { muscleSlug: "rectus-femoris", role: "primary" },
      { muscleSlug: "quadriceps", role: "stabilizer", notes: "Keeps knee extended" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Significantly active in mid-to-late concentric phase [Okubo 2021]" },
      { muscleSlug: "tensor-fasciae-latae", role: "synergist", notes: "Active contributor during hip flexion [Hu 2011]" },
    ],
    functionalTaskSlugs: ["walking"],
    cues: [
      { text: "Tighten your thigh muscle to lock out your knee before lifting", cueType: "verbal" },
      { text: "Lift to about 45 degrees, hold briefly, then lower slowly", cueType: "verbal" },
      { text: "Keep your back flat against the surface — don't arch", cueType: "verbal" },
    ],
    regressions: [
      { name: "Short-Arc Quad", description: "Place a roll under the knee and extend only the lower leg. Reduces hip flexor demand." },
    ],
    progressions: [
      { name: "Ankle Weight SLR", description: "Add an ankle weight (1-5 lbs) to increase resistance." },
      { name: "SLR with External Rotation", description: "Rotate the leg outward before lifting to bias different hip flexor contributions." },
    ],
  },
  {
    slug: "terminal-knee-extension",
    name: "Terminal Knee Extension (TKE)",
    description: "Standing with a resistance band behind the knee, straighten the knee fully against the band's resistance, emphasizing the final range of extension. Targets the VMO and full knee lockout."L significantly more active during last 15° of extension [Gryzlo 1994]. Short-arc extension specifically targets vasti. OKC knee extension: highest neuromuscular activation (67-79% MVIC) [Andersen 2006]. For ACL protection: perform in 50-100° range or use short-arc only [Escamilla 2012].",
    dosing: "3×15-20 reps; focus on last 15° of extension",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "standing",
    evidenceLevel: "strong",
    emgNotes: "VM and VL significantly more active during last 15° extension [Gryzlo 1994]",
    movementSlugs: ["knee-extension"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "Especially vastus medialis oblique (VMO)" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing"],
    cues: [
      { text: "Straighten your knee fully against the band — really lock it out", cueType: "verbal" },
      { text: "Slowly let the knee bend to about 30° then extend again", cueType: "verbal" },
      { text: "Keep your kneecap tracking straight ahead", cueType: "verbal" },
    ],
    regressions: [
      { name: "Seated Knee Extension", description: "Seated long-arc quad exercise. Extend the knee from 90° to full extension with or without ankle weight." },
    ],
    progressions: [
      { name: "Single-Leg Mini Squat", description: "Progress to a single-leg mini squat to challenge knee extension in a functional weight-bearing pattern." },
    ],
  },
  // ── Additional Exercises (covering remaining movement gaps) ─────────────
  {
    slug: "overhead-press",
    name: "Overhead Press (Seated)",
    description: "Seated shoulder press with dumbbells or resistance band. Combines shoulder flexion and abduction to lift weight overhead. Foundational upper extremity strengthening exercise.",
    confidence: 0.90,
    dosing: "3×8-12 reps; seated for stability",
    difficulty: "intermediate",
    equipment: ["dumbbells"],
    bodyPosition: "seated",
    evidenceLevel: "moderate",
    emgNotes: "Anterior deltoid 60-90% MVIC; middle deltoid 50-80% MVIC; standing increases activation 8-15% [Saeterbakken 2013]",
    movementSlugs: ["shoulder-flexion", "shoulder-abduction", "elbow-extension"],
    muscleRoles: [
      { muscleSlug: "anterior-deltoid", role: "primary" },
      { muscleSlug: "middle-deltoid", role: "primary" },
      { muscleSlug: "supraspinatus", role: "stabilizer", notes: "GH joint centering during pressing [Cools 2020]" },
      { muscleSlug: "triceps-brachii", role: "secondary" },
      { muscleSlug: "trapezius-upper", role: "stabilizer", notes: "Scapular upward rotation" },
      { muscleSlug: "serratus-anterior", role: "stabilizer", notes: "Scapular stability" },
      { muscleSlug: "infraspinatus", role: "stabilizer", notes: "GH joint stabilizer during overhead press" },
      { muscleSlug: "pectoralis-major", role: "secondary", notes: "30-50% MVIC, higher in front press [Coratella 2022]" },
    ],
    functionalTaskSlugs: ["reaching-overhead", "dressing-upper-body", "overhead-work"],
    cues: [
      { text: "Press straight up — don't let the weights drift forward", cueType: "verbal" },
      { text: "Keep your core braced and back against the chair", cueType: "verbal" },
      { text: "Lower the weights to shoulder height with control", cueType: "verbal" },
    ],
    regressions: [
      { name: "Wall Slide", description: "Stand with back against wall, slide arms up in a Y pattern. No external load — focuses on scapular mechanics." },
      { name: "Band Press", description: "Use a light resistance band instead of weights for reduced load." },
    ],
    progressions: [
      { name: "Standing Overhead Press", description: "Perform standing to increase core stability demand." },
      { name: "Single-Arm Press", description: "Press one arm at a time to increase unilateral demand and anti-rotation challenge." },
    ],
  },
  {
    slug: "shoulder-internal-rotation-exercise",
    name: "Resisted Internal Rotation",
    description: "Side-lying or standing with band/cable. Rotate forearm inward against resistance while keeping elbow at side. Targets subscapularis and internal rotators.",
    confidence: 0.85,
    dosing: "3×10-15 reps; progress through phases over 12-16 weeks",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "standing",
    evidenceLevel: "moderate",
    emgNotes: "Subscapularis 44-81.7% MVIC depending on position; belly press most specific [Ginn 2017]",
    movementSlugs: ["shoulder-internal-rotation"],
    muscleRoles: [
      { muscleSlug: "subscapularis", role: "primary" },
      { muscleSlug: "pectoralis-major", role: "secondary", notes: "Sternal head assists" },
      { muscleSlug: "latissimus-dorsi", role: "secondary" },
      { muscleSlug: "anterior-deltoid", role: "stabilizer", notes: "Minimal IR contribution" },
      { muscleSlug: "teres-major", role: "secondary", notes: "Active contributor to internal rotation" },
    ],
    functionalTaskSlugs: ["dressing-upper-body", "bathing-hygiene"],
    cues: [
      { text: "Keep your elbow pinned to your side throughout", cueType: "verbal" },
      { text: "Rotate inward slowly, then return even slower", cueType: "verbal" },
    ],
    regressions: [
      { name: "Active-Assisted IR", description: "Use a cane or dowel to assist the movement with the other hand." },
    ],
    progressions: [
      { name: "90/90 Internal Rotation", description: "Shoulder abducted to 90°, elbow at 90°. Rotate forearm down against resistance." },
    ],
  },
  {
    slug: "wall-push-up",
    name: "Wall Push-Up",
    description: "Standing push-up against a wall. Combines shoulder flexion/adduction with elbow extension and scapular protraction. Low-load entry point for pushing exercises.",
    confidence: 0.9,
    dosing: "3×10-15 reps; add 'plus' at top for serratus activation",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "moderate",
    emgNotes: "Serratus anterior 27.55% RVC in wall variation; 77.09% in standard push-up plus [Park 2014]",
    movementSlugs: ["shoulder-adduction", "shoulder-flexion", "elbow-extension", "scapular-protraction"],
    muscleRoles: [
      { muscleSlug: "pectoralis-major", role: "primary" },
      { muscleSlug: "anterior-deltoid", role: "secondary" },
      { muscleSlug: "triceps-brachii", role: "secondary" },
      { muscleSlug: "serratus-anterior", role: "stabilizer", notes: "27.55% RVC with plus component — essential at end-range protraction [Park 2014]" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Core stabilizer — minimal activation (10-20% MVIC) in wall variation [Marcolin 2015]" },
    ],
    cues: [
      { text: "Keep your body in a straight line — don't sag at the hips", cueType: "verbal" },
      { text: "Lower your chest toward the wall, then push back", cueType: "verbal" },
      { text: "Push through at the end to round your upper back slightly (plus)", cueType: "verbal" },
    ],
    regressions: [
      { name: "Wall Lean", description: "Just lean into the wall with arms extended. Isometric hold without the push-up motion." },
    ],
    progressions: [
      { name: "Incline Push-Up", description: "Use a counter or bench instead of a wall. Increases the percentage of body weight." },
      { name: "Floor Push-Up", description: "Standard push-up on the floor." },
    ],
  },
  {
    slug: "bicep-curl",
    name: "Bicep Curl",
    description: "Standing or seated elbow flexion with dumbbell or resistance band. The forearm moves from extension to full flexion. Fundamental upper extremity strengthening.",
    confidence: 0.9,
    dosing: "3×10-12 reps; supinated grip for biceps emphasis",
    difficulty: "beginner",
    equipment: ["dumbbells"],
    bodyPosition: "standing",
    evidenceLevel: "limited",
    movementSlugs: ["elbow-flexion", "forearm-supination"],
    muscleRoles: [
      { muscleSlug: "biceps-brachii", role: "primary" },
      { muscleSlug: "brachialis", role: "primary" },
      { muscleSlug: "supinator", role: "synergist", notes: "Maintains supination — not an elbow flexor" },
      { muscleSlug: "brachioradialis", role: "secondary", notes: "Significant contributor — becomes co-primary with neutral grip [Marcolin 2018]" },
    ],
    functionalTaskSlugs: ["gripping-cup"],
    cues: [
      { text: "Keep your elbows at your sides — don't swing", cueType: "verbal" },
      { text: "Turn your palm up as you curl (supinate)", cueType: "verbal" },
      { text: "Lower slowly — the eccentric phase matters", cueType: "verbal" },
    ],
    regressions: [
      { name: "Gravity-Eliminated Curl", description: "Side-lying with arm supported, curl with no gravity resistance." },
    ],
    progressions: [
      { name: "Hammer Curl", description: "Perform with neutral grip (thumbs up). Increases brachioradialis involvement." },
      { name: "Eccentric-Focused Curl", description: "Take 5 seconds to lower the weight. Use the other hand to assist the concentric phase if needed." },
    ],
  },
  {
    slug: "tricep-extension",
    name: "Tricep Extension (Overhead)",
    description: "Overhead elbow extension with dumbbell or band. Fully lengthens the long head of the triceps across both joints. Complements pushing exercises.",
    confidence: 0.90,
    dosing: "5×10 at 70% 1RM, 2x/week; overhead for long head emphasis",
    difficulty: "intermediate",
    equipment: ["dumbbells"],
    bodyPosition: "seated",
    evidenceLevel: "moderate",
    emgNotes: "Overhead produces 1.5x greater long head hypertrophy (+28.5% vs +19.6%) over 12 weeks [Maeo 2023]",
    movementSlugs: ["elbow-extension", "shoulder-extension"],
    muscleRoles: [
      { muscleSlug: "triceps-brachii", role: "primary", notes: "Long head preferentially recruited in overhead position — 28.5% greater hypertrophy vs neutral [Maeo 2023]" },
      { muscleSlug: "anconeus", role: "synergist", notes: "Assists elbow extension" },
    ],
    functionalTaskSlugs: ["pushing-up-from-chair"],
    cues: [
      { text: "Keep your upper arm vertical — only the forearm should move", cueType: "verbal" },
      { text: "Extend fully, then lower with control", cueType: "verbal" },
    ],
    regressions: [
      { name: "Seated Kickback", description: "Lean forward with elbow at side, extend forearm backward. Reduced shoulder demand." },
    ],
    progressions: [
      { name: "Two-Arm Extension", description: "Use a heavier weight with both hands behind the head." },
    ],
  },
  {
    slug: "forearm-pronation-supination",
    name: "Forearm Pronation/Supination with Hammer",
    description: "Seated with elbow on thigh, rotate forearm using a weighted hammer or dowel. The offset weight creates torque for resisted pronation and supination.",
    confidence: 0.85,
    dosing: "3×10-15 reps each direction",
    difficulty: "beginner",
    equipment: ["hammer"],
    bodyPosition: "seated",
    evidenceLevel: "limited",
    movementSlugs: ["forearm-pronation", "forearm-supination"],
    muscleRoles: [
      { muscleSlug: "pronator-teres", role: "primary", notes: "During pronation" },
      { muscleSlug: "supinator", role: "primary", notes: "During supination" },
      { muscleSlug: "biceps-brachii", role: "secondary", notes: "Assists supination" },
    ],
    functionalTaskSlugs: ["opening-jar"],
    cues: [
      { text: "Keep your elbow still — only rotate the forearm", cueType: "verbal" },
      { text: "Move through full range slowly in both directions", cueType: "verbal" },
    ],
    regressions: [
      { name: "Unweighted Rotation", description: "Rotate the forearm without resistance, just focusing on full range." },
    ],
    progressions: [
      { name: "Longer Lever", description: "Hold the hammer further from the head to increase torque." },
    ],
  },
  {
    slug: "wrist-radial-ulnar-deviation",
    name: "Wrist Deviation Exercise (Radial/Ulnar)",
    description: "Seated with forearm on thigh, wrist hanging off edge. Move wrist side to side with light weight. Targets wrist deviators used in gripping and tool use.",
    confidence: 0.80,
    dosing: "3×10-15 reps each direction with light weight",
    difficulty: "beginner",
    equipment: ["dumbbell"],
    bodyPosition: "seated",
    evidenceLevel: "limited",
    movementSlugs: ["radial-deviation", "ulnar-deviation"],
    muscleRoles: [
      { muscleSlug: "flexor-carpi-radialis", role: "primary", notes: "Radial deviation" },
      { muscleSlug: "extensor-carpi-radialis-longus", role: "primary", notes: "Radial deviation" },
      { muscleSlug: "flexor-carpi-ulnaris", role: "primary", notes: "Ulnar deviation" },
      { muscleSlug: "extensor-carpi-ulnaris", role: "primary", notes: "Co-primary for ulnar deviation with FCU" },
    ],
    functionalTaskSlugs: ["opening-jar", "typing"],
    cues: [
      { text: "Move the wrist side to side — thumb side then pinky side", cueType: "verbal" },
      { text: "Keep the forearm still on your thigh", cueType: "verbal" },
    ],
    regressions: [
      { name: "No Weight", description: "Perform without weight, focusing on range of motion." },
    ],
    progressions: [
      { name: "Hammer Deviation", description: "Hold a hammer by the end — the offset weight increases resistance through deviation range." },
    ],
  },
  {
    slug: "grip-strengthening",
    name: "Grip Strengthening (Squeeze Ball)",
    description: "Squeeze a therapy ball or putty, then release. Trains finger flexion and grip strength used in all hand activities of daily living.",
    confidence: 0.85,
    dosing: "3×10 reps with 3-5 second holds, 3x/week",
    difficulty: "beginner",
    equipment: ["therapy-ball"],
    bodyPosition: "seated",
    evidenceLevel: "moderate",
    emgNotes: "Hand exercises reduce short-term pain (VAS -5.0) and improve grip strength (21 lbs) in hand OA [Thakker 2025]",
    movementSlugs: ["finger-flexion", "finger-extension", "dip-flexion", "pip-flexion"],
    muscleRoles: [
      { muscleSlug: "flexor-digitorum-superficialis", role: "primary" },
      { muscleSlug: "flexor-digitorum-profundus", role: "primary", notes: "Deep finger flexor — high activation during grip" },
      { muscleSlug: "extensor-digitorum", role: "stabilizer", notes: "Maintains wrist extension during grip — stabilizer not secondary mover" },
      { muscleSlug: "opponens-pollicis", role: "synergist", notes: "Thumb positioning" },
      { muscleSlug: "lumbricals", role: "synergist", notes: "MCP flexion and finger positioning during grip" },
    ],
    functionalTaskSlugs: ["gripping-cup", "opening-jar", "carrying-lifting", "dressing-upper-body", "bathing-hygiene"],
    cues: [
      { text: "Squeeze firmly and hold for 3-5 seconds", cueType: "verbal" },
      { text: "Spread your fingers fully between squeezes", cueType: "verbal" },
    ],
    regressions: [
      { name: "Softer Ball", description: "Use a softer therapy putty or partially inflated ball to reduce resistance." },
    ],
    progressions: [
      { name: "Grip Trainer", description: "Use an adjustable grip trainer to progressively increase resistance." },
      { name: "Towel Wringing", description: "Wring out a wet towel — combines grip with forearm rotation." },
    ],
  },
  {
    slug: "thumb-opposition-exercise",
    name: "Thumb Opposition Exercise",
    description: "Touch the thumb to each fingertip in sequence, then reverse. Trains opposition coordination used in fine motor tasks.",
    confidence: 0.85,
    dosing: "3×10 reps per finger, 3x/week; part of multimodal hand program",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    evidenceLevel: "moderate",
    movementSlugs: ["thumb-opposition", "thumb-mcp-flexion", "thumb-abduction"],
    muscleRoles: [
      { muscleSlug: "opponens-pollicis", role: "primary" },
      { muscleSlug: "flexor-pollicis-brevis", role: "primary", notes: "Flexion component of opposition" },
      { muscleSlug: "abductor-pollicis-brevis", role: "primary", notes: "Abduction component of opposition" },
    ],
    functionalTaskSlugs: ["gripping-cup", "typing", "dressing-upper-body", "dressing-lower-body"],
    cues: [
      { text: "Touch your thumb firmly to each fingertip, making an O shape", cueType: "verbal" },
      { text: "Go slowly and make each touch precise", cueType: "verbal" },
    ],
    regressions: [
      { name: "Assisted Opposition", description: "Use the other hand to guide the thumb through the pattern." },
    ],
    progressions: [
      { name: "Putty Pinch", description: "Pinch therapy putty between thumb and each finger for resistive opposition." },
    ],
  },
  {
    slug: "hip-adduction-sidelying",
    name: "Sidelying Hip Adduction",
    description: "Lie on side with top leg forward on a support. Lift the bottom leg toward ceiling. Targets adductor group for medial thigh strengthening.",
    confidence: 0.85,
    dosing: "3×15-20 reps per side",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "sidelying",
    evidenceLevel: "limited",
    emgNotes: "14-48% MVIC sidelying; Copenhagen variation achieves 108% MVIC [Serner 2014]",
    movementSlugs: ["hip-adduction"],
    muscleRoles: [
      { muscleSlug: "adductor-group", role: "primary", notes: "14-48% MVIC sidelying; Copenhagen variation achieves 108% [Serner 2014]" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Core activation for sidelying position stability" },
    ],
    functionalTaskSlugs: ["walking", "dressing-lower-body"],
    cues: [
      { text: "Keep your bottom leg straight as you lift", cueType: "verbal" },
      { text: "Lift only until you feel the inner thigh working — don't roll your pelvis", cueType: "verbal" },
    ],
    regressions: [
      { name: "Ball Squeeze", description: "Squeeze a ball between the knees while supine. Isometric adduction with less balance demand." },
    ],
    progressions: [
      { name: "Standing Cable Adduction", description: "Stand and pull a cable inward across the body against resistance." },
    ],
  },
  {
    slug: "seated-hip-internal-rotation",
    name: "Seated Hip Internal Rotation",
    description: "Sit on edge of chair with feet on floor. Rotate the shin outward (foot moves out) to internally rotate the hip. Often limited in hip pathology.",
    confidence: 0.80,
    notes: "Hip internal rotation is commonly limited. Assessment of ROM should precede strengthening.",
    dosing: "3×10-15 reps per side; assess ROM before strengthening",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    evidenceLevel: "limited",
    movementSlugs: ["hip-internal-rotation"],
    muscleRoles: [
      { muscleSlug: "gluteus-medius", role: "primary", notes: "Anterior fibers — context-dependent primary at flexed positions [Martins 2022]" },
      { muscleSlug: "gluteus-minimus", role: "primary", notes: "Primary internal rotator [Ganderton 2017]" },
      { muscleSlug: "tensor-fasciae-latae", role: "secondary", notes: "Active primarily at 90° hip flexion [Martins 2022]" },
    ],
    functionalTaskSlugs: ["walking"],
    cues: [
      { text: "Keep your knee still — only the foot moves outward", cueType: "verbal" },
      { text: "You should feel the side of your hip working", cueType: "verbal" },
    ],
    regressions: [
      { name: "Passive IR Stretch", description: "Gently stretch into internal rotation without active resistance. Focus on ROM first." },
    ],
    progressions: [
      { name: "Band-Resisted IR", description: "Add a resistance band around the ankle for resistive internal rotation." },
    ],
  },
  {
    slug: "ankle-inversion-eversion",
    name: "Resisted Ankle Inversion/Eversion",
    description: "Seated with resistance band around foot. Turn the sole inward (inversion) and outward (eversion) against band resistance. Critical for ankle stability and injury prevention.",
    confidence: 0.85,
    dosing: "3×15 reps each direction, progress band resistance",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "seated",
    evidenceLevel: "moderate",
    movementSlugs: ["foot-inversion", "foot-eversion"],
    muscleRoles: [
      { muscleSlug: "tibialis-anterior", role: "primary", notes: "Inversion" },
      { muscleSlug: "tibialis-posterior", role: "primary", notes: "Inversion" },
      { muscleSlug: "peroneus-longus", role: "primary", notes: "Eversion" },
    ],
    functionalTaskSlugs: ["walking"],
    cues: [
      { text: "Turn your sole inward against the band, then slowly release", cueType: "verbal" },
      { text: "For eversion: turn your sole outward against the band", cueType: "verbal" },
      { text: "Keep your knee still — only the ankle moves", cueType: "verbal" },
    ],
    regressions: [
      { name: "Active ROM", description: "Perform inversion/eversion without resistance to build motor control." },
    ],
    progressions: [
      { name: "Single-Leg Balance", description: "Stand on one foot on an unstable surface. Challenges dynamic inversion/eversion reactively." },
    ],
  },
  // ── Evidence-Based "Top 3" Exercises per Region ─────────────────────────
  // Cervical Spine
  {
    slug: "deep-neck-flexor-training",
    name: "Deep Neck Flexor Training (Chin Tucks with Pressure Biofeedback)",
    description: "Craniocervical flexion exercise targeting the deep cervical flexors (longus colli, longus capitis). Lie supine with a pressure biofeedback unit behind the neck and perform gentle graded chin nods (a small double chin) without lifting the head, lengthening the back of the neck against the surface. Builds deep flexor endurance for neck pain and posture."erficial neck muscles common in sedentary workers. With biofeedback, enhances motor control. Evidence: craniocervical flexion exercises improve pain, posture, and deep flexor muscle cross-sectional area [Amiri Arimi 2017, Sun 2024].",
    dosing: "10 reps × 10-second holds at each pressure level (22-30 mmHg), 2x daily for 6 weeks minimum",
    difficulty: "beginner",
    equipment: ["pressure-biofeedback-unit"],
    bodyPosition: "supine",
    evidenceLevel: "strong",
    emgNotes: "Linear EMG-pressure relationship (22-30 mmHg); longus colli 17.4% CSA increase at C2-C3 [Falla 2003, Cagnie 2010]",
    movementSlugs: ["cervical-flexion-upper"],
    muscleRoles: [
      { muscleSlug: "deep-cervical-flexors", role: "primary", notes: "Longus colli and longus capitis — the target muscles" },
      { muscleSlug: "sternocleidomastoid", role: "stabilizer", notes: "Should be minimally active — overuse indicates compensatory pattern" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "overhead-work"],
    cues: [
      { text: "Gently nod your chin as if making a small double chin — don't lift your head", cueType: "verbal" },
      { text: "Think of lengthening the back of your neck against the surface", cueType: "verbal" },
      { text: "Hold each level for 10 seconds, keeping the pressure steady on the gauge", cueType: "verbal" },
      { text: "If you feel the front of your neck straining, you're pushing too hard", cueType: "verbal" },
    ],
    regressions: [
      { name: "Supine Chin Tuck (No Biofeedback)", description: "Perform the chin tuck motion lying down without a pressure gauge. Focus on the subtle 'nod' without lifting the head." },
      { name: "Seated Chin Tuck", description: "Perform seated against a wall for tactile feedback. Less precise than biofeedback but more accessible." },
    ],
    progressions: [
      { name: "Graded Pressure Holds", description: "Progress through 22, 24, 26, 28, 30 mmHg targets with 10-second holds at each level, 10 repetitions." },
      { name: "Chin Tuck with Head Lift", description: "After achieving 30 mmHg, maintain the tuck while lifting the head slightly off the surface. Combines deep flexor activation with anti-gravity endurance." },
    ],
  },
  {
    slug: "scapular-stability-rows",
    name: "Scapular Stability Exercises (Rows / Scapular Retraction)",
    description: "Seated or standing rows with a resistance band, retracting and depressing the shoulder blades to strengthen the middle and lower trapezius. Coordinates shoulder-neck movement and counteracts rounded-shoulder posture."hening improves pain and function in chronic neck pain [Gross 2015, Mueller 2023]. Coordinates shoulder-neck movement patterns and counteracts prolonged-sitting postures [Cho 2017].",
    dosing: "3×10-15 reps, 2-3x/week",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "seated",
    evidenceLevel: "moderate",
    movementSlugs: ["scapular-retraction", "shoulder-extension"],
    muscleRoles: [
      { muscleSlug: "trapezius-middle", role: "primary" },
      { muscleSlug: "trapezius-lower", role: "primary" },
      { muscleSlug: "rhomboid-major", role: "secondary" },
      { muscleSlug: "posterior-deltoid", role: "secondary" },
      { muscleSlug: "latissimus-dorsi", role: "synergist" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "reaching-overhead", "overhead-work"],
    cues: [
      { text: "Squeeze your shoulder blades together and slightly down — don't shrug", cueType: "verbal" },
      { text: "Lead with the elbows, pulling them straight back", cueType: "verbal" },
      { text: "Hold the retracted position for 2-3 seconds before releasing", cueType: "verbal" },
    ],
    regressions: [
      { name: "Isometric Scapular Retraction", description: "Squeeze shoulder blades together without resistance. Hold 5-10 seconds." },
      { name: "Wall Angel", description: "Stand with back against wall, slide arms up and down while maintaining scapular retraction contact with wall." },
    ],
    progressions: [
      { name: "Prone Y/T/W Raises", description: "Lying face down, perform arm raises in Y, T, and W positions to progressively challenge scapular stabilizers." },
      { name: "Cable/Band Row (Standing)", description: "Increase resistance with heavier band or cable. Single-arm variation adds rotational stability demand." },
    ],
  },
  {
    slug: "cervicothoracic-self-mobilization",
    name: "Cervicothoracic Self-Mobilization",
    description: "Combined cervical and thoracic mobility work using a foam roller or towel roll: lying supine, perform thoracic extension over the roll positioned at the cervicothoracic junction while adding active cervical range of motion, working segment by segment up the spine."d cervical and thoracic mobility exercises show superior outcomes vs cervical exercises alone [Sun 2024, Cho 2017]. Addresses the kinetic chain relationship between thoracic stiffness and neck dysfunction.",
    dosing: "5-10 reps per segment, daily",
    difficulty: "intermediate",
    equipment: ["foam-roller"],
    bodyPosition: "supine",
    evidenceLevel: "moderate",
    movementSlugs: ["thoracic-extension", "cervical-extension", "cervical-rotation"],
    muscleRoles: [
      { muscleSlug: "erector-spinae", role: "primary", notes: "Thoracic portion — facilitates extension mobility" },
      { muscleSlug: "deep-cervical-flexors", role: "stabilizer", notes: "Maintains cervical neutral during thoracic mobilization" },
      { muscleSlug: "trapezius-middle", role: "secondary", notes: "Facilitates scapular retraction component" },
    ],
    functionalTaskSlugs: ["posture-maintenance"],
    cues: [
      { text: "Place the foam roller at the level of your shoulder blades", cueType: "verbal" },
      { text: "Cross your arms over your chest or support your head with your hands", cueType: "verbal" },
      { text: "Gently extend over the roller — breathe out as you go back", cueType: "verbal" },
      { text: "Move the roller one segment up and repeat — work from mid-back to upper back", cueType: "verbal" },
    ],
    regressions: [
      { name: "Towel Roll Extension", description: "Use a rolled towel instead of foam roller for less aggressive mobilization. Position between shoulder blades while supine." },
      { name: "Seated Thoracic Extension", description: "Sit in a chair, interlock hands behind head, and gently extend over the chair back." },
    ],
    progressions: [
      { name: "Foam Roller with Arm Overhead", description: "Extend over roller while reaching arms overhead to add shoulder flexion demand and increase thoracic extension range." },
      { name: "Thread the Needle", description: "Quadruped thoracic rotation — reach one arm under and through, then open up to the ceiling. Adds rotational component." },
    ],
  },
  // Thoracic Spine
  {
    slug: "thoracic-extension-rotation-mobilization",
    name: "Thoracic Extension/Rotation Mobilization",
    description: "Active mobility drills for thoracic extension and rotation, including sidelying open-book rotations, quadruped thoracic rotation, and seated rotation with overpressure."ization significantly improves kyphosis angle, cervical extension, and pain [Cho 2017, Feng 2018]. More effective than cervical-only interventions for forward head posture [Cho 2017].",
    dosing: "3×10 reps each direction, daily",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "sidelying",
    evidenceLevel: "moderate",
    movementSlugs: ["thoracic-extension", "thoracic-rotation"],
    muscleRoles: [
      { muscleSlug: "erector-spinae", role: "primary", notes: "Thoracic portion drives extension" },
      { muscleSlug: "multifidus", role: "primary", notes: "Segmental rotation control" },
      { muscleSlug: "internal-oblique", role: "secondary", notes: "Ipsilateral rotation" },
      { muscleSlug: "external-oblique", role: "secondary", notes: "Contralateral rotation" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "breathing"],
    cues: [
      { text: "For open book: lie on your side with knees stacked, rotate your top arm open like turning a page", cueType: "verbal" },
      { text: "Follow your hand with your eyes — let the rotation come from your mid-back", cueType: "verbal" },
      { text: "Breathe out as you rotate — the exhale helps release tension", cueType: "verbal" },
    ],
    regressions: [
      { name: "Supine Trunk Rotation", description: "Lie on back with knees bent, gently drop knees side to side. Gravity-assisted with less demand." },
      { name: "Cat-Cow with Rotation", description: "In quadruped, combine cat-cow with gentle rotation by reaching one arm to the ceiling." },
    ],
    progressions: [
      { name: "Seated Rotation with Overpressure", description: "Sit straddling a bench, arms crossed. Rotate and use opposite hand on knee for gentle overpressure at end range." },
      { name: "Half-Kneeling Thoracic Rotation", description: "Half-kneeling with hands behind head. Rotate toward the front knee. Challenges hip-thoracic dissociation." },
    ],
  },
  {
    slug: "schroth-three-dimensional-exercises",
    name: "Schroth-Based Three-Dimensional Exercises",
    description: "Three-dimensional corrective exercises for postural kyphosis that combine spinal elongation, trunk deflection toward midline, derotation, and breathing directed into the collapsed (concave) side of the ribcage, holding the corrected posture while breathing."zes for kyphosis reduction (14.76°), lumbar lordosis improvement, balance, and QOL [Özdemir Görgü 2023]. Requires trained instruction initially.",
    dosing: "2x/week for 8 weeks under supervision; ≤3 months program",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "moderate",
    emgNotes: "Kyphosis reduction -14.76° (large effect size) [Özdemir 2023]",
    movementSlugs: ["thoracic-extension", "thoracic-lateral-flexion", "thoracic-rotation"],
    muscleRoles: [
      { muscleSlug: "erector-spinae", role: "primary", notes: "Elongation and extension component" },
      { muscleSlug: "multifidus", role: "primary", notes: "Segmental correction" },
      { muscleSlug: "trapezius-lower", role: "secondary", notes: "Scapular depression and postural alignment" },
      { muscleSlug: "diaphragm", role: "synergist", notes: "Rotational breathing component" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "breathing"],
    cues: [
      { text: "Lengthen your spine upward as if a string is pulling the crown of your head to the ceiling", cueType: "verbal" },
      { text: "Breathe into the concavity — direct your breath into the collapsed side of your ribcage", cueType: "verbal" },
      { text: "Maintain the corrected position while breathing normally for 30 seconds", cueType: "verbal" },
    ],
    regressions: [
      { name: "Wall-Supported Elongation", description: "Stand with back against wall. Focus on elongation only — press head, mid-back, and sacrum into wall." },
      { name: "Supine Corrective Positioning", description: "Lie supine with towel rolls placed to support corrected spinal curves. Practice breathing in corrected position." },
    ],
    progressions: [
      { name: "Schroth with Resistance", description: "Perform corrective postures while holding light resistance. Increases muscular endurance demand." },
      { name: "Functional Integration", description: "Maintain Schroth corrections during daily activities — sitting, standing, walking. Transfers postural gains to real-world use." },
    ],
  },
  {
    slug: "diaphragmatic-breathing",
    name: "Diaphragmatic / Rib Expansion Breathing Exercises",
    description: "Breathing exercise targeting diaphragmatic excursion and rib cage expansion. Practice belly breathing, one hand on the chest, one on the belly, with the belly hand rising first, expanding the ribcage laterally on a slow nasal inhale and letting the belly fall on a pursed-lip exhale; progress from supine to seated to standing. A band around the lower ribs can add resistance for rib expansion."nificantly improve chest expansion, spinal mobility (especially lateral flexion), and posture [Csepregi 2022, Eftekhari 2024]. Equally effective as yoga/Pilates for spinal mobility [Csepregi 2022].",
    dosing: "10 breaths × 3 sets, 2-3x daily; 4-count inhale, 6-8 count exhale",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    evidenceLevel: "moderate",
    emgNotes: "Improves chest expansion, spinal mobility, and posture comparably to yoga/Pilates [Csepregi 2022]",
    movementSlugs: ["thoracic-extension", "thoracic-lateral-flexion"],
    muscleRoles: [
      { muscleSlug: "diaphragm", role: "primary", notes: "Primary inspiratory muscle — target of exercise" },
      { muscleSlug: "transversus-abdominis", role: "synergist", notes: "Expiratory control and intra-abdominal pressure" },
      { muscleSlug: "internal-oblique", role: "synergist", notes: "Assists forced expiration" },
      { muscleSlug: "erector-spinae", role: "stabilizer", notes: "Postural maintenance during breathing" },
      { muscleSlug: "external-oblique", role: "synergist", notes: "Contributes during forced expiration phases" },
    ],
    functionalTaskSlugs: ["breathing", "posture-maintenance"],
    cues: [
      { text: "Place one hand on your chest and one on your belly — the belly hand should rise first", cueType: "verbal" },
      { text: "Breathe in through your nose for 4 counts, expanding your ribcage laterally", cueType: "verbal" },
      { text: "Breathe out slowly through pursed lips for 6-8 counts — feel your belly fall", cueType: "verbal" },
      { text: "For rib expansion: wrap a band around your lower ribs and breathe against the resistance", cueType: "verbal" },
    ],
    regressions: [
      { name: "Supine Belly Breathing", description: "Lie on back with knees bent. Place a light book on the belly as visual feedback for diaphragmatic motion." },
      { name: "Crocodile Breathing", description: "Lie prone with forehead on hands. Breathe into the belly against the floor — the floor provides tactile feedback for diaphragm descent." },
    ],
    progressions: [
      { name: "Lateral Rib Expansion with Band", description: "Wrap a resistance band around the lower ribcage. Breathe to expand the ribs against the band resistance." },
      { name: "90/90 Breathing", description: "Lie supine with feet on wall, hips and knees at 90°. Breathe to restore zone of apposition and inhibit accessory muscle overuse." },
    ],
  },
  // Lumbar Spine and Core
  {
    slug: "core-stabilization-adim",
    name: "Core Stabilization with Abdominal Drawing-In Maneuver (ADIM)",
    description: "Core stabilization exercise targeting the deep trunk muscles (transversus abdominis, multifidus). Lying down, gently draw the navel toward the spine without moving the pelvis, then maintain that low-level contraction while adding limb movements. Used for lumbar instability and chronic low back pain." translation at L4-L5 and L5-S1 at 10 weeks [Puntumetakul 2021]. Greater improvement in abdominal muscle activity ratio at 10 weeks and 12 months [Puntumetakul 2021]. Superior improvements in proprioception, balance, and muscle thickness of TrA and LM vs general strengthening [Hlaing 2021]. Dosing: 30 min, 3x/week, 4 weeks minimum; initially 8-10 reps every 2 hours [Hegmann 2020]. Note: abdominal bracing generates IAP 116.4 mmHg vs hollowing 9.9 mmHg [Tayashiki 2016] — both approaches have clinical utility.",
    dosing: "8-10 reps every 2 hours initially; 30 min 3x/week, 4 weeks minimum",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    evidenceLevel: "strong",
    emgNotes: "Reduces sagittal translation at L4-L5/L5-S1 at 10 weeks [Puntumetakul 2021]. Bracing IAP 116.4 mmHg vs hollowing 9.9 mmHg [Tayashiki 2016]",
    movementSlugs: ["lumbar-extension", "lumbar-flexion"],
    muscleRoles: [
      { muscleSlug: "transversus-abdominis", role: "primary", notes: "Primary target — drawing-in activates TrA preferentially" },
      { muscleSlug: "multifidus", role: "primary", notes: "Co-activates with TrA for segmental stabilization" },
      { muscleSlug: "internal-oblique", role: "synergist", notes: "Deepest oblique fibers co-activate with TrA" },
      { muscleSlug: "diaphragm", role: "stabilizer", notes: "Forms the top of the 'pressure canister' for intra-abdominal pressure" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "walking", "carrying-lifting", "bed-mobility"],
    cues: [
      { text: "Gently draw your belly button toward your spine — like zipping up a tight pair of pants", cueType: "verbal" },
      { text: "Maintain normal breathing while holding the contraction — don't hold your breath", cueType: "verbal" },
      { text: "You should feel a gentle tightening deep in your lower abdomen, not a strong bracing", cueType: "verbal" },
      { text: "Keep your pelvis completely still — no rocking or tilting", cueType: "verbal" },
    ],
    regressions: [
      { name: "Supine ADIM Only", description: "Lie on back with knees bent. Practice the drawing-in maneuver alone without any limb movement. Hold 10 seconds." },
      { name: "ADIM with Biofeedback", description: "Place a pressure biofeedback unit under the lumbar spine. Maintain target pressure while performing the drawing-in." },
    ],
    progressions: [
      { name: "ADIM + Heel Slides", description: "Maintain ADIM while slowly sliding one heel along the surface to extend the leg. Challenges core stability with limb loading." },
      { name: "ADIM + Leg Lifts", description: "Maintain ADIM while lifting one leg to 90° hip flexion. Progress to alternating legs (dead bug foundation)." },
      { name: "ADIM in Quadruped", description: "Perform ADIM in hands-and-knees position against gravity. Foundation for bird dog progression." },
    ],
  },
  {
    slug: "bird-dog",
    name: "Bird Dog Exercise",
    description: "Quadruped exercise: from hands and knees, simultaneously extend the opposite arm and leg while maintaining a neutral spine. Trains the lumbar erector spinae and multifidus and promotes anti-rotation core stability, progressing from basic to more advanced variations."MG: lumbar erector spinae 29% nEMG (27-46%) [Calatayud 2019]. Produces higher amplitudes across all muscle groups compared to hip abduction exercises (14±3% to 53±4%) [Mueller 2018]. 5 intensity levels available; muscle activity increases significantly with each level (p<0.05) [Kim 2016]. Well-tolerated in chronic LBP patients [Calatayud 2019].",
    dosing: "3×8-10 reps per side with 5-10 second holds",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "quadruped",
    evidenceLevel: "strong",
    emgNotes: "Glute max ~40-56% MVIC; erector spinae 29% nEMG; lowest L/G ratio (1.21) indicating good local muscle targeting [Ekstrom 2007, Khosrokiani 2021]",
    movementSlugs: ["lumbar-extension", "hip-extension", "shoulder-flexion"],
    muscleRoles: [
      { muscleSlug: "erector-spinae", role: "primary", notes: "29% nEMG — lumbar stabilization during limb extension" },
      { muscleSlug: "multifidus", role: "stabilizer", notes: "Segmental stabilizer rather than primary extensor — L/G ratio 1.21 [Khosrokiani 2021]" },
      { muscleSlug: "gluteus-maximus", role: "secondary", notes: "Extends the hip during leg reach" },
      { muscleSlug: "anterior-deltoid", role: "secondary", notes: "Extends arm overhead" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Core bracing prevents lumbar extension collapse" },
      { muscleSlug: "external-oblique", role: "stabilizer", notes: "Contralateral anti-rotation demand" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "walking", "carrying-lifting"],
    cues: [
      { text: "Start on hands and knees — wrists under shoulders, knees under hips", cueType: "verbal" },
      { text: "Reach your opposite arm and leg long, like you're being pulled from both ends", cueType: "verbal" },
      { text: "Keep your hips level — imagine balancing a glass of water on your low back", cueType: "verbal" },
      { text: "Move slowly and hold for 5-10 seconds before switching sides", cueType: "verbal" },
    ],
    regressions: [
      { name: "Arm Only", description: "In quadruped, extend one arm at a time without leg movement. Builds upper extremity and core control." },
      { name: "Leg Only", description: "In quadruped, extend one leg at a time without arm movement. Focuses on anti-extension core control." },
    ],
    progressions: [
      { name: "Bird Dog with Elbow-to-Knee", description: "After extending, bring the elbow and knee together under the trunk before re-extending. Adds flexion control." },
      { name: "Bird Dog with Band", description: "Loop a resistance band around the extending foot and opposite hand. Increases demand on both the extending and stabilizing muscles." },
      { name: "Bird Dog on BOSU", description: "Perform with hands on a BOSU ball. Adds balance/proprioceptive demand." },
    ],
  },
  {
    slug: "modified-curl-up-dead-bug",
    name: "Modified Curl-Up / Dead Bug",
    description: "Two complementary anterior-core exercises. Modified curl-up: lie supine with one knee bent and hands under the lumbar spine, then lift the head and shoulders minimally. Dead bug: lie supine with arms reaching toward the ceiling and hips/knees bent, then lower the opposite arm and leg while keeping the low back pressed to the floor."rl-up: rectus abdominis 50% nEMG (28-65%) [Calatayud 2019]. Dead bug: peak RA and EO amplitudes increase significantly with intensity (p=0.008 and p<0.001) [Kim 2016]. 5 graded intensity levels available [Kim 2016]. Plank with brace: EO 77% nEMG [Calatayud 2019]. Plank with hollowing significantly increases all oblique activation (IO: ES=2.0-2.3, EO: ES=1.0-1.4, lumbar ES: ES=0.6) [García-Jaén 2020]. Well-tolerated in chronic LBP; lateral plank mostly non-tolerated [Calatayud 2019].",
    dosing: "3×8-12 reps; 5 graded intensity levels available",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    evidenceLevel: "strong",
    emgNotes: "Rectus abdominis 48-50% nEMG during curl-up [Calatayud 2019]. Dead bug: peak RA and EO increase significantly with intensity [Kim 2016]",
    movementSlugs: ["lumbar-flexion", "thoracic-flexion"],
    muscleRoles: [
      { muscleSlug: "rectus-abdominis", role: "primary", notes: "48-50% nEMG during curl-up" },
      { muscleSlug: "external-oblique", role: "primary", notes: "Significant activation, especially in dead bug" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Maintains lumbar stability" },
      { muscleSlug: "internal-oblique", role: "synergist" },
      { muscleSlug: "iliopsoas", role: "stabilizer", notes: "Hip flexion control in dead bug — moderate demand beyond pure stabilization [Juker 1998]" },
      { muscleSlug: "multifidus", role: "stabilizer", notes: "Segmental spinal stability during dead bug" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "bed-mobility"],
    cues: [
      { text: "Curl-up: slide your hands under your low back, curl up just enough to lift your shoulder blades", cueType: "verbal" },
      { text: "Dead bug: start with arms pointing to ceiling, legs at 90/90. Lower opposite arm and leg slowly", cueType: "verbal" },
      { text: "Keep your low back pressed into the floor the entire time — that's the key", cueType: "verbal" },
      { text: "Breathe out as you extend the limbs, breathe in as you return", cueType: "verbal" },
    ],
    regressions: [
      { name: "Dead Bug — Heel Taps Only", description: "Keep arms stationary pointing to ceiling. Only lower one heel at a time to tap the floor. Reduces demand." },
      { name: "Mini Curl-Up", description: "Curl up just enough to feel the abs engage — don't lift the shoulder blades fully. Reduce range to control difficulty." },
    ],
    progressions: [
      { name: "Dead Bug with Band", description: "Hold a resistance band overhead, anchored to a post. Adds anti-extension demand as arms extend." },
      { name: "Pallof Press Dead Bug", description: "Combine dead bug with a Pallof press — anti-rotation plus anti-extension. Advanced core challenge." },
    ],
  },
  // Shoulder Girdle
  {
    slug: "prone-horizontal-abduction-er",
    name: "Prone Horizontal Abduction with External Rotation (Prone Y/T)",
    description: "Lying face down, lift the arms into a Y or T position with thumbs pointing up (external rotation), squeezing the shoulder blades down and together. Targets the middle and lower trapezius for scapular control while minimizing upper trapezius involvement." MVIC, middle deltoid 87% MVIC, posterior deltoid 88% MVIC, MT >50% MVIC, LT >50% MVIC [Reinold 2004, Mendez-Rebolledo 2024]. Optimal UT/MT (0.43) and UT/LT (0.30) ratios. Early scapular stabilizer activation (-474.7 to 89.9 ms relative to UT) [Mendez-Rebolledo 2024]. Dosing: 3×8-15 reps, 3 days/week [Mulroy 2020].",
    dosing: "3×8-15 reps, 3 days/week",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "prone",
    evidenceLevel: "strong",
    emgNotes: "MT and LT >50% MVIC; optimal UT/MT ratio 0.43, UT/LT ratio 0.30 [Mendez-Rebolledo 2024]",
    movementSlugs: ["scapular-retraction", "shoulder-external-rotation", "scapular-upward-rotation", "shoulder-horizontal-abduction"],
    muscleRoles: [
      { muscleSlug: "trapezius-middle", role: "primary", notes: ">50% MVIC activation" },
      { muscleSlug: "trapezius-lower", role: "primary", notes: ">50% MVIC activation" },
      { muscleSlug: "infraspinatus", role: "secondary", notes: "External rotation component" },
      { muscleSlug: "posterior-deltoid", role: "secondary", notes: "Horizontal abduction" },
      { muscleSlug: "rhomboid-major", role: "synergist" },
    ],
    functionalTaskSlugs: ["reaching-overhead", "posture-maintenance", "overhead-work"],
    cues: [
      { text: "Lie face down with arms hanging off the edge or at your sides", cueType: "verbal" },
      { text: "For Y: lift arms overhead at 45° with thumbs up. For T: lift arms straight out to the side with thumbs up", cueType: "verbal" },
      { text: "Squeeze your shoulder blades together as you lift — think 'down and in'", cueType: "verbal" },
      { text: "Hold at the top for 3-5 seconds, lower with control", cueType: "verbal" },
    ],
    regressions: [
      { name: "Prone I Raise", description: "Lift arms straight overhead (I position). Simpler movement pattern before progressing to Y and T." },
      { name: "Standing Band Y/T", description: "Perform the Y/T pattern standing with a light resistance band. Gravity-reduced position." },
    ],
    progressions: [
      { name: "Prone Y/T with Light Weight", description: "Add 1-3 lb dumbbells to increase resistance in the elevated position." },
      { name: "Prone W Raise", description: "Add the W position (elbows bent, squeeze shoulder blades) to create a Y/T/W circuit targeting all scapular stabilizers." },
    ],
  },
  {
    slug: "push-up-plus",
    name: "Push-Up Plus",
    description: "A standard push-up with an added scapular protraction at the top (the 'plus'), push the floor away to spread the shoulder blades. Emphasizes the serratus anterior for scapular stabilization, addressing scapular winging and promoting the upward rotation needed for overhead activities."s: "EMG: high serratus anterior activation, favorable LT/UT ratio [Andersen 2012, Kibler 2008]. Addresses scapular winging and promotes upward rotation [Kibler 2008]. Dosing: 3×8 at 8-RM, 3 days/week [Mulroy 2020]. Closed-chain exercises like planks appropriate after 12+ weeks post-surgery [Kennedy 2020].",
    dosing: "3×8 at 8-RM, 3 days/week",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "prone",
    evidenceLevel: "strong",
    emgNotes: "High serratus anterior activation with favorable LT/UT ratio [Andersen 2012, Kibler 2008]",
    movementSlugs: ["scapular-protraction", "elbow-extension", "shoulder-flexion", "scapular-upward-rotation"],
    muscleRoles: [
      { muscleSlug: "serratus-anterior", role: "primary", notes: "High amplitude activation — the 'plus' targets SA specifically" },
      { muscleSlug: "trapezius-lower", role: "primary", notes: "Activated over upper trapezius" },
      { muscleSlug: "pectoralis-major", role: "secondary", notes: "Push-up component" },
      { muscleSlug: "triceps-brachii", role: "secondary", notes: "Elbow extension in push-up" },
      { muscleSlug: "anterior-deltoid", role: "synergist" },
    ],
    functionalTaskSlugs: ["reaching-overhead", "pushing-up-from-chair", "overhead-work"],
    cues: [
      { text: "Do a normal push-up, then at the top push further — round your upper back to protract your shoulder blades", cueType: "verbal" },
      { text: "The 'plus' is the most important part — push the floor away from you at the top", cueType: "verbal" },
      { text: "Keep your core tight throughout — don't sag at the hips", cueType: "verbal" },
    ],
    regressions: [
      { name: "Wall Push-Up Plus", description: "Perform against a wall. At the end of the push, push further to protract the scapulae. Much lower load." },
      { name: "Kneeling Push-Up Plus", description: "Perform on knees to reduce body weight percentage. Focus on the plus motion at the top." },
    ],
    progressions: [
      { name: "Push-Up Plus on Unstable Surface", description: "Perform with hands on a BOSU or stability ball. Increases serratus anterior and stabilizer demand." },
      { name: "Single-Arm Push-Up Plus", description: "Elevated surface, single-arm push-up with plus. Advanced scapular stability challenge." },
    ],
  },
  {
    slug: "external-rotation-0-abduction",
    name: "External Rotation at 0° Abduction (Side-Lying or Band)",
    description: "Rotator cuff strengthening for the infraspinatus: with the elbow pinned to the side, rotate the forearm outward against a resistance band (or lift it upward in side-lying), then control the return, keeping the shoulder from hiking or the trunk from twisting."s minor 67% MVIC, supraspinatus 24-37% MVIC [Reinold 2004]. Dosing: 3×8 at 8-RM, 3 days/week [Mulroy 2020]. Motor control exercises superior to nonspecific (SMD: -0.29 short, -0.33 medium term) [Lafrance 2024]. Perform in scapular plane to minimize superior humeral head migration [Mulroy 2020]. Control eccentric phase 2 seconds [Rodrigues da Silva Barros 2023].",
    dosing: "3×8 at 8-RM, 3 days/week; 2-second eccentric",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "sidelying",
    evidenceLevel: "strong",
    emgNotes: "Infraspinatus 62% MVIC, teres minor 67% MVIC, supraspinatus 24-37% [Reinold 2004]",
    movementSlugs: ["shoulder-external-rotation"],
    muscleRoles: [
      { muscleSlug: "infraspinatus", role: "primary", notes: "Primary external rotator at 0° abduction" },
      { muscleSlug: "teres-minor", role: "primary" },
      { muscleSlug: "posterior-deltoid", role: "synergist", notes: "Minimal contribution at 0° abduction" },
      { muscleSlug: "supraspinatus", role: "stabilizer", notes: "Humeral head depressor role" },
    ],
    functionalTaskSlugs: ["reaching-overhead", "overhead-work"],
    cues: [
      { text: "Keep your elbow pinned to your side — a rolled towel between elbow and body helps", cueType: "verbal" },
      { text: "Rotate your forearm outward slowly against the band, then return even slower", cueType: "verbal" },
      { text: "Don't let your shoulder hike up or your body twist", cueType: "verbal" },
      { text: "Side-lying: start with the forearm resting on your belly and rotate upward toward the ceiling", cueType: "verbal" },
    ],
    regressions: [
      { name: "Active-Assisted ER with Cane", description: "Use a cane or dowel to assist the motion with the other hand. Reduces load on the rotator cuff." },
      { name: "Side-Lying ER (Gravity Only)", description: "Perform side-lying without additional resistance. Gravity provides the load." },
    ],
    progressions: [
      { name: "Band ER at 0° (Heavier Band)", description: "Progress resistance band color/thickness as strength improves. Maintain slow eccentric control." },
      { name: "90/90 External Rotation", description: "Shoulder abducted to 90°, elbow at 90°. Rotate forearm up against resistance. Higher demand, sport-specific position." },
    ],
  },
  // Hip and Pelvis
  {
    slug: "hip-abduction-strengthening",
    name: "Hip Strengthening (Clamshells / Side-Lying Hip Abduction)",
    description: "Hip abductor and extensor strengthening targeting gluteus medius and maximus. Includes clamshells and side-lying hip abduction. Addresses muscle weakness common in hip OA and improves functional stability for gait and single-leg activities.",
    confidence: 0.85,
    notes: "Evidence: hip abductor and extensor strengthening addresses weakness common in hip OA, improves functional stability [VA 2020, Cibulka 2017]. Targets glut med/max essential for gait and single-leg activities.",
    dosing: "3×15-20 reps per side, 2-3x/week",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "sidelying",
    evidenceLevel: "strong",
    movementSlugs: ["hip-abduction", "hip-external-rotation"],
    muscleRoles: [
      { muscleSlug: "gluteus-medius", role: "primary", notes: "Primary hip abductor and pelvic stabilizer" },
      { muscleSlug: "gluteus-maximus", role: "secondary", notes: "Upper fibers assist abduction; key hip extensor" },
      { muscleSlug: "piriformis", role: "synergist", notes: "Assists external rotation in clamshell" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing", "single-leg-balance", "floor-transfers", "running-jogging"],
    cues: [
      { text: "For clamshells: keep feet together, open knees like a book. Don't let your pelvis roll back", cueType: "verbal" },
      { text: "For side-lying abduction: keep your body in a straight line, lift the top leg toward the ceiling", cueType: "verbal" },
      { text: "Lead with the heel, not the toe — avoid rotating the hip forward", cueType: "verbal" },
    ],
    regressions: [
      { name: "Supine Hip Abduction", description: "Lie on back with legs straight. Slide one leg out to the side along the floor. Gravity-eliminated position." },
    ],
    progressions: [
      { name: "Banded Clamshell", description: "Add a resistance band just above the knees. Increases gluteus medius demand." },
      { name: "Standing Hip Abduction with Band", description: "Standing on one leg, abduct the other against a band. Challenges both the moving and stance leg." },
      { name: "Side Plank with Hip Abduction", description: "Hold side plank and lift the top leg. Combines core stability with hip abduction." },
    ],
  },
  {
    slug: "hip-flexor-hamstring-stretch",
    name: "Hip Flexor and Hamstring Stretching",
    description: "Flexibility exercises addressing hip ROM impairments. Half-kneeling hip flexor stretch (iliopsoas, rectus femoris) and supine hamstring stretch. Improves function in hip OA and addresses limited hip mobility that affects lumbar spine mechanics.",
    confidence: 0.85,
    notes: "Evidence: flexibility exercises improve function in hip OA [Cibulka 2017]. Limited hip mobility affects lumbar spine mechanics and functional movement [Moreside 2012].",
    dosing: "3×30-60 seconds per side, daily; 10-30 seconds general, 30-60 for older adults",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "half-kneeling",
    evidenceLevel: "moderate",
    emgNotes: "Single session hip flexor stretch: 1.2° APT reduction but no lumbar lordosis change [Preece 2021]. Dynamic stretching ES 3.01-3.06 for hip ROM [Iranmanesh 2025]",
    movementSlugs: ["hip-extension", "hip-flexion", "knee-flexion"],
    muscleRoles: [
      { muscleSlug: "iliopsoas", role: "primary", notes: "Stretched during hip flexor stretch" },
      { muscleSlug: "rectus-femoris", role: "primary", notes: "Stretched during hip flexor stretch (two-joint)" },
      { muscleSlug: "hamstrings", role: "primary", notes: "Stretched during hamstring stretch" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing", "dressing-lower-body"],
    cues: [
      { text: "Hip flexor: half-kneeling, tuck your tailbone under (posterior pelvic tilt) before leaning forward", cueType: "verbal" },
      { text: "You should feel the stretch in the front of the hip on the kneeling side", cueType: "verbal" },
      { text: "Hamstring: lie on back, loop a strap around the foot, straighten the leg toward the ceiling", cueType: "verbal" },
      { text: "Hold each stretch for 30-60 seconds, breathe normally", cueType: "verbal" },
    ],
    regressions: [
      { name: "Supine Hip Flexor Stretch", description: "Lie on back at edge of bed/table. Pull one knee to chest, let the other leg hang off the edge for gravity-assisted stretch." },
      { name: "Seated Hamstring Stretch", description: "Sit on a chair with one leg extended on a stool. Lean forward from the hips." },
    ],
    progressions: [
      { name: "Half-Kneeling with Rear Foot Elevated", description: "Elevate the rear foot on a bench behind you during the hip flexor stretch. Dramatically increases stretch on rectus femoris." },
      { name: "Active Hamstring Stretch", description: "Contract-relax technique: isometrically push leg into strap for 5 seconds, then stretch further on the relax. PNF approach." },
    ],
  },
  {
    slug: "pelvic-tilt-realignment",
    name: "Pelvic Realignment Exercises (Pelvic Tilts)",
    description: "Lying supine with knees bent, alternate between anterior and posterior pelvic tilts, then practice finding and holding a neutral spine. Builds lumbopelvic awareness and motor control."cluding pelvic tilts significantly improve pain and function even in severe hip OA [Hayashi 2022]. Enhance lumbopelvic awareness and reduce guarding in LBP.",
    dosing: "3×10-15 reps each direction; find neutral and hold 10 seconds",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    evidenceLevel: "moderate",
    movementSlugs: ["lumbar-flexion", "lumbar-extension"],
    muscleRoles: [
      { muscleSlug: "rectus-abdominis", role: "primary", notes: "Posterior pelvic tilt" },
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "Assists posterior tilt" },
      { muscleSlug: "erector-spinae", role: "secondary", notes: "Primary during anterior tilt only" },
      { muscleSlug: "iliopsoas", role: "secondary", notes: "Assists anterior tilt" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Core control during both directions" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "walking", "bed-mobility"],
    cues: [
      { text: "Lie on back with knees bent. Flatten your low back into the floor — that's a posterior tilt", cueType: "verbal" },
      { text: "Now arch your low back away from the floor — that's an anterior tilt", cueType: "verbal" },
      { text: "Rock gently between the two, then find the middle — that's your neutral", cueType: "verbal" },
      { text: "Practice finding neutral quickly — this is the foundation of all spinal exercise", cueType: "verbal" },
    ],
    regressions: [
      { name: "Seated Pelvic Tilts", description: "Perform on a firm chair or stability ball. Rock the pelvis forward and back. More functional position for some patients." },
    ],
    progressions: [
      { name: "Pelvic Clock", description: "Imagine a clock face under your pelvis. Tilt to 12, 3, 6, 9 o'clock and all positions between. Builds multi-directional control." },
      { name: "Standing Pelvic Tilts", description: "Perform against a wall, then freestanding. Transfers lumbopelvic control to upright functional positions." },
    ],
  },
  // Knee
  {
    slug: "quad-strengthening-slr-tke",
    name: "Quadriceps Strengthening (SLR / Terminal Knee Extension)",
    description: "Foundational knee exercises combining straight leg raises and terminal knee extension. SLR: supine with knee locked, lift leg to 45°. TKE: standing with band behind knee, extend the last 30°. Both target quadriceps for OA management, improving pain, function, and joint stability through concentric and eccentric strengthening.",
    confidence: 0.9,
    notes: "Evidence: quadriceps strengthening is fundamental for knee OA — improves pain, function, and joint stability [VA 2020, Sharma 2021, Zeng 2022]. Both concentric and eccentric modes effective [VA 2020].",
    dosing: "3×10-15 reps; moderate intensity 3x/week",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "supine",
    evidenceLevel: "strong",
    movementSlugs: ["knee-extension", "hip-flexion"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "VMO emphasis in TKE for patellar tracking" },
      { muscleSlug: "rectus-femoris", role: "primary", notes: "Active in SLR (two-joint)" },
      { muscleSlug: "iliopsoas", role: "secondary", notes: "Hip flexion component of SLR" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing", "squat-to-stand", "floor-transfers"],
    cues: [
      { text: "SLR: tighten your thigh to lock the knee before lifting — the knee should stay straight throughout", cueType: "verbal" },
      { text: "TKE: stand with the band behind your knee, push it straight — really lock out the last few degrees", cueType: "verbal" },
      { text: "Slow and controlled both directions — the lowering is as important as the lifting", cueType: "verbal" },
    ],
    regressions: [
      { name: "Quad Sets", description: "Seated or supine with leg straight. Tighten the thigh muscle to push the knee down. Hold 5-10 seconds. Isometric foundation." },
      { name: "Short-Arc Quad", description: "Place a roll under the knee, extend only the lower leg. Targets terminal extension with reduced hip flexor demand." },
    ],
    progressions: [
      { name: "Ankle Weight SLR", description: "Add progressive ankle weights (1-5 lbs) for increased resistance." },
      { name: "Eccentric Step-Down", description: "Stand on a step, slowly lower the opposite foot to the ground. Eccentric quad loading in a functional pattern." },
    ],
  },
  {
    slug: "neuromuscular-exercise-knee",
    name: "Neuromuscular Exercise (Step-Downs / Single-Leg Balance)",
    description: "Neuromuscular exercises improving sensorimotor control, functional stability, and fall risk in knee OA. Includes step-downs from various heights, single-leg balance, and perturbation training. Addresses proprioceptive deficits and mimics activities of daily living.",
    confidence: 0.85,
    notes: "Evidence: neuromuscular exercises improve sensorimotor control, functional stability, and reduce fall risk in knee OA [Sharma 2021, Zeng 2022, Roos 2025]. Address proprioceptive deficits and mimic ADLs [Roos 2025].",
    dosing: "Progressive program over 12 weeks; step-down height and balance surface progress",
    difficulty: "intermediate",
    equipment: ["step"],
    bodyPosition: "standing",
    evidenceLevel: "strong",
    movementSlugs: ["knee-flexion", "knee-extension", "hip-abduction", "knee-internal-rotation", "knee-external-rotation"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "Eccentric control during step-downs" },
      { muscleSlug: "gluteus-medius", role: "primary", notes: "Pelvic stability during single-leg stance" },
      { muscleSlug: "hamstrings", role: "secondary", notes: "Co-contraction for joint stability" },
      { muscleSlug: "gastrocnemius", role: "stabilizer", notes: "Ankle strategy for balance" },
      { muscleSlug: "soleus", role: "stabilizer", notes: "Postural ankle stabilization" },
    ],
    functionalTaskSlugs: ["stair-climbing", "walking", "single-leg-balance", "running-jogging"],
    cues: [
      { text: "Step-down: stand on a step, slowly lower the other foot to the ground — take 3-5 seconds", cueType: "verbal" },
      { text: "Keep your knee tracking over your 2nd toe — don't let it cave inward", cueType: "verbal" },
      { text: "Single-leg balance: stand on one foot for 30 seconds. If too easy, close your eyes or stand on foam", cueType: "verbal" },
    ],
    regressions: [
      { name: "Double-Leg Mini Squat", description: "Bilateral mini squats to build baseline quad strength before progressing to single-leg work." },
      { name: "Tandem Stance Balance", description: "Stand with one foot directly in front of the other (heel-to-toe). Builds balance before single-leg stance." },
    ],
    progressions: [
      { name: "Step-Down with Perturbation", description: "Have a partner apply gentle pushes during single-leg stance or step-down. Trains reactive stability." },
      { name: "Single-Leg Squat", description: "Full single-leg squat to chair depth. Advanced lower extremity control challenge." },
    ],
  },
  {
    slug: "posterior-chain-strengthening",
    name: "Hamstring and Calf Strengthening",
    description: "Posterior chain strengthening to balance knee joint forces and improve functional capacity. Includes prone hamstring curls, seated heel raises, and nordic hamstring eccentric exercises. Supports weight-bearing activities and stair negotiation.",
    confidence: 0.85,
    notes: "Evidence: posterior chain strengthening balances knee joint forces and improves functional capacity [VA 2020, Zeng 2022]. Supports weight-bearing activities and stair negotiation.",
    dosing: "3×10-12 reps; eccentric emphasis for tendinopathy (3-4 second lowering)",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "moderate",
    emgNotes: "Nordic hamstring exercise: highest hamstring activation among eccentric exercises; semitendinosus significantly higher [Sahinis 2025]",
    movementSlugs: ["knee-flexion", "ankle-plantarflexion"],
    muscleRoles: [
      { muscleSlug: "hamstrings", role: "primary", notes: "Knee flexion and co-contraction for joint stability" },
      { muscleSlug: "gastrocnemius", role: "primary", notes: "Plantarflexion and weak knee flexion" },
      { muscleSlug: "soleus", role: "primary", notes: "Plantarflexion for push-off in gait" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing", "running-jogging"],
    cues: [
      { text: "Hamstring curl: lie face down, bend your knee against resistance, then lower slowly", cueType: "verbal" },
      { text: "Heel raise: rise straight up on the balls of your feet, then lower over 3-4 seconds", cueType: "verbal" },
      { text: "Both directions matter — don't let gravity do the lowering for you", cueType: "verbal" },
    ],
    regressions: [
      { name: "Seated Hamstring Curl", description: "Use a seated hamstring curl machine or band. Less balance demand than prone." },
      { name: "Double-Leg Heel Raise", description: "Standing bilateral heel raises with wall support. Build calf endurance before progressing." },
    ],
    progressions: [
      { name: "Nordic Hamstring Curl", description: "Kneel with ankles anchored, slowly lower body forward using eccentric hamstring control. Gold standard for hamstring eccentric strength." },
      { name: "Single-Leg Heel Lower off Step", description: "Rise on two legs, lower on one leg off a step edge. Eccentric calf loading for Achilles and functional strength." },
    ],
  },
  // Ankle and Foot
  {
    slug: "ankle-dorsiflexion-plantarflexion-band",
    name: "Ankle Dorsiflexion/Plantarflexion (Resistance Band)",
    description: "Seated resisted ankle exercises. Dorsiflexion: band anchored forward, pull foot up. Plantarflexion: band around foot, push foot down. Restores ROM and strength after ankle injury. Limited dorsiflexion decreases ankle stability during landing and gait.",
    confidence: 0.85,
    notes: "Evidence: resisted dorsiflexion/plantarflexion restores ROM and strength after ankle injury [Wu 2025, AAFP 2025]. Limited dorsiflexion decreases ankle stability [Wu 2025].",
    dosing: "3×15 reps each direction, daily during acute recovery",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "seated",
    evidenceLevel: "moderate",
    movementSlugs: ["ankle-dorsiflexion", "ankle-plantarflexion"],
    muscleRoles: [
      { muscleSlug: "tibialis-anterior", role: "primary", notes: "Dorsiflexion against band resistance" },
      { muscleSlug: "gastrocnemius", role: "primary", notes: "Plantarflexion against band resistance" },
      { muscleSlug: "soleus", role: "primary", notes: "Plantarflexion — especially when knee is bent" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing"],
    cues: [
      { text: "Dorsiflexion: anchor the band in front, pull your toes toward your shin against the resistance", cueType: "verbal" },
      { text: "Plantarflexion: loop band around the ball of your foot, push down like pressing a gas pedal", cueType: "verbal" },
      { text: "Control both directions — 2 seconds up, 3 seconds back", cueType: "verbal" },
    ],
    regressions: [
      { name: "Active ROM (No Band)", description: "Pump the ankle up and down without resistance. Focus on full range of motion. Alphabet tracing with the foot is also effective." },
    ],
    progressions: [
      { name: "Heavier Band", description: "Progress to a thicker/stronger resistance band as strength improves." },
      { name: "Standing Heel Raise / Toe Raise", description: "Progress to standing exercises — weight-bearing dorsiflexion (toe raises) and plantarflexion (heel raises)." },
    ],
  },
  {
    slug: "ankle-eversion-inversion-strengthening",
    name: "Ankle Eversion/Inversion Strengthening",
    description: "Targeted strengthening of ankle evertors (peroneus longus) and invertors (tibialis anterior/posterior) with resistance band. Band is anchored laterally for eversion, medially for inversion. Prevents recurrent ankle sprains and chronic instability by targeting lateral ankle stabilizers.",
    confidence: 0.85,
    notes: "Evidence: strengthening evertors/invertors prevents recurrent ankle sprains and chronic instability [Wu 2025, AAFP 2025]. Targets lateral ankle stabilizers.",
    dosing: "3×15 reps each direction, progress resistance weekly",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "seated",
    evidenceLevel: "moderate",
    movementSlugs: ["foot-eversion", "foot-inversion"],
    muscleRoles: [
      { muscleSlug: "peroneus-longus", role: "primary", notes: "Eversion — key lateral ankle stabilizer" },
      { muscleSlug: "tibialis-anterior", role: "primary", notes: "Inversion component" },
      { muscleSlug: "tibialis-posterior", role: "primary", notes: "Inversion and medial arch support" },
    ],
    functionalTaskSlugs: ["walking", "single-leg-balance"],
    cues: [
      { text: "Eversion: anchor band to the inside, turn the sole of your foot outward against resistance", cueType: "verbal" },
      { text: "Inversion: anchor band to the outside, turn the sole of your foot inward against resistance", cueType: "verbal" },
      { text: "Keep your leg still — isolate the motion to the ankle and foot", cueType: "verbal" },
    ],
    regressions: [
      { name: "Active Eversion/Inversion (No Band)", description: "Perform the motions without resistance, focusing on full range and motor control." },
    ],
    progressions: [
      { name: "Standing Single-Leg Balance on Foam", description: "Stand on one foot on a foam pad. Challenges dynamic eversion/inversion reactively." },
      { name: "Lateral Band Walks", description: "Walk sideways with a band around the ankles. Functional eversion/inversion with hip abduction." },
    ],
  },
  {
    slug: "single-leg-balance-star-excursion",
    name: "Single-Leg Balance Exercises (Star Excursion Balance Test)",
    description: "Single-leg balance training that progresses from firm to unstable surfaces. Includes single-leg stance, the star excursion reach (reaching the free leg as far as possible in several directions while balancing on one leg), and eyes-closed balance to challenge proprioception, ankle strength, and postural control."le surfaces enhance proprioception and postural control [Wu 2025, Zhang 2025]. Multifaceted proprioceptive training shows superior efficacy for chronic ankle instability [Zhang 2025].",
    dosing: "3×30 seconds per leg; progress from firm → foam → eyes closed",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "strong",
    emgNotes: "Multifaceted proprioceptive training shows superior efficacy for chronic ankle instability [Zhang 2025]",
    movementSlugs: ["ankle-dorsiflexion", "ankle-plantarflexion", "foot-inversion", "foot-eversion"],
    muscleRoles: [
      { muscleSlug: "peroneus-longus", role: "primary", notes: "Dynamic lateral stabilizer during single-leg stance" },
      { muscleSlug: "tibialis-anterior", role: "primary", notes: "Dorsiflexion control for balance" },
      { muscleSlug: "tibialis-posterior", role: "primary", notes: "Inversion control and arch support" },
      { muscleSlug: "gastrocnemius", role: "secondary", notes: "Plantarflexion strategy for balance" },
      { muscleSlug: "soleus", role: "secondary", notes: "Tonic postural stabilizer" },
      { muscleSlug: "gluteus-medius", role: "stabilizer", notes: "Pelvic stability during single-leg stance" },
    ],
    functionalTaskSlugs: ["single-leg-balance", "walking", "bathing-hygiene", "running-jogging"],
    cues: [
      { text: "Stand on one foot, keep a slight bend in the knee — don't lock it out", cueType: "verbal" },
      { text: "For star excursion: reach the free leg as far as possible in each direction while staying balanced", cueType: "verbal" },
      { text: "Lightly tap the ground with your toe — don't put weight on it", cueType: "verbal" },
      { text: "Keep your hips level and torso upright throughout", cueType: "verbal" },
    ],
    regressions: [
      { name: "Tandem Stance", description: "Stand heel-to-toe, one foot in front of the other. Narrowed base of support without going to single leg." },
      { name: "Single-Leg with Fingertip Support", description: "Stand on one leg with fingertips on a wall or counter for light balance assist." },
    ],
    progressions: [
      { name: "Foam Pad Balance", description: "Stand on one foot on a foam pad or BOSU ball. Unstable surface increases proprioceptive demand." },
      { name: "Eyes-Closed Single-Leg Balance", description: "Remove visual input to further challenge proprioception and vestibular balance." },
      { name: "Star Excursion with Squat", description: "Add a single-leg squat depth during each reach direction. Combines strength with balance." },
    ],
  },
  // ── Batch 5: Condition-Specific Exercises ─────────────────────────────────
  // Shoulder — Rotator Cuff / Impingement
  {
    slug: "full-can-exercise",
    name: "Full Can Exercise (Scaption with Thumbs Up)",
    description: "Standing shoulder elevation in the scapular plane (slightly forward of straight out to the side) with the thumb pointing up. Targets the supraspinatus while promoting scapular upward rotation and posterior tilt, which reduces subacromial impingement risk compared with the empty can position."y for 12 weeks; or progressive resistance 5 days/week over 12-16 weeks [Holmgren 2012, GRASP 2021]",
    emgNotes:
      "Supraspinatus: similar to empty can; middle deltoid: 52±27% MVIC (vs 77±44% in empty can, p=0.001). Superior supraspinatus-to-deltoid ratio [Reinold 2008]",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: ["dumbbell"],
    bodyPosition: "standing",
    movementSlugs: ["shoulder-abduction", "shoulder-flexion"],
    muscleRoles: [
      {
        muscleSlug: "supraspinatus",
        role: "primary",
        notes: "Target muscle — similar activation to empty can but better selectivity [Reinold 2008]",
      },
      {
        muscleSlug: "middle-deltoid",
        role: "secondary",
        notes: "52±27% MVIC — significantly less than empty can [Reinold 2008]",
      },
      { muscleSlug: "trapezius-upper", role: "stabilizer", notes: "Scapular upward rotation" },
      { muscleSlug: "serratus-anterior", role: "stabilizer", notes: "Scapular stability during elevation" },
    ],
    functionalTaskSlugs: ["reaching-overhead", "dressing-upper-body"],
    cues: [
      { text: "Elevate arm in scapular plane — about 30-45° forward from straight to the side", cueType: "verbal" },
      { text: "Keep thumbs pointing up to the ceiling throughout", cueType: "verbal" },
      { text: "Squeeze shoulder blade back and down as you lift", cueType: "verbal" },
      { text: "Slow and controlled — 3 seconds up, 3 seconds down", cueType: "verbal" },
      { text: "Stop at shoulder height or pain-free range", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Gravity-Eliminated Scaption",
        description: "Sidelying with arm supported, lift into scapular plane. Removes gravity load.",
      },
      {
        name: "Active-Assisted with Cane",
        description: "Use a cane or dowel to assist the lifting motion with the other hand.",
      },
    ],
    progressions: [
      {
        name: "Weighted Scaption",
        description: "Add progressive dumbbell weight (1-5 lbs). Maintain slow eccentric control.",
      },
      {
        name: "Eccentric-Focused Scaption",
        description: "Use both hands to lift, lower with affected arm only. 3-5 second lowering phase.",
      },
    ],
  },
  {
    slug: "empty-can-exercise",
    name: "Empty Can Exercise (Scaption with Thumbs Down)",
    description: "Raise the arm in the scapular plane with the thumb pointing down (internally rotated). Because this position narrows the subacromial space, the full-can (thumb-up) variation is generally preferred for rehab."y as assessment, not primary rehabilitation exercise [Reinold 2008, Boettcher 2009]",
    emgNotes:
      "Middle deltoid 77±44% MVIC, posterior deltoid 54±24% MVIC. Smallest supraspinatus-to-deltoid ratio (0.8). Does not selectively activate supraspinatus [Boettcher 2009]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["dumbbell"],
    bodyPosition: "standing",
    notes:
      "Full can exercise is preferred for rehabilitation due to better supraspinatus selectivity and lower impingement risk. Empty can increases scapular anterior tipping and internal rotation [Thigpen 2006].",
    movementSlugs: ["shoulder-abduction", "shoulder-internal-rotation"],
    muscleRoles: [
      {
        muscleSlug: "supraspinatus",
        role: "primary",
        notes: "Not selectively isolated — 9 other muscles equally active [Boettcher 2009]",
      },
      {
        muscleSlug: "middle-deltoid",
        role: "primary",
        notes: "77±44% MVIC — higher than full can [Reinold 2008]",
      },
      {
        muscleSlug: "posterior-deltoid",
        role: "secondary",
        notes: "54±24% MVIC [Reinold 2008]",
      },
    ],
    functionalTaskSlugs: ["reaching-overhead"],
    cues: [
      { text: "Elevate arm in scapular plane with thumbs pointing down", cueType: "verbal" },
      { text: "Stop at 90° — do not go overhead in this position", cueType: "verbal" },
      {
        text: "If you feel pinching in the front of the shoulder, switch to full can position",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Full Can Exercise",
        description:
          "Switch to thumbs-up position for safer supraspinatus activation with less impingement risk.",
      },
    ],
    progressions: [
      {
        name: "Not typically progressed",
        description:
          "Full can is preferred for strengthening progression.",
      },
    ],
  },
  {
    slug: "prone-er-90-abduction",
    name: "Prone External Rotation at 90° Abduction",
    description: "Lying prone with the shoulder abducted to 90° and the arm hanging off the edge of a table, externally rotate a light weight, raising the forearm toward the ceiling while keeping the elbow bent. A late-stage rotator cuff exercise requiring adequate scapular stability and pain-free abduction."s/week; late-stage exercise — introduce after pain-free 90° ABD achieved [Reinold 2004]",
    emgNotes:
      "Supraspinatus 82% MVIC, middle deltoid 87%, posterior deltoid 88% [Reinold 2004]. Teres minor-to-infraspinatus ratio 1.21±0.23 at 90° ABD [Kurokawa 2014]",
    evidenceLevel: "strong",
    difficulty: "advanced",
    equipment: ["dumbbell"],
    bodyPosition: "prone",
    movementSlugs: ["shoulder-external-rotation", "shoulder-abduction"],
    muscleRoles: [
      {
        muscleSlug: "infraspinatus",
        role: "primary",
        notes: "Primary ER — high activation at 90° ABD",
      },
      {
        muscleSlug: "teres-minor",
        role: "primary",
        notes: "More important at 90° ABD; TM:infraspinatus ratio 1.21 [Kurokawa 2014]",
      },
      {
        muscleSlug: "posterior-deltoid",
        role: "secondary",
        notes: "88% MVIC [Reinold 2004]",
      },
      {
        muscleSlug: "supraspinatus",
        role: "stabilizer",
        notes: "82% MVIC — GH joint stabilization at 90° ABD [Reinold 2004]",
      },
      {
        muscleSlug: "middle-deltoid",
        role: "stabilizer",
        notes: "87% MVIC — maintains abduction position [Reinold 2004]",
      },
    ],
    functionalTaskSlugs: ["reaching-overhead", "overhead-work"],
    cues: [
      { text: "Lie face down with shoulder at 90° off the edge of the table", cueType: "verbal" },
      {
        text: "Start with forearm hanging straight down, rotate upward toward the ceiling",
        cueType: "verbal",
      },
      { text: "Keep your elbow bent at 90° throughout", cueType: "verbal" },
      { text: "Slow and controlled — don't use momentum", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Sidelying ER at 0° ABD",
        description:
          "External rotation with arm at side. Lower demand position — infraspinatus 62% MVIC, teres minor 67% [Reinold 2004].",
      },
      {
        name: "Seated ER with Band",
        description: "Seated with band resistance. Less activation than prone but more accessible.",
      },
    ],
    progressions: [
      {
        name: "Prone ER with Heavier Weight",
        description: "Progress dumbbell weight as strength improves. Maintain slow eccentric.",
      },
      {
        name: "90/90 Standing ER with Band",
        description:
          "Standing with shoulder at 90° ABD, ER against band resistance. Functional position for overhead athletes.",
      },
    ],
  },
  // Knee — Patellofemoral Pain
  {
    slug: "spanish-squat",
    name: "Spanish Squat (Belt-Assisted)",
    description: "A squat performed with a belt or strap looped behind the knees and anchored to a fixed point, allowing a backward lean that keeps the shins vertical and reduces patellofemoral load by limiting deep knee flexion. Lean back into the belt, keep the knees tracking over the toes, and avoid squatting deep." 0-60° knee flexion, 3-5 days/week for 6-12 weeks [APTA 2020, Neal 2024]",
    emgNotes:
      "No specific Spanish squat EMG data. General CKC squats: VMO:VL approaching 1:1 [Chen 2018]. PF forces reduced 14.4% with decreased knee flexion [Kernozek 2020]",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: ["belt", "anchor-point"],
    bodyPosition: "standing",
    notes:
      "Direct evidence for 'Spanish squat' specifically is lacking. Recommendations based on general PF loading and squat biomechanics literature [Song 2023].",
    movementSlugs: ["knee-extension", "knee-flexion", "hip-extension"],
    muscleRoles: [
      {
        muscleSlug: "quadriceps",
        role: "primary",
        notes: "VMO emphasis for patellar tracking — VMO:VL ~1:1 in CKC [Chen 2018]",
      },
      { muscleSlug: "gluteus-maximus", role: "secondary", notes: "Hip extension component" },
      { muscleSlug: "hamstrings", role: "stabilizer", notes: "Knee co-contraction for joint stability" },
    ],
    functionalTaskSlugs: ["squat-to-stand", "stair-climbing"],
    cues: [
      {
        text: "Loop the belt behind both knees, anchored to a fixed point at knee height",
        cueType: "verbal",
      },
      { text: "Lean back into the belt to shift load posteriorly", cueType: "verbal" },
      { text: "Keep knees tracking over toes — avoid inward collapse", cueType: "verbal" },
      { text: "Only go to 60° knee bend — do not squat deep", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Wall Sit (Partial Range)",
        description:
          "Lean against a wall, slide down to 30-45° knee flexion. Hold 15-30 seconds. Isometric quad loading with minimal PF stress.",
      },
      {
        name: "Quad Sets",
        description:
          "Seated or supine, tighten thigh to push knee down. Isometric foundation with zero PF joint motion.",
      },
    ],
    progressions: [
      {
        name: "Deeper Spanish Squat",
        description: "Progress depth toward 60° as symptoms allow. Monitor for anterior knee pain.",
      },
      {
        name: "Single-Leg Spanish Squat",
        description: "Shift weight to one leg during the squat for unilateral quad loading.",
      },
    ],
  },
  {
    slug: "leg-press-limited-rom",
    name: "Leg Press (Limited ROM, 0-60°)",
    description: "A leg press performed through a limited, early range of knee flexion to minimize patellofemoral joint stress. Push evenly through both feet with slow, controlled motion; squeezing a ball between the knees biases activation toward the VMO." reps, 0-60° knee flexion, 3-5 days/week; progress depth as tolerated [APTA 2020, Neal 2024]",
    emgNotes:
      "CKC exercises: VMO:VL approaching 1:1 [Chen 2018]. Max VMO:VL at 60° knee flexion [Tang 2001]. Hip adduction during press: VMO:VL 1.14:1 [Irish 2010]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["leg-press-machine"],
    bodyPosition: "seated",
    movementSlugs: ["knee-extension", "hip-extension"],
    muscleRoles: [
      {
        muscleSlug: "quadriceps",
        role: "primary",
        notes: "VMO emphasis — max VMO:VL ratio at 60° [Tang 2001]",
      },
      { muscleSlug: "gluteus-maximus", role: "secondary", notes: "Hip extension component" },
      { muscleSlug: "hamstrings", role: "stabilizer", notes: "Co-contraction for knee stability" },
    ],
    functionalTaskSlugs: ["squat-to-stand", "stair-climbing"],
    cues: [
      { text: "Set the range-of-motion stop at 60° knee flexion", cueType: "verbal" },
      { text: "Push through both feet evenly", cueType: "verbal" },
      {
        text: "Squeeze a ball between your knees to activate VMO preferentially",
        cueType: "verbal",
      },
      { text: "Slow controlled motion — 2 seconds push, 3 seconds return", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Quad Sets / SLR",
        description:
          "Isometric quadriceps activation or straight leg raises if leg press is too provocative.",
      },
      {
        name: "Partial ROM Leg Press",
        description: "Restrict to 0-30° if 60° is painful. Very low PF forces in this range.",
      },
    ],
    progressions: [
      {
        name: "Deeper ROM Leg Press",
        description:
          "Progress to 0-90° as symptoms allow. Monitor for anterior knee pain at deeper angles.",
      },
      {
        name: "Single-Leg Press",
        description: "Unilateral leg press for increased demand. Maintain 0-60° range.",
      },
    ],
  },
  // Ankle — Achilles Tendinopathy
  {
    slug: "alfredson-eccentric-heel-drops",
    name: "Alfredson Protocol — Eccentric Heel Drops",
    description: "Standing on a step edge, slowly lower the heel below the edge on the affected leg, then use the unaffected leg to rise back up. Performed in both straight-knee (gastrocnemius bias) and bent-knee (soleus bias) versions; a gold-standard loading exercise for midportion Achilles tendinopathy."aight-knee and bent-knee, 2x daily (180 total reps/day), 7 days/week, 12 weeks. Progress load when pain-free. 'Do-as-tolerated' alternative: avg 112 reps/day [Alfredson, Stevens 2014]",
    emgNotes:
      "Improved neuromuscular performance (torque, work, endurance) is the only mechanism consistently associated with clinical improvement [Malliaras 2013]",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: ["step"],
    bodyPosition: "standing",
    movementSlugs: ["ankle-plantarflexion", "ankle-dorsiflexion"],
    muscleRoles: [
      {
        muscleSlug: "gastrocnemius",
        role: "primary",
        notes: "Eccentric loading straight-knee version — gastrocnemius bias",
      },
      {
        muscleSlug: "soleus",
        role: "primary",
        notes: "Eccentric loading bent-knee version — soleus bias",
      },
      {
        muscleSlug: "tibialis-posterior",
        role: "stabilizer",
        notes: "Ankle stabilization during eccentric lowering",
      },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing", "running-jogging"],
    cues: [
      {
        text: "Rise up on both feet, then shift weight to the affected leg",
        cueType: "verbal",
      },
      {
        text: "Lower the heel slowly below the step edge over 3-5 seconds",
        cueType: "verbal",
      },
      {
        text: "Straight knee version: keep knee locked for gastrocnemius",
        cueType: "verbal",
      },
      {
        text: "Bent knee version: slightly bend the knee for soleus",
        cueType: "verbal",
      },
      {
        text: "Use the unaffected leg to rise back up — only the lowering is on one leg",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Bilateral Eccentric Heel Drops",
        description: "Lower on both legs instead of single-leg. Reduces load by 50%.",
      },
      {
        name: "Flat Ground Heel Raises",
        description: "Standing heel raises on flat ground before progressing to step edge.",
      },
    ],
    progressions: [
      {
        name: "Weighted Eccentric Heel Drops",
        description:
          "Add a backpack with progressively increasing weight. Load increases when pain-free at bodyweight.",
      },
      {
        name: "Heavy Slow Resistance Protocol",
        description:
          "Progress to HSR: seated + standing + leg press calf raises at 6RM progressing to 4×6 [Beyer 2015].",
      },
    ],
  },
  {
    slug: "heavy-slow-resistance-achilles",
    name: "Heavy Slow Resistance (HSR) for Achilles Tendinopathy",
    description: "Progressive heavy, slow resistance training for the calf, performed as seated calf raise (bent knee), standing barbell calf raise (straight knee), and leg-press calf raise (straight knee). Each repetition is moved slowly through full range, heels dropped below the platform and raised to full plantarflexion, with load increased gradually as tolerated." Wk2-3 3×12, Wk4-5 4×10, Wk6-8 4×8, Wk9-12 4×6. 6 seconds per rep. 3 exercises per session [Beyer 2015]",
    emgNotes:
      "Both HSR and eccentric reduce tendon thickness and neovascularization. HSR shows greater collagen turnover evidence and may be more likely to produce tendon adaptation [Malliaras 2013]",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: ["barbell", "calf-raise-machine", "leg-press-machine"],
    bodyPosition: "standing",
    movementSlugs: ["ankle-plantarflexion"],
    muscleRoles: [
      {
        muscleSlug: "gastrocnemius",
        role: "primary",
        notes: "Standing and leg press variations — straight knee",
      },
      {
        muscleSlug: "soleus",
        role: "primary",
        notes: "Seated variation — bent knee isolates soleus",
      },
      {
        muscleSlug: "tibialis-posterior",
        role: "stabilizer",
        notes: "Ankle stabilization during heavy loading",
      },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing", "running-jogging"],
    cues: [
      {
        text: "Three exercises per session: seated calf raise, standing barbell raise, leg press calf raise",
        cueType: "verbal",
      },
      {
        text: "Every rep takes 6 seconds: 3 seconds up, 3 seconds down",
        cueType: "verbal",
      },
      {
        text: "Increase weight when you can complete all sets without pain",
        cueType: "verbal",
      },
      {
        text: "Full range of motion — drop heels below platform, rise to full plantarflexion",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Alfredson Eccentric Protocol",
        description:
          "If HSR equipment is unavailable, eccentric heel drops on a step achieve equivalent outcomes [Beyer 2015].",
      },
      {
        name: "Bilateral Calf Raises",
        description: "Start bilateral before progressing to single-leg or loaded variations.",
      },
    ],
    progressions: [
      {
        name: "Increased Load",
        description:
          "Continue progressing weight beyond the 12-week protocol. Follow standard progressive overload principles.",
      },
      {
        name: "Plyometric Calf Work",
        description:
          "Add hopping and jumping progressions for return-to-sport after completing the 12-week protocol.",
      },
    ],
  },
  // Shoulder — Adhesive Capsulitis (Frozen Shoulder)
  {
    slug: "pendulum-exercise",
    name: "Pendulum Exercise (Codman's)",
    description:
      "Leaning forward with the affected arm hanging, creating small circular or pendulum motions using body sway rather than active shoulder muscle contraction. Used in early-stage frozen shoulder (freezing phase) when active motion is too painful. Proposed mechanisms include joint distraction, synovial fluid circulation, and pain gate modulation.",
    confidence: 0.7,
    dosing:
      "5-10 minutes, 2-3x daily; small circles in both directions, forward/back, and side-to-side. With or without 1-2 lb weight [expert consensus]",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    notes:
      "Limited high-quality RCT evidence. Commonly prescribed based on clinical experience and biomechanical reasoning. Use in freezing phase of adhesive capsulitis.",
    movementSlugs: ["shoulder-flexion", "shoulder-abduction", "shoulder-adduction"],
    muscleRoles: [
      {
        muscleSlug: "supraspinatus",
        role: "stabilizer",
        notes: "Should be minimally active — passive motion exercise",
      },
      {
        muscleSlug: "anterior-deltoid",
        role: "stabilizer",
        notes: "Minimal activation — motion from body sway, not shoulder muscles",
      },
    ],
    functionalTaskSlugs: ["dressing-upper-body", "bathing-hygiene"],
    cues: [
      {
        text: "Lean forward, supporting yourself with your good arm on a table",
        cueType: "verbal",
      },
      {
        text: "Let the affected arm hang completely relaxed — like a dead weight",
        cueType: "verbal",
      },
      {
        text: "Sway your body to create the motion — don't use your shoulder muscles",
        cueType: "verbal",
      },
      {
        text: "Make small circles, then switch directions. Also swing forward/back and side-to-side",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Gravity-Assisted Pendulum",
        description:
          "Lean over further to increase the distraction effect. No weight in hand.",
      },
      {
        name: "Supine Passive ROM",
        description:
          "Lie on back, use the other hand to gently move the affected arm. Fully passive.",
      },
    ],
    progressions: [
      {
        name: "Weighted Pendulum",
        description:
          "Add a 1-2 lb weight to increase distraction and momentum. Gradually increase arc of motion.",
      },
      {
        name: "Active-Assisted Wall Walks",
        description:
          "Progress to wall finger-walking when active motion becomes tolerable.",
      },
    ],
  },
  {
    slug: "wall-walks-shoulder",
    name: "Wall Walks (Wall Finger Climbing)",
    description:
      "Facing or perpendicular to a wall, walking the fingers up the wall to progressively increase shoulder flexion or abduction ROM. Used in late freezing or early thawing phase of adhesive capsulitis when active ROM exercises become tolerable. Patients work into mild discomfort but not sharp pain.",
    confidence: 0.7,
    dosing:
      "3×10 reps, 1-2x daily; progress height as tolerated. Mark highest point and track progress over weeks [clinical consensus]",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    notes:
      "Limited RCT evidence. Commonly prescribed for progressive active-assisted ROM in frozen shoulder and post-surgical stiffness.",
    movementSlugs: ["shoulder-flexion", "shoulder-abduction"],
    muscleRoles: [
      {
        muscleSlug: "anterior-deltoid",
        role: "primary",
        notes: "Active shoulder flexion against gravity",
      },
      {
        muscleSlug: "supraspinatus",
        role: "synergist",
        notes: "Assists initiation of abduction",
      },
      {
        muscleSlug: "trapezius-upper",
        role: "stabilizer",
        notes: "Scapular upward rotation during elevation",
      },
      {
        muscleSlug: "serratus-anterior",
        role: "stabilizer",
        notes: "Scapular stability during overhead reaching",
      },
    ],
    functionalTaskSlugs: ["reaching-overhead", "dressing-upper-body", "overhead-work"],
    cues: [
      {
        text: "Stand arm's length from the wall, facing it for flexion or sideways for abduction",
        cueType: "verbal",
      },
      {
        text: "Walk your fingers up the wall as high as you can comfortably go",
        cueType: "verbal",
      },
      {
        text: "Mark your highest point with tape — try to go a little higher each session",
        cueType: "verbal",
      },
      {
        text: "Mild stretching discomfort is OK — sharp pain means you've gone too far",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Supine Active-Assisted Flexion",
        description:
          "Lie on back, use a cane or the other hand to raise the arm overhead. Gravity-assisted.",
      },
      {
        name: "Pendulum Exercises",
        description:
          "If wall walks are too painful, return to pendulums until motion improves.",
      },
    ],
    progressions: [
      {
        name: "Overhead Pulley",
        description:
          "Use an overhead pulley system for greater ROM and active-assisted motion.",
      },
      {
        name: "Active Flexion / Abduction",
        description:
          "Once full ROM is achieved on the wall, progress to free active elevation without wall support.",
      },
    ],
  },
  // Hand/Wrist — Carpal Tunnel Syndrome
  {
    slug: "nerve-tendon-gliding-cts",
    name: "Nerve and Tendon Gliding Exercises (Carpal Tunnel)",
    description: "A combined program of median nerve glides and tendon glides for carpal tunnel syndrome. Nerve glides move sequentially through shoulder abduction, elbow extension, wrist/finger extension, and cervical lateral flexion. Tendon glides move the hand through straight, hook fist, full fist, tabletop, and straight-fist positions." 3-5x daily, 6-12 weeks; combine with nighttime neutral wrist splinting [Akalin 2002, Baysal 2006]",
    emgNotes:
      "Historical studies show modest improvements when combined with splinting. May help delay or reduce need for surgical intervention in mild-moderate CTS.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    notes:
      "Historical studies show modest improvements when combined with splinting. May help delay or reduce need for surgical intervention in mild-moderate CTS.",
    movementSlugs: ["wrist-extension", "wrist-flexion", "finger-flexion", "finger-extension", "dip-flexion", "pip-flexion", "dip-extension", "pip-extension"],
    muscleRoles: [
      {
        muscleSlug: "flexor-digitorum-superficialis",
        role: "primary",
        notes: "Tendon gliding through carpal tunnel",
      },
      {
        muscleSlug: "flexor-digitorum-profundus",
        role: "primary",
        notes: "Differential tendon excursion during gliding positions",
      },
      {
        muscleSlug: "extensor-digitorum",
        role: "synergist",
        notes: "Active finger extension during nerve tensioning positions",
      },
    ],
    functionalTaskSlugs: ["typing", "gripping-cup"],
    cues: [
      {
        text: "Nerve glide: start with fist at shoulder, slowly extend elbow → wrist → fingers in sequence",
        cueType: "verbal",
      },
      {
        text: "Tendon glide: move through each hand position slowly — straight, hook, fist, tabletop, straight fist",
        cueType: "verbal",
      },
      {
        text: "You should feel a gentle stretch, not pain or tingling",
        cueType: "verbal",
      },
      {
        text: "If symptoms worsen, reduce the range of the nerve glide",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Tendon Glides Only",
        description:
          "Perform only the tendon gliding sequence without the nerve component. Less neural tension.",
      },
      {
        name: "Single-Joint Nerve Glide",
        description:
          "Move only one joint at a time (e.g., wrist extension only) instead of the full sequential mobilization.",
      },
    ],
    progressions: [
      {
        name: "Full Sequential Nerve Glide",
        description:
          "Complete the full shoulder-elbow-wrist-finger-cervical sequence for maximum neural excursion.",
      },
      {
        name: "Nerve Glide with Sustained Hold",
        description:
          "Hold the end-range position for 5-10 seconds to increase neural tensioning effect.",
      },
    ],
  },
  {
    slug: "wrist-splinting-exercise-cts",
    name: "Wrist Neutral Splinting + Exercise Protocol (CTS)",
    description: "A conservative program for carpal tunnel syndrome combining a nighttime splint that holds the wrist in a neutral position with daytime nerve and tendon gliding exercises. Used as a first-line non-surgical approach to relieve median nerve symptoms."-12 weeks, neutral position (0-20° extension). Exercises: nerve and tendon glides 3-5x daily during waking hours [clinical consensus]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["wrist-splint"],
    bodyPosition: "seated",
    notes:
      "First-line conservative management for mild-moderate CTS. Surgical referral criteria: severe symptoms >6 months, thenar atrophy, persistent numbness, failed 3-6 months conservative, severe electrodiagnostic findings.",
    movementSlugs: ["wrist-extension", "wrist-flexion"],
    muscleRoles: [
      {
        muscleSlug: "flexor-digitorum-superficialis",
        role: "primary",
        notes: "Tendon excursion during gliding exercises",
      },
      {
        muscleSlug: "flexor-digitorum-profundus",
        role: "primary",
        notes: "Tendon excursion during gliding exercises",
      },
      {
        muscleSlug: "extensor-digitorum",
        role: "synergist",
        notes: "Active extension during nerve glide positions",
      },
    ],
    functionalTaskSlugs: ["typing", "gripping-cup", "opening-jar"],
    cues: [
      {
        text: "Wear the splint every night — consistency is key for symptom relief",
        cueType: "verbal",
      },
      {
        text: "The splint should keep your wrist straight or slightly extended — not bent",
        cueType: "verbal",
      },
      {
        text: "During the day, perform the gliding exercises every 2-3 hours",
        cueType: "verbal",
      },
      {
        text: "Track your symptoms weekly — improvement is gradual over 6-12 weeks",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Splinting Only",
        description:
          "If exercises worsen symptoms, start with splinting alone for 2-4 weeks before adding exercises.",
      },
      {
        name: "Activity Modification",
        description:
          "Reduce provocative activities (sustained gripping, vibration tools) alongside splinting.",
      },
    ],
    progressions: [
      {
        name: "Add Strengthening",
        description:
          "Once symptoms improve, add grip strengthening and wrist curl exercises to prevent recurrence.",
      },
      {
        name: "Ergonomic Modification",
        description:
          "Add workstation ergonomic changes (keyboard position, wrist rest, mouse position) for sustained improvement.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 1: Missing Essentials
  // ═══════════════════════════════════════════════════════════════════════════

  {
    slug: "isometric-neck-strengthening",
    name: "Isometric Neck Strengthening (4 Directions)",
    description: "Cervical isometrics in four directions, flexion, extension, and lateral flexion to each side, using the hand or a band as resistance while the head stays still."th 5-10 second holds, >20 reps/session, >8 weeks duration [Yang 2022]",
    emgNotes:
      "Thera-Band: flexion 3.8-15.7% MVIC, extension 20.2-34.8% MVIC. Cybex: flexion 20.9-83.5%, extension 40.6-95.8% [Burnett 2008]",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    movementSlugs: ["cervical-flexion", "cervical-extension", "cervical-lateral-flexion", "cervical-rotation"],
    muscleRoles: [
      { muscleSlug: "deep-cervical-flexors", role: "primary", notes: "Flexion direction" },
      {
        muscleSlug: "sternocleidomastoid",
        role: "secondary",
        notes: "Superficial flexor — activity decreases with training [Dirito 2024]",
      },
      { muscleSlug: "erector-spinae", role: "primary", notes: "Extension direction — thoracic portion" },
      { muscleSlug: "trapezius-upper", role: "stabilizer", notes: "Scapular stability during resistance" },
    ],
    functionalTaskSlugs: ["posture-maintenance"],
    cues: [
      { text: "Push your hand against your forehead — resist without moving your head", cueType: "verbal" },
      { text: "Hold each direction for 5-10 seconds, breathing normally", cueType: "verbal" },
      { text: "Keep your shoulders relaxed — don't shrug", cueType: "verbal" },
      { text: "4 directions: forward, backward, each side", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Submaximal Resistance",
        description: "Use only 25-50% effort against your hand. Build tolerance before increasing force.",
      },
      {
        name: "Supine Isometrics",
        description: "Perform lying down to reduce postural demands.",
      },
    ],
    progressions: [
      {
        name: "Thera-Band Resistance",
        description: "Use resistance band for consistent progressive loading across all directions.",
      },
      {
        name: "Cybex/Machine Resistance",
        description: "Machine-based resistance for higher activation (up to 95.8% MVIC) [Burnett 2008].",
      },
    ],
  },
  {
    slug: "upper-trapezius-stretch",
    name: "Upper Trapezius Stretch",
    description: "Seated or standing, laterally flex the neck away from the target side while gently depressing the same-side shoulder with the hand to stretch the upper trapezius."seconds per side, 2x daily, 5 days/week for 4+ weeks [Tunwattanapong 2016]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    movementSlugs: ["cervical-lateral-flexion"],
    muscleRoles: [
      { muscleSlug: "trapezius-upper", role: "primary", notes: "Target muscle being stretched" },
      { muscleSlug: "levator-scapulae", role: "secondary", notes: "Partially stretched in this position" },
    ],
    functionalTaskSlugs: ["posture-maintenance"],
    cues: [
      { text: "Tilt your ear toward the opposite shoulder — don't rotate", cueType: "verbal" },
      { text: "Gently press the same-side shoulder down with your hand", cueType: "verbal" },
      { text: "Hold for 30-60 seconds, breathing normally", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Gentle Active Side Bend",
        description: "Perform the lateral flexion without hand assistance. Focus on range first.",
      },
    ],
    progressions: [
      {
        name: "PNF Contract-Relax",
        description: "Gently push head into hand for 5 seconds, then relax deeper into the stretch.",
      },
    ],
  },
  {
    slug: "levator-scapulae-stretch",
    name: "Levator Scapulae Stretch",
    description: "A neck stretch that biases the levator scapulae over the upper trapezius by adding cervical rotation toward the target side. Turn the chin toward the opposite armpit, tilt the ear down toward that armpit, and apply gentle overpressure with the hand on top of the head."econds per side, 2x daily, 5 days/week [Tunwattanapong 2016]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    movementSlugs: ["cervical-lateral-flexion", "cervical-rotation"],
    muscleRoles: [
      {
        muscleSlug: "levator-scapulae",
        role: "primary",
        notes: "Target muscle — rotation differentiates from upper trap stretch [Yanase 2021]",
      },
      { muscleSlug: "trapezius-upper", role: "secondary", notes: "Partially stretched" },
    ],
    functionalTaskSlugs: ["posture-maintenance"],
    cues: [
      { text: "Turn your chin toward your armpit on the opposite side", cueType: "verbal" },
      { text: "Then tilt your ear down toward that armpit", cueType: "verbal" },
      { text: "Use your hand on top of your head for gentle overpressure", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Active ROM Only",
        description: "Perform the rotation and lateral flexion actively without hand assistance.",
      },
    ],
    progressions: [
      {
        name: "Seated with Arm Behind Back",
        description: "Hold the chair seat with the stretch-side hand to anchor the scapula down.",
      },
    ],
  },
  {
    slug: "tyler-twist-eccentric-wrist",
    name: "Tyler Twist — Eccentric Wrist Extension (FlexBar)",
    description: "Using a Thera-Band FlexBar, load the wrist extensors eccentrically for lateral epicondylalgia (tennis elbow). Grip the bar with the affected hand at the bottom and the other hand on top, twist it with the top hand, then slowly control the untwist with the bottom wrist."ress FlexBar resistance (green → blue → black) [Tyler 2010]",
    emgNotes: "Large effect sizes: pain reduction ES 1.12, function improvement ES 1.22 [Chen 2020]",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: ["flexbar"],
    bodyPosition: "standing",
    movementSlugs: ["wrist-extension"],
    muscleRoles: [
      {
        muscleSlug: "extensor-carpi-radialis-longus",
        role: "primary",
        notes: "Eccentric loading — primary target for lateral epicondylalgia",
      },
      { muscleSlug: "extensor-digitorum", role: "secondary", notes: "Common extensor origin involvement" },
    ],
    functionalTaskSlugs: ["gripping-cup", "opening-jar", "typing"],
    cues: [
      { text: "Grip the FlexBar with the affected hand on bottom, unaffected on top", cueType: "verbal" },
      { text: "Twist with the top hand, then slowly untwist with the bottom hand", cueType: "verbal" },
      { text: "The slow untwisting is the therapeutic part — 3 seconds to release", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Isometric Wrist Extension",
        description: "Hold wrist in extension against light resistance. Build tolerance before eccentric work.",
      },
    ],
    progressions: [
      {
        name: "Heavier FlexBar",
        description: "Progress from green (light) to blue (medium) to black (heavy) as pain-free.",
      },
    ],
  },
  {
    slug: "wrist-curls-flexion-extension",
    name: "Wrist Curls (Flexion/Extension)",
    description: "Seated with the forearm resting on the thigh and the wrist hanging off the knee, curl the wrist up and down with a light dumbbell, training both wrist flexion and extension."ch direction, 3x/week",
    emgNotes:
      "Wrist extensors co-contraction ratio 2.28 during flexion vs 0.32 during extension — extensors highly active as stabilizers [Forman 2020]",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: ["dumbbell"],
    bodyPosition: "seated",
    movementSlugs: ["wrist-flexion", "wrist-extension"],
    muscleRoles: [
      { muscleSlug: "flexor-carpi-radialis", role: "primary", notes: "Wrist flexion direction" },
      { muscleSlug: "flexor-carpi-ulnaris", role: "primary", notes: "Wrist flexion direction" },
      { muscleSlug: "extensor-carpi-radialis-longus", role: "primary", notes: "Wrist extension direction" },
      {
        muscleSlug: "extensor-digitorum",
        role: "stabilizer",
        notes: "Co-contraction ratio 2.28 during flexion [Forman 2020]",
      },
    ],
    functionalTaskSlugs: ["gripping-cup", "typing"],
    cues: [
      { text: "Rest forearm on thigh, wrist hanging off the knee", cueType: "verbal" },
      { text: "Flexion: curl wrist up with palm facing ceiling", cueType: "verbal" },
      { text: "Extension: curl wrist up with palm facing floor", cueType: "verbal" },
      { text: "Slow and controlled — 2 seconds up, 3 seconds down", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "No Weight",
        description: "Perform without resistance, focusing on full ROM.",
      },
    ],
    progressions: [
      {
        name: "Increased Weight",
        description: "Progress dumbbell weight by 0.5-1 lb increments.",
      },
    ],
  },
  {
    slug: "finger-extension-band",
    name: "Finger Extension with Rubber Band",
    description:
      "Place a rubber band around all five fingertips and spread the fingers apart against resistance. Targets finger and thumb extensors for grip balance and hand rehabilitation.",
    confidence: 0.75,
    dosing: "3×15-20 reps, 2-3x daily",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: ["rubber-band"],
    bodyPosition: "seated",
    movementSlugs: ["finger-extension", "finger-abduction"],
    muscleRoles: [
      { muscleSlug: "extensor-digitorum", role: "primary", notes: "Finger MCP extension against band resistance" },
      { muscleSlug: "dorsal-interossei", role: "secondary", notes: "Finger abduction component" },
    ],
    functionalTaskSlugs: ["gripping-cup", "typing"],
    cues: [
      { text: "Place the band around all fingertips near the nails", cueType: "verbal" },
      { text: "Spread all fingers wide against the resistance", cueType: "verbal" },
      { text: "Hold the open position for 2-3 seconds, then slowly release", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Thinner Band",
        description: "Use a lighter rubber band for less resistance.",
      },
    ],
    progressions: [
      {
        name: "Double Band",
        description: "Add a second rubber band for increased resistance.",
      },
    ],
  },
  {
    slug: "tendon-gliding-exercises",
    name: "Tendon Gliding Exercises (Finger)",
    description: "Move the fingers through a systematic sequence of positions, straight, hook fist, full fist, tabletop, straight fist, to maximize differential gliding of the flexor tendons through their sheaths."session, 4-6 sessions daily in early post-repair protocol [Tang 2021]",
    emgNotes:
      "FDP excursion: 23.4 mm active 4-finger mobilization vs 10.0 mm modified Kleinert [Korstanje 2012]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    movementSlugs: ["finger-flexion", "finger-extension", "dip-flexion", "pip-flexion", "dip-extension", "pip-extension"],
    muscleRoles: [
      { muscleSlug: "flexor-digitorum-superficialis", role: "primary", notes: "PIP flexion during fist positions" },
      {
        muscleSlug: "flexor-digitorum-profundus",
        role: "primary",
        notes: "DIP flexion — maximum excursion during full fist",
      },
      { muscleSlug: "extensor-digitorum", role: "primary", notes: "Active extension between positions" },
      {
        muscleSlug: "lumbricals",
        role: "synergist",
        notes: "MCP flexion with IP extension during tabletop position",
      },
    ],
    functionalTaskSlugs: ["gripping-cup"],
    cues: [
      { text: "Move through each position slowly and deliberately", cueType: "verbal" },
      {
        text: "Straight → Hook fist (curl fingers at PIP/DIP only) → Full fist → Tabletop (bend at MCP only) → Straight fist",
        cueType: "verbal",
      },
      { text: "Hold each position for 3-5 seconds", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Passive Gliding",
        description: "Use the other hand to assist the motion through each position.",
      },
    ],
    progressions: [
      {
        name: "Resisted Gliding",
        description: "Squeeze therapy putty in the fist positions for added resistance.",
      },
    ],
  },
  {
    slug: "side-plank",
    name: "Side Plank (Lateral Bridge)",
    description: "A side-lying forearm plank for lateral core stability: with the forearm under the shoulder and feet stacked or staggered, lift the hips into a straight line from head to feet and hold without sagging or piking. A rotational side-bridge variant adds trunk rotation to increase oblique demand."ond holds per side, progress to 45-60 seconds; 2-3x/week",
    emgNotes:
      "QL 121.62% MVIC, glute med 66.67% MVIC [Nam 2025]. Rotational variant: EO 62.8%, RA 43.9%, glute med >69% [Youdas 2014]",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "sidelying",
    movementSlugs: ["thoracic-lateral-flexion", "hip-abduction", "lumbar-lateral-flexion"],
    muscleRoles: [
      { muscleSlug: "quadratus-lumborum", role: "primary", notes: "121.62% MVIC — highest activation [Nam 2025]" },
      {
        muscleSlug: "external-oblique",
        role: "primary",
        notes: "62.8% MVIC in rotational variant [Youdas 2014]",
      },
      {
        muscleSlug: "gluteus-medius",
        role: "secondary",
        notes: "66.67-69% MVIC — pelvic stability [Nam 2025, Youdas 2014]",
      },
      { muscleSlug: "internal-oblique", role: "secondary", notes: "Anti-lateral-flexion demand" },
      { muscleSlug: "erector-spinae", role: "stabilizer", notes: "Trunk stabilization" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "carrying-lifting"],
    cues: [
      { text: "Stack your feet or stagger them, forearm directly under shoulder", cueType: "verbal" },
      { text: "Lift hips to create a straight line from head to feet", cueType: "verbal" },
      { text: "Don't let your hips sag or pike", cueType: "verbal" },
      { text: "Breathe normally throughout the hold", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Knee Side Plank",
        description: "Perform from knees instead of feet. Reduces lever arm and difficulty.",
      },
      {
        name: "Side-Lying Hip Abduction",
        description:
          "If plank is not tolerated, perform sidelying hip abduction for glute med activation.",
      },
    ],
    progressions: [
      {
        name: "Side Plank with Hip Abduction",
        description: "Lift the top leg during the hold. Increases gluteus medius demand.",
      },
      {
        name: "Side Plank with Rotation",
        description:
          "Rotate torso toward floor and back. EO 62.8%, RA 43.9% MVIC [Youdas 2014].",
      },
    ],
  },
  {
    slug: "mcgill-curl-up",
    name: "McGill Curl-Up",
    description: "A modified curl-up performed with the hands under the lumbar spine to preserve its natural curve, one knee bent and one straight. Lift only the head and shoulders slightly off the floor through a minimal range to challenge the abdominals while minimizing spinal compression.": "3×8-10 reps; focus on quality over quantity — minimal spinal flexion",
    emgNotes:
      "RA 48-50% nEMG [Calatayud 2019]. Highest muscle challenge-to-spine cost ratio among abdominal exercises [Axler 1997]",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "supine",
    movementSlugs: ["lumbar-flexion"],
    muscleRoles: [
      {
        muscleSlug: "rectus-abdominis",
        role: "primary",
        notes: "48-50% MVIC — optimal activation with minimal compression [Calatayud 2019]",
      },
      { muscleSlug: "external-oblique", role: "secondary", notes: "Supporting trunk flexion" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Deep core stability" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "bed-mobility"],
    cues: [
      { text: "Slide your hands under your lower back to maintain its natural curve", cueType: "verbal" },
      { text: "Bend one knee, keep the other straight", cueType: "verbal" },
      { text: "Lift ONLY your head and shoulders — just barely off the floor", cueType: "verbal" },
      { text: "Hold for 8-10 seconds, breathing normally", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Head Lift Only",
        description: "Lift only the head, not shoulders. Minimal demand.",
      },
    ],
    progressions: [
      {
        name: "Longer Holds",
        description: "Increase hold time to 15-20 seconds per rep.",
      },
    ],
  },
  {
    slug: "pallof-press",
    name: "Pallof Press (Anti-Rotation)",
    description: "Standing perpendicular to a cable or band anchor, press both arms straight forward and resist the band's pull to rotate you. An anti-rotation core exercise targeting the obliques and deep trunk stabilizers." per side with 3-5 second holds at full extension",
    emgNotes:
      "Limited specific EMG data. General anti-rotation exercises activate obliques and core stabilizers. Motor control exercise SMD -0.33 for pain [Gross 2015]",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: ["resistance-band"],
    bodyPosition: "standing",
    movementSlugs: ["thoracic-rotation", "lumbar-flexion", "lumbar-rotation"],
    muscleRoles: [
      { muscleSlug: "internal-oblique", role: "primary", notes: "Anti-rotation demand — resists rotational pull" },
      { muscleSlug: "external-oblique", role: "primary", notes: "Anti-rotation and trunk stability" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Deep core stability during press" },
      {
        muscleSlug: "erector-spinae",
        role: "stabilizer",
        notes: "Maintains neutral spine against rotation",
      },
    ],
    functionalTaskSlugs: ["posture-maintenance", "carrying-lifting"],
    cues: [
      { text: "Stand sideways to the band anchor at chest height", cueType: "verbal" },
      { text: "Press both hands straight forward — the band tries to rotate you", cueType: "verbal" },
      { text: "Hold the extended position for 3-5 seconds, resist the pull", cueType: "verbal" },
      { text: "Keep your hips square — don't let them rotate", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Half-Kneeling Pallof Press",
        description:
          "Kneel on the inside knee for a more stable base. Reduces balance demand.",
      },
    ],
    progressions: [
      {
        name: "Pallof Press with Step",
        description: "Take a lateral step while pressing. Adds dynamic stability challenge.",
      },
      {
        name: "Overhead Pallof Press",
        description:
          "Press arms overhead instead of forward. Increases lever arm and anti-rotation demand.",
      },
    ],
  },
  {
    slug: "hip-hinge-deadlift",
    name: "Hip Hinge / Deadlift Pattern",
    description: "Standing hip hinge (Romanian deadlift pattern) with bodyweight or a barbell, emphasizing posterior chain loading through the hamstrings and glutes while maintaining a neutral spine. The hips travel back as the torso hinges forward, then drive forward to stand tall." 60-80% 1RM for strengthening; bodyweight for learning pattern",
    emgNotes:
      "Step-RDL at 80% 1RM: glute max ES=1.70, semitendinosus ES=0.82, erector spinae longissimus ES=2.12 vs standard RDL [Coratella 2022]. Single-leg RDL: glute max 105-169% MVIC, BF 70-122% MVIC [Mo 2023]",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: ["barbell", "dumbbells"],
    bodyPosition: "standing",
    movementSlugs: ["hip-extension", "knee-extension", "lumbar-extension"],
    muscleRoles: [
      {
        muscleSlug: "gluteus-maximus",
        role: "primary",
        notes: "Hip extension — single-leg: 105-169% MVIC [Mo 2023]",
      },
      {
        muscleSlug: "hamstrings",
        role: "primary",
        notes: "Peak force 1.6-1.9 BW, exceeds sprinting demands [Breed 2026]",
      },
      {
        muscleSlug: "erector-spinae",
        role: "secondary",
        notes: "Trunk extension — ES=2.12 in step-RDL [Coratella 2022]",
      },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Core bracing for spinal protection" },
    ],
    functionalTaskSlugs: ["carrying-lifting", "floor-transfers"],
    cues: [
      { text: "Push your hips back like you're closing a car door with your butt", cueType: "verbal" },
      { text: "Keep the bar or weights close to your legs throughout", cueType: "verbal" },
      { text: "Slight bend in knees — this is NOT a squat", cueType: "verbal" },
      { text: "Maintain a flat back — neutral spine the entire time", cueType: "verbal" },
      { text: "Drive hips forward to stand tall", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Bodyweight Hip Hinge",
        description:
          "Practice the pattern with hands on a dowel along your spine (head, upper back, sacrum contact).",
      },
      {
        name: "Dumbbell RDL",
        description: "Use dumbbells instead of barbell for easier learning curve.",
      },
    ],
    progressions: [
      {
        name: "Single-Leg RDL",
        description:
          "Contralateral loading increases glute med, inferior and superior glute max significantly [Mo 2023].",
      },
      {
        name: "Step-RDL (Elevated Platform)",
        description:
          "Greater ROM increases all posterior chain activation: glute max ES=1.70 [Coratella 2022].",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 2: Intermediate Progressions
  // ═══════════════════════════════════════════════════════════════════════════

  {
    slug: "split-squat-bulgarian",
    name: "Split Squat / Bulgarian Split Squat",
    description: "A staggered-stance squat with the rear foot on the ground (split squat) or elevated on a bench behind (Bulgarian). Lower straight down until the front thigh is roughly parallel to the floor while keeping the torso upright, then push through the front heel to return, training unilateral quad, hamstring, and glute strength." at 60-80% 1RM, 2-3x/week [Mausehund 2019]",
    emgNotes:
      "RFESS: BF 76.1% MVIC, glute med 54.9% MVIC, H/Q ratio 0.83 [Mausehund 2019]. Muscle forces scale more with load in split squat vs bilateral squat [Kipp 2022]",
    evidenceLevel: "strong",
    difficulty: "intermediate",
    equipment: ["bench", "dumbbells"],
    bodyPosition: "standing",
    movementSlugs: ["knee-extension", "knee-flexion", "hip-extension"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "Front leg — comparable to bilateral squat" },
      {
        muscleSlug: "gluteus-maximus",
        role: "primary",
        notes: "Similar peak values to bilateral squat [Mausehund 2019]",
      },
      {
        muscleSlug: "hamstrings",
        role: "secondary",
        notes: "76.1% MVIC RFESS — higher coactivation [Mausehund 2019]",
      },
      {
        muscleSlug: "gluteus-medius",
        role: "stabilizer",
        notes: "54.9% MVIC — pelvic stability in unilateral stance",
      },
    ],
    functionalTaskSlugs: ["stair-climbing", "floor-transfers", "running-jogging"],
    cues: [
      { text: "Front foot flat, back foot on bench (Bulgarian) or ground (split squat)", cueType: "verbal" },
      { text: "Lower straight down until front thigh is parallel", cueType: "verbal" },
      { text: "Keep your torso upright — don't lean forward", cueType: "verbal" },
      { text: "Push through the front heel to return to start", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Standard Split Squat",
        description: "Rear foot on ground. Lower H/Q ratio (0.69) but easier to balance.",
      },
      {
        name: "Bodyweight Only",
        description: "Master the pattern before adding external load.",
      },
    ],
    progressions: [
      {
        name: "Deficit Bulgarian Split Squat",
        description: "Front foot on a small plate for increased ROM.",
      },
      {
        name: "Loaded RFESS",
        description:
          "Add barbell or heavy dumbbells. Forces scale more than bilateral squat [Kipp 2022].",
      },
    ],
  },
  {
    slug: "copenhagen-adduction",
    name: "Copenhagen Adduction Exercise",
    description: "Side-lying with the top leg supported on a bench and the bottom leg hanging free. Lift the body by adducting the bottom leg up toward the bench, keeping the body straight without letting the hips sag, then lower slowly with control. A high-intensity adductor strengthening exercise that emphasizes the eccentric."son: 3x/week for 6-8 weeks. In-season: 1x/week for 28 weeks. Three progression levels. High volume (2x/week) produces 24% greater strength than 1x/week [Harøy 2019, Quintana-Cepedal 2024]",
    emgNotes:
      "Adductor longus 108% MVIC (highest of all adduction exercises). Ankle support: 1.54 Nm/kg hip adductor moment vs 0.93 knee support [Serner 2014, Dæhlin 2025]",
    evidenceLevel: "strong",
    difficulty: "advanced",
    equipment: ["bench"],
    bodyPosition: "sidelying",
    movementSlugs: ["hip-adduction"],
    muscleRoles: [
      {
        muscleSlug: "adductor-group",
        role: "primary",
        notes: "Adductor longus 108% MVIC — highest among all adduction exercises [Serner 2014]",
      },
      { muscleSlug: "gluteus-medius", role: "stabilizer", notes: "Top leg pelvic stability" },
      { muscleSlug: "external-oblique", role: "stabilizer", notes: "Lateral trunk stability during adduction" },
    ],
    functionalTaskSlugs: ["walking", "running-jogging"],
    cues: [
      { text: "Top leg rests on the bench, bottom leg hangs", cueType: "verbal" },
      { text: "Lift your body by adducting the bottom leg up to the bench", cueType: "verbal" },
      { text: "Keep your body straight — don't let hips sag", cueType: "verbal" },
      { text: "Lower slowly — the eccentric is important", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Knee Support",
        description:
          "Support top leg at knee instead of ankle. 66% reduction in adductor moment [Dæhlin 2025].",
      },
      {
        name: "Isometric Hold",
        description: "Both legs on bench, hold side plank position. Isometric adductor load.",
      },
    ],
    progressions: [
      {
        name: "Ankle Support",
        description: "Full-length lever arm — maximal difficulty (1.54 Nm/kg) [Dæhlin 2025].",
      },
      {
        name: "Tempo Copenhagen",
        description: "Slow 3-5 second eccentric for increased time under tension.",
      },
    ],
  },
  {
    slug: "nordic-hamstring-exercise",
    name: "Nordic Hamstring Exercise",
    description: "A kneeling eccentric hamstring exercise: with the ankles anchored, keep the hips extended and lower the body forward as slowly as possible using hamstring control, catching with the hands at the bottom before returning to the start."ogressive: start 1×5, build to 3×12 over 10 weeks. 1-2 sessions/week. Part of FIFA 11+ programs [Rudisill 2023, Ripley 2023]",
    emgNotes:
      "BF 64.5% MVIC, ST > BF > SM activation. Distal BF long head shows higher activation than proximal [Li 2023]. Fascicle length increase MD 0.90 cm [Rudisill 2023]",
    evidenceLevel: "strong",
    difficulty: "advanced",
    equipment: [],
    bodyPosition: "kneeling",
    notes:
      "Strongest evidence base among all hamstring prevention exercises. Compliance is critical — low adherence reduces effectiveness.",
    movementSlugs: ["knee-flexion"],
    muscleRoles: [
      {
        muscleSlug: "hamstrings",
        role: "primary",
        notes: "BF 64.5% MVIC — highest eccentric activation. ST preferentially recruited [Guruhan 2021]",
      },
      {
        muscleSlug: "gluteus-maximus",
        role: "stabilizer",
        notes: "Hip extension control — avoid hip flexion",
      },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Core bracing during eccentric lowering" },
    ],
    functionalTaskSlugs: ["running-jogging", "stair-climbing"],
    cues: [
      { text: "Kneel with ankles anchored by a partner or pad", cueType: "verbal" },
      { text: "Keep your hips extended — don't bend at the waist", cueType: "verbal" },
      { text: "Lower your body forward as slowly as possible", cueType: "verbal" },
      {
        text: "Use your hands to catch yourself at the bottom, then push back to start",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Band-Assisted Nordic",
        description:
          "Elastic band around chest attached overhead. Reduces effective body weight.",
      },
      {
        name: "Reduced ROM",
        description: "Lower only partway — stop at the angle you can still control.",
      },
    ],
    progressions: [
      {
        name: "Full Range Nordic",
        description: "Lower all the way to the floor with eccentric control.",
      },
      {
        name: "Weighted Nordic",
        description: "Hold a weight plate at chest. Increases eccentric demand.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 3: Advanced / Sport-Return
  // ═══════════════════════════════════════════════════════════════════════════

  {
    slug: "box-jump",
    name: "Box Jump (Bilateral)",
    description: "A bilateral jump from the floor up onto a box or raised platform, using an explosive arm swing and hip and knee extension to propel upward, then landing softly in a partial squat. Requires adequate lower-body strength and ankle mobility before progressing."  "3×5-8 reps, 2-3x/week for 8 weeks. Box height 20-40 cm rehab, 40-60 cm performance [Peng 2019]",
    emgNotes:
      "Sequential VL → glute max → soleus → gastroc activation. Trunk extensors and flexors show reciprocal activation for impact absorption [Iida 2012]",
    evidenceLevel: "moderate",
    difficulty: "advanced",
    equipment: ["plyo-box"],
    bodyPosition: "standing",
    movementSlugs: ["hip-extension", "knee-extension", "ankle-plantarflexion"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "Propulsion and landing deceleration" },
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "Hip extension during takeoff" },
      { muscleSlug: "gastrocnemius", role: "secondary", notes: "Ankle plantarflexion propulsion" },
      { muscleSlug: "soleus", role: "secondary", notes: "Ankle plantarflexion and landing absorption" },
      { muscleSlug: "rectus-abdominis", role: "stabilizer", notes: "Trunk control during landing [Iida 2012]" },
    ],
    functionalTaskSlugs: ["running-jogging", "stair-climbing"],
    cues: [
      { text: "Start in quarter-squat, swing arms, and explode upward", cueType: "verbal" },
      { text: "Land softly on the box with hips and knees bent", cueType: "verbal" },
      { text: "Stick the landing — no bouncing or stumbling", cueType: "verbal" },
      { text: "Step down — don't jump down (to reduce landing forces)", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Low Box Step-Up",
        description: "Step onto a lower box (15-20 cm) without jumping. Build confidence.",
      },
      {
        name: "Squat Jump",
        description:
          "Bodyweight squat jump without a box. Practice takeoff and landing mechanics.",
      },
    ],
    progressions: [
      {
        name: "Higher Box",
        description:
          "Increase box height in 5 cm increments as landing mechanics stay clean.",
      },
      {
        name: "Single-Leg Box Jump",
        description: "Advanced: single-leg takeoff to box. Requires >90% LSI.",
      },
    ],
  },
  {
    slug: "depth-jump",
    name: "Depth Jump (Drop Jump)",
    description: "Step off a box (don't jump off), land, and immediately explode upward into a vertical jump while minimizing ground contact time. Land softly with the knees tracking over the toes, avoiding knee valgus. A reactive plyometric drill that trains the stretch-shortening cycle.""1-2 sessions/week, 3×5 reps, 8 weeks. Drop height 75-100% of squat jump height [Yue 2025, Sotiropoulos 2023]",
    emgNotes:
      "GRF 4.93-5.39 BW. VL-BF, VM-BF, and RF-BF coactivation increases with height (ES 0.45-0.90) [Di Giminiani 2020]",
    evidenceLevel: "moderate",
    difficulty: "advanced",
    equipment: ["plyo-box"],
    bodyPosition: "standing",
    notes:
      "Late-stage exercise (>6 months post-ACLR). Contraindicated: active knee effusion, quad LSI <80%, poor landing mechanics.",
    movementSlugs: ["hip-extension", "knee-extension", "ankle-plantarflexion"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "Eccentric absorption and concentric propulsion" },
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "Hip extension power" },
      { muscleSlug: "gastrocnemius", role: "secondary", notes: "SSC ankle power" },
      {
        muscleSlug: "hamstrings",
        role: "stabilizer",
        notes: "Co-contraction increases with drop height [Di Giminiani 2020]",
      },
    ],
    functionalTaskSlugs: ["running-jogging"],
    cues: [
      { text: "Step off the box — don't jump off", cueType: "verbal" },
      {
        text: "Land and immediately explode upward — minimize ground contact time (<250ms)",
        cueType: "verbal",
      },
      { text: "Land softly with knees over toes — avoid knee valgus", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Box Jump",
        description: "Jump up onto a box rather than dropping off. Lower landing forces.",
      },
      {
        name: "Low Drop Height",
        description: "Start at 20 cm drop height. Progress only when landing is controlled.",
      },
    ],
    progressions: [
      {
        name: "Increased Drop Height",
        description: "Progress to 100-125% of CMJ height [Yue 2025].",
      },
      {
        name: "Directional Depth Jump",
        description: "Drop jump followed by lateral or forward bound.",
      },
    ],
  },
  {
    slug: "lateral-bounds",
    name: "Lateral Bounds (Single-Leg)",
    description: "Single-leg lateral hops, push off sideways from one leg and stick the landing on the opposite leg, training frontal-plane power and dynamic stability. Emphasizes controlled landings without knee valgus collapse, which is key for ACL injury prevention."6-10 reps per leg, 2x/week. Progress distance, height, and direction changes [Wong 2012]",
    emgNotes:
      "Peak forces 3.31 BW, RFD 0.94 BW/s [Wong 2012]. Glute med critical for frontal plane control [Maniar 2022]",
    evidenceLevel: "moderate",
    difficulty: "advanced",
    equipment: [],
    bodyPosition: "standing",
    movementSlugs: ["hip-abduction", "hip-adduction", "knee-extension", "ankle-plantarflexion"],
    muscleRoles: [
      {
        muscleSlug: "gluteus-medius",
        role: "primary",
        notes: "Frontal plane control — resists knee valgus [Maniar 2022]",
      },
      { muscleSlug: "quadriceps", role: "primary", notes: "Landing deceleration" },
      {
        muscleSlug: "gluteus-maximus",
        role: "secondary",
        notes: "Hip extension and landing absorption",
      },
      { muscleSlug: "soleus", role: "secondary", notes: "Ankle stability and force absorption [Maniar 2022]" },
    ],
    functionalTaskSlugs: ["running-jogging", "single-leg-balance"],
    cues: [
      { text: "Push off laterally from one leg, land on the opposite", cueType: "verbal" },
      { text: "Stick each landing — knee over toe, no valgus collapse", cueType: "verbal" },
      { text: "Use your arms for momentum and balance", cueType: "verbal" },
      { text: "Start with shorter distances, progress wider", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Lateral Step-Over",
        description: "Step laterally over a low cone. No jumping component.",
      },
      {
        name: "Lateral Shuffle",
        description: "Controlled sideways shuffling before progressing to bounds.",
      },
    ],
    progressions: [
      {
        name: "Lateral Bound to Stick",
        description: "Bound and hold single-leg balance for 3 seconds.",
      },
      {
        name: "Lateral Bound with Directional Change",
        description: "Bound laterally then immediately change direction.",
      },
    ],
  },
  {
    slug: "power-clean",
    name: "Power Clean (Hang Variation)",
    description: "Explosive triple extension of the ankles, knees, and hips to pull a barbell from the hang position (bar at mid-thigh) into a front-rack catch. A high-power Olympic-lift variation demanding technical proficiency in hang pulls and front squats."-5 reps at 70-90% 1RM, 2-3x/week. Heavier loads (≥70% 1RM) optimize peak power [Soriano 2015]",
    emgNotes:
      "RFD 17,254 N/s (vs CMJ 3,836 N/s). Peak power 3,566W, peak force 2,814N at 60% 1RM [Comfort 2011, MacKenzie 2014]",
    evidenceLevel: "moderate",
    difficulty: "advanced",
    equipment: ["barbell"],
    bodyPosition: "standing",
    notes:
      "Primarily athletic performance, not rehabilitation. Requires squat 1.5x BW, deadlift 2x BW, and front squat proficiency as prerequisites.",
    movementSlugs: ["hip-extension", "knee-extension", "ankle-plantarflexion", "shoulder-flexion"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "Triple extension — knee extension" },
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "Explosive hip extension" },
      { muscleSlug: "hamstrings", role: "secondary", notes: "Hip extension assistance" },
      { muscleSlug: "trapezius-upper", role: "secondary", notes: "Bar acceleration and shrug" },
      { muscleSlug: "erector-spinae", role: "stabilizer", notes: "Trunk rigidity during pull" },
      {
        muscleSlug: "gastrocnemius",
        role: "synergist",
        notes: "Ankle plantarflexion — triple extension",
      },
    ],
    functionalTaskSlugs: ["carrying-lifting", "running-jogging"],
    cues: [
      { text: "Start at hang position — bar at mid-thigh, slight knee bend", cueType: "verbal" },
      { text: "Explode: extend ankles, knees, and hips simultaneously", cueType: "verbal" },
      { text: "Shrug and pull — high elbows, keep bar close", cueType: "verbal" },
      { text: "Catch in front rack position with elbows high", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Hang High Pull",
        description: "Pull to chest level without catching. Builds explosive pattern.",
      },
      {
        name: "Kettlebell Clean",
        description: "Single-arm clean with KB. Simpler catch mechanics.",
      },
    ],
    progressions: [
      {
        name: "Power Clean from Floor",
        description: "Full pull from the floor. Requires more technical proficiency.",
      },
      {
        name: "Hang Clean to Front Squat",
        description: "Catch in a deep front squat position. Full Olympic lift pattern.",
      },
    ],
  },
  {
    slug: "overhead-squat",
    name: "Overhead Squat (Assessment & Training)",
    description: "Full squat performed with the arms extended overhead holding a barbell or dowel, requiring good ankle, hip, thoracic, and shoulder mobility to keep the bar over the midfoot. Used primarily as a whole-body movement screen."th light load (PVC pipe to 20% 1RM). Primarily assessment — not heavy training [Aspe 2014]",
    emgNotes:
      "RA and EO 2-7% higher than back squat during eccentric phase. Lower erector spinae and lower-body activity during concentric [Aspe 2014]",
    evidenceLevel: "moderate",
    difficulty: "advanced",
    equipment: ["barbell"],
    bodyPosition: "standing",
    notes:
      "Common compensations indicate mobility restrictions: forward trunk lean (thoracic), heel rise (ankle DF <36°), arm drift forward (shoulder mobility) [Rabin 2017]",
    movementSlugs: [
      "hip-flexion",
      "hip-extension",
      "knee-flexion",
      "knee-extension",
      "ankle-dorsiflexion",
      "shoulder-flexion",
    ],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "Squat component" },
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "Hip extension from depth" },
      { muscleSlug: "rectus-abdominis", role: "secondary", notes: "2-7% higher than back squat [Aspe 2014]" },
      {
        muscleSlug: "external-oblique",
        role: "secondary",
        notes: "Trunk anti-extension demand [Aspe 2014]",
      },
      { muscleSlug: "supraspinatus", role: "stabilizer", notes: "Overhead position stability" },
      {
        muscleSlug: "serratus-anterior",
        role: "stabilizer",
        notes: "Scapular upward rotation for overhead hold",
      },
    ],
    functionalTaskSlugs: ["overhead-work", "squat-to-stand"],
    cues: [
      { text: "Hold the bar overhead with wide grip — arms locked, biceps by ears", cueType: "verbal" },
      {
        text: "Squat down keeping arms directly overhead — don't let them drift forward",
        cueType: "verbal",
      },
      { text: "Heels flat, knees tracking over toes", cueType: "verbal" },
      {
        text: "If you can't keep arms overhead, work on thoracic and shoulder mobility first",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Dowel Overhead Squat",
        description: "Use a PVC pipe or dowel. Zero load — focus on position.",
      },
      {
        name: "Wall-Assisted Overhead Squat",
        description:
          "Face a wall with toes 6 inches away. The wall prevents forward lean.",
      },
    ],
    progressions: [
      {
        name: "Barbell Overhead Squat",
        description:
          "Add progressive barbell loading once full depth with correct form.",
      },
      {
        name: "Snatch Grip Overhead Squat",
        description: "Wide snatch grip — transfers to Olympic lifting.",
      },
    ],
  },
  {
    slug: "landmine-press",
    name: "Landmine Press",
    description: "Pressing a barbell anchored at one end, following an arced (diagonal) bar path rather than straight overhead. The arc keeps the press out of the shoulder impingement range, which may suit athletes who cannot tolerate vertical pressing; the standing position also challenges core and lower-body stability.": "3-4×8-12 reps at 60-80% estimated 1RM, 2-3x/week",
    evidenceLevel: "limited",
    difficulty: "intermediate",
    equipment: ["barbell", "landmine-attachment"],
    bodyPosition: "standing",
    notes:
      "Direct comparative studies to overhead press are lacking. Theoretically more shoulder-friendly due to arced bar path [Coratella 2022].",
    movementSlugs: ["shoulder-flexion", "elbow-extension", "scapular-upward-rotation"],
    muscleRoles: [
      { muscleSlug: "anterior-deltoid", role: "primary", notes: "Pressing through arc" },
      { muscleSlug: "serratus-anterior", role: "secondary", notes: "Scapular upward rotation during press" },
      { muscleSlug: "triceps-brachii", role: "secondary", notes: "Elbow extension component" },
      { muscleSlug: "trapezius-upper", role: "stabilizer", notes: "Scapular stability" },
      {
        muscleSlug: "transversus-abdominis",
        role: "stabilizer",
        notes: "Anti-extension core demand in standing",
      },
    ],
    functionalTaskSlugs: ["reaching-overhead", "overhead-work"],
    cues: [
      {
        text: "Stand at the end of the barbell, hold with one or both hands at shoulder",
        cueType: "verbal",
      },
      { text: "Press forward and up in an arc — don't try to go straight vertical", cueType: "verbal" },
      { text: "Keep your core braced — don't arch your back", cueType: "verbal" },
      { text: "Control the return — 2-3 seconds down", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Half-Kneeling Landmine Press",
        description:
          "Kneel on inside knee for more stability. Reduces balance demand.",
      },
      {
        name: "Two-Hand Landmine Press",
        description: "Use both hands for easier control and lower unilateral demand.",
      },
    ],
    progressions: [
      {
        name: "Single-Arm Landmine Press",
        description: "One arm for increased unilateral shoulder and core demand.",
      },
      {
        name: "Landmine Press with Rotation",
        description: "Add a rotational pivot during the press for rotational power.",
      },
    ],
  },
  {
    slug: "a-skip-b-skip",
    name: "A-Skip / B-Skip Running Drills",
    description:
      "High-knee running drills for running mechanics and sprint performance. A-skip emphasizes hip flexion power with rapid ground contact. B-skip adds active hamstring 'paw-back' extension. Typically introduced in mid-stage running rehabilitation after pain-free jogging.",
    confidence: 0.75,
    dosing: "2-3×20-30 meters, 2-3x/week as warm-up or technical drill",
    evidenceLevel: "limited",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "standing",
    movementSlugs: ["hip-flexion", "hip-extension", "knee-flexion", "ankle-plantarflexion"],
    muscleRoles: [
      { muscleSlug: "iliopsoas", role: "primary", notes: "Hip flexion power — knee drive" },
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "B-skip: active hip extension 'paw-back'" },
      {
        muscleSlug: "hamstrings",
        role: "secondary",
        notes: "B-skip: knee extension to hip extension transition",
      },
      { muscleSlug: "gastrocnemius", role: "secondary", notes: "Ground contact plantarflexion" },
      { muscleSlug: "soleus", role: "stabilizer", notes: "Ankle stability during rapid ground contact" },
    ],
    functionalTaskSlugs: ["running-jogging"],
    cues: [
      { text: "A-skip: drive knee up to hip height with each skip", cueType: "verbal" },
      {
        text: "B-skip: drive knee up, then actively extend the leg forward and pull it back to the ground",
        cueType: "verbal",
      },
      { text: "Toe up, knee up, heel under hip — quick off the ground", cueType: "verbal" },
      { text: "Tall posture — don't lean back", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Marching",
        description: "Walk through the A-skip pattern. Knee drive without the hop.",
      },
      {
        name: "A-Skip in Place",
        description: "Perform stationary before moving forward.",
      },
    ],
    progressions: [
      {
        name: "Fast A-Skip",
        description: "Increase speed while maintaining form.",
      },
      {
        name: "B-Skip for Distance",
        description: "Focus on active hamstring engagement and stride length.",
      },
    ],
  },
  {
    slug: "single-leg-hop-tests",
    name: "Single-Leg Hop Tests (Return-to-Sport Battery)",
    description: "A standardized single-leg hop battery used in return-to-sport testing: single hop for distance, triple hop, crossover hop, and a timed hop over a set distance. Hop on one leg and stick each landing, comparing the injured and uninjured legs for symmetry." leg, best trial recorded. Training: 3×5 reps per leg, 2x/week. Return at ≥90% LSI [West 2023]",
    emgNotes:
      "During single-leg landing: vasti, soleus, glute max, and glute med produce greatest forces [Maniar 2022]. Crossover hop and 6m timed hop strongest predictors of 1-year function [Logerstedt 2012]",
    evidenceLevel: "strong",
    difficulty: "advanced",
    equipment: [],
    bodyPosition: "standing",
    notes:
      "LSI alone may be insufficient — 79-84% of athletes meet 90% LSI but only 12-30% meet age-relevant targets [Schmitt 2022]. Distance masks knee function asymmetry [Kotsifaki 2022].",
    movementSlugs: ["hip-extension", "knee-extension", "ankle-plantarflexion"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "Propulsion and landing deceleration" },
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "Hip extension power" },
      {
        muscleSlug: "gluteus-medius",
        role: "secondary",
        notes: "Frontal plane control during single-leg landing",
      },
      { muscleSlug: "gastrocnemius", role: "secondary", notes: "Ankle power and landing absorption" },
      { muscleSlug: "soleus", role: "stabilizer", notes: "Postural ankle stability [Maniar 2022]" },
    ],
    functionalTaskSlugs: ["running-jogging", "single-leg-balance"],
    cues: [
      {
        text: "Single hop: stand on one leg, jump as far as possible, stick the landing",
        cueType: "verbal",
      },
      {
        text: "Triple hop: three consecutive hops on same leg for maximum total distance",
        cueType: "verbal",
      },
      { text: "Crossover hop: hop 3 times while crossing over a line", cueType: "verbal" },
      { text: "6m timed hop: hop as fast as possible over 6 meters", cueType: "verbal" },
      { text: "Hold each landing for 2 seconds before it counts", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Double-Leg Hop",
        description: "Practice bilateral hopping before single-leg.",
      },
      {
        name: "Short-Distance Single Hop",
        description: "Hop for 50% max distance to build confidence and control.",
      },
    ],
    progressions: [
      {
        name: "Repeated Hop Tests",
        description:
          "Perform tests with 30-second rest between trials to add fatigue component.",
      },
      {
        name: "Sport-Specific Hop Combinations",
        description: "Combine hops with cutting or direction changes.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 4: Mobility & Flexibility
  // ═══════════════════════════════════════════════════════════════════════════

  {
    slug: "ninety-ninety-hip-stretch",
    name: "90/90 Hip Stretch (Shinbox)",
    description: "A seated 'shinbox' stretch with both hips bent to 90°, the front leg in external rotation and the back leg in internal rotation, targeting the hip capsule, gluteals, and deep rotators. Sit tall and lean gently over the front hip, then sweep both legs across to switch to the opposite side." 30-60 seconds per side, 5-7 days/week, ≥5 minutes total weekly [Thomas 2018]",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "seated",
    movementSlugs: ["hip-external-rotation", "hip-internal-rotation"],
    muscleRoles: [
      { muscleSlug: "piriformis", role: "primary", notes: "Stretched in ER position" },
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "Posterior hip stretch" },
      { muscleSlug: "gluteus-medius", role: "secondary", notes: "IR position — anterior fibers stretched" },
      { muscleSlug: "gluteus-minimus", role: "secondary", notes: "Contributes to rotation limitation" },
    ],
    functionalTaskSlugs: ["floor-transfers", "dressing-lower-body"],
    cues: [
      { text: "Sit with front shin parallel to your chest, back shin parallel to your side", cueType: "verbal" },
      {
        text: "Both knees at 90° — front hip in external rotation, back in internal",
        cueType: "verbal",
      },
      { text: "Sit tall and lean gently into the front hip", cueType: "verbal" },
      {
        text: "Rotate sides by sweeping both legs to the opposite 90/90 position",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Figure-4 Stretch",
        description:
          "Supine with ankle crossed over opposite knee. Simpler hip ER stretch.",
      },
    ],
    progressions: [
      {
        name: "90/90 with Forward Lean",
        description: "Lean torso forward over the front shin for deeper hip ER stretch.",
      },
    ],
  },
  {
    slug: "pigeon-stretch",
    name: "Pigeon Stretch (Modified)",
    description: "Modified pigeon pose with the front leg bent across the body and the back leg extended straight behind, hips squared toward the floor. Stretches the piriformis, obturator internus, gluteus maximus, and posterior hip capsule."nds per side, daily for 4-6 weeks [Gulledge 2014]",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "prone",
    movementSlugs: ["hip-external-rotation", "hip-flexion"],
    muscleRoles: [
      { muscleSlug: "piriformis", role: "primary", notes: "12-15% elongation in stretch position [Gulledge 2014]" },
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "Posterior hip capsule stretch" },
      { muscleSlug: "obturator-internus", role: "secondary", notes: "Deep external rotator stretched" },
    ],
    functionalTaskSlugs: ["floor-transfers", "dressing-lower-body"],
    cues: [
      {
        text: "Bring your front shin across your body — the more parallel to your chest, the deeper the stretch",
        cueType: "verbal",
      },
      { text: "Keep your back leg extended straight behind you", cueType: "verbal" },
      { text: "Square your hips toward the floor", cueType: "verbal" },
      {
        text: "If you feel it in the front of your hip, use the supine figure-4 instead",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Supine Figure-4 Stretch",
        description:
          "Lie on back with ankle on opposite knee. Pull bottom knee to chest. Less impingement risk.",
      },
    ],
    progressions: [
      {
        name: "Full Pigeon with Forward Fold",
        description: "Lean torso forward over the front shin for deeper posterior hip stretch.",
      },
    ],
  },
  {
    slug: "couch-stretch",
    name: "Couch Stretch (Rectus Femoris / Hip Flexor)",
    description: "Half-kneeling with the rear foot elevated against a wall or couch, combining hip extension with knee flexion to stretch the biarticular rectus femoris. Tuck the tailbone under into a posterior pelvic tilt first, then lean to feel the stretch across the front of the hip and thigh, without arching the low back."-3 sets, 3-5 days/week [Konrad 2021]",
    emgNotes:
      "Posterior pelvic tilt stretching: 4.85 N·m greater reactive hip flexor force reduction vs standard [González-de-la-Flor 2024]",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "half-kneeling",
    movementSlugs: ["hip-extension", "knee-flexion"],
    muscleRoles: [
      {
        muscleSlug: "rectus-femoris",
        role: "primary",
        notes: "Biarticular — maximally stretched with hip extension + knee flexion",
      },
      { muscleSlug: "iliopsoas", role: "primary", notes: "Hip flexor stretch in extension" },
      { muscleSlug: "quadriceps", role: "secondary", notes: "Knee flexion component stretches vasti" },
    ],
    functionalTaskSlugs: ["walking", "running-jogging", "stair-climbing"],
    cues: [
      { text: "Kneel with your back foot up against the wall or couch", cueType: "verbal" },
      { text: "Tuck your tailbone under FIRST — posterior pelvic tilt", cueType: "verbal" },
      {
        text: "Then gently lean back or shift forward — the stretch is in the front of the hip and thigh",
        cueType: "verbal",
      },
      { text: "Don't arch your lower back — that cheats the stretch", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Standard Half-Kneeling Hip Flexor Stretch",
        description: "Without rear foot elevation. Less rectus femoris bias.",
      },
    ],
    progressions: [
      {
        name: "Elevated Couch Stretch with Reach",
        description:
          "Raise the same-side arm overhead while in stretch. Adds lateral chain and psoas emphasis.",
      },
    ],
  },
  {
    slug: "banded-ankle-df-mobilization",
    name: "Banded Ankle Dorsiflexion Mobilization",
    description: "Standing lunge with a resistance band looped around the distal tibia and anchored behind, pulling the tibia posteriorly while the knee drives forward over the toes. Facilitates a posterior talar glide to improve ankle dorsiflexion."er ankle, daily. 6 sessions of manual therapy needed for significant strength/balance/function improvements [Martin 2021]",
    emgNotes:
      "Mechanism: posterior talar glide increases joint space and reduces mechanical restriction. Short-term ROM improvements documented [Vallandingham 2019]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "standing",
    movementSlugs: ["ankle-dorsiflexion"],
    muscleRoles: [
      { muscleSlug: "tibialis-anterior", role: "primary", notes: "Active DF during mobilization" },
      { muscleSlug: "gastrocnemius", role: "primary", notes: "Target tissue being mobilized/stretched" },
      { muscleSlug: "soleus", role: "primary", notes: "Stretched during weight-bearing DF" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing", "running-jogging"],
    cues: [
      {
        text: "Loop a heavy band around your ankle, anchored behind you at floor level",
        cueType: "verbal",
      },
      { text: "Step forward into a lunge, driving your knee over your toes", cueType: "verbal" },
      {
        text: "The band pulls your tibia forward — resist slightly as you mobilize",
        cueType: "verbal",
      },
      { text: "Keep your heel flat on the ground throughout", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Wall Ankle Mobilization",
        description:
          "Without band: lunge toward a wall, driving knee forward. Measure distance from toes to wall.",
      },
    ],
    progressions: [
      {
        name: "Elevated Surface DF Mobilization",
        description: "Front foot on a small step for greater DF range.",
      },
    ],
  },
  {
    slug: "thoracic-foam-rolling",
    name: "Thoracic Spine Foam Rolling",
    description: "Lie supine with a foam roller across the mid-thoracic spine, arms crossed or overhead, and extend segmentally back over the roller to mobilize the thoracic spine into extension."sets of 30-120 seconds total, 2-4 second rep frequency. >4 weeks training for ROM gains [Konrad 2022]",
    emgNotes:
      "ROM effects SMD 0.74 (95% CI 0.42-1.01) vs no exercise [Wilke 2020]. No structural changes — mechanism is increased stretch tolerance and decreased stiffness [Konrad 2022]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["foam-roller"],
    bodyPosition: "supine",
    movementSlugs: ["thoracic-extension"],
    muscleRoles: [
      { muscleSlug: "erector-spinae", role: "primary", notes: "Thoracic extensors — target tissue being mobilized" },
      { muscleSlug: "multifidus", role: "secondary", notes: "Segmental mobility improvement" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "reaching-overhead"],
    cues: [
      { text: "Place the roller at mid-back level, cross arms over chest", cueType: "verbal" },
      { text: "Gently extend backward over the roller", cueType: "verbal" },
      { text: "Move the roller one segment at a time — don't just roll up and down", cueType: "verbal" },
      { text: "Spend 30-60 seconds at each stiff segment", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Towel Roll Extension",
        description: "Use a rolled towel for less aggressive mobilization.",
      },
    ],
    progressions: [
      {
        name: "Arms Overhead",
        description:
          "Extend over roller with arms reaching overhead. Increases thoracic extension demand.",
      },
    ],
  },
  {
    slug: "open-book-stretch",
    name: "Open Book Stretch (Thoracic Rotation)",
    description: "Lie on your side with hips and knees stacked and bent, then rotate your top arm and upper back open toward the ceiling while keeping the pelvis still. Emphasizes thoracic rotation mobility with a stable pelvis."onds per side, 5-7 days/week [Thomas 2018]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "sidelying",
    movementSlugs: ["thoracic-rotation"],
    muscleRoles: [
      { muscleSlug: "internal-oblique", role: "primary", notes: "Ipsilateral rotation" },
      {
        muscleSlug: "external-oblique",
        role: "primary",
        notes: "Contralateral rotation being stretched",
      },
      { muscleSlug: "erector-spinae", role: "stabilizer", notes: "Trunk stabilization during rotation" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "bed-mobility"],
    cues: [
      { text: "Lie on your side with knees stacked at 90°", cueType: "verbal" },
      { text: "Reach your top arm open toward the ceiling and behind you", cueType: "verbal" },
      {
        text: "Follow your hand with your eyes — let the rotation come from mid-back",
        cueType: "verbal",
      },
      { text: "Keep your knees together and hips stacked — don't let them roll", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Supine Trunk Rotation",
        description:
          "Lie on back, knees bent, drop both knees side to side. Gravity-assisted.",
      },
    ],
    progressions: [
      {
        name: "Open Book with Reach-Through",
        description: "Thread the top arm under your body before opening. Adds flexion-rotation.",
      },
    ],
  },
  {
    slug: "sleeper-stretch",
    name: "Sleeper Stretch (Posterior Shoulder)",
    description: "Lying on the side of the shoulder being stretched with the shoulder and elbow both bent to a right angle, use the other hand to gently rotate the forearm toward the floor. Stretches the posterior shoulder to improve internal rotation range. Stop at a mild stretch and never force through sharp pain."ds, daily for 4-6 weeks [Maenhout 2012, Iida 2025]",
    emgNotes:
      "IR improvement: 13.5° ± 0.8° over 6 weeks [Maenhout 2012]. Meta-analysis: IR ROM MD 7° (95% CI 1-13°) [Iida 2025]. Decreases infraspinatus stiffness [Yamauchi 2016]",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "sidelying",
    movementSlugs: ["shoulder-internal-rotation"],
    muscleRoles: [
      { muscleSlug: "infraspinatus", role: "primary", notes: "Posterior rotator cuff being stretched" },
      { muscleSlug: "teres-minor", role: "primary", notes: "Posterior shoulder stretch" },
      { muscleSlug: "posterior-deltoid", role: "secondary", notes: "Partially stretched" },
    ],
    functionalTaskSlugs: ["reaching-overhead", "dressing-upper-body"],
    cues: [
      { text: "Lie on the shoulder you want to stretch", cueType: "verbal" },
      { text: "Shoulder and elbow both at 90°", cueType: "verbal" },
      { text: "Use your other hand to gently push your forearm toward the floor", cueType: "verbal" },
      { text: "Stop at mild stretch — never force through sharp pain", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Supine Cross-Body Stretch",
        description: "Lie on back, pull arm across body. Less shoulder compression.",
      },
    ],
    progressions: [
      {
        name: "Sleeper Stretch with Stabilization",
        description:
          "Partner stabilizes the scapula for more targeted posterior capsule stretch.",
      },
    ],
  },
  {
    slug: "cross-body-shoulder-stretch",
    name: "Cross-Body Shoulder Stretch (Horizontal Adduction)",
    description: "Standing or seated, pull the arm across the body at chest height with the opposite hand, keeping the arm straight and the shoulder relaxed (no shrug). Stretches the posterior shoulder capsule, felt in the back of the shoulder."aily for 4 weeks [de Araújo 2026]",
    emgNotes:
      "GIRD reduction 14.77° (95% CI -19.70 to -9.84). Modified version: 89.52% IR ROM increase in tennis players [D 2023]",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    movementSlugs: ["shoulder-adduction", "shoulder-horizontal-adduction"],
    muscleRoles: [
      { muscleSlug: "posterior-deltoid", role: "primary", notes: "Primary tissue being stretched" },
      { muscleSlug: "infraspinatus", role: "primary", notes: "Posterior rotator cuff stretch" },
      { muscleSlug: "teres-minor", role: "secondary", notes: "Posterior shoulder stretch" },
    ],
    functionalTaskSlugs: ["reaching-overhead", "dressing-upper-body"],
    cues: [
      { text: "Pull your arm across your body at chest height with the other hand", cueType: "verbal" },
      { text: "Keep the arm straight, shoulder relaxed — don't shrug", cueType: "verbal" },
      { text: "Feel the stretch in the back of the shoulder", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Wall-Assisted Cross-Body",
        description:
          "Stand sideways to a wall, let the wall assist horizontal adduction.",
      },
    ],
    progressions: [
      {
        name: "Cross-Body with Dorsal Glide",
        description:
          "Combine with a posterior glide mobilization for additional 6° IR and 10° HA improvement [Kang 2020].",
      },
    ],
  },
  {
    slug: "doorway-pec-stretch",
    name: "Doorway Pectoralis Stretch",
    description: "Standing in a doorway with the forearm resting on the frame, step through and lean forward gently to stretch the pectoralis, keeping the core braced without arching the back. Raising or lowering the arm on the frame shifts the stretch between the upper, middle, and lower portions of the pec." reps of 30-60 seconds at each arm position (45°, 90°, 135°), 4+ days/week [Wohlann 2024]",
    emgNotes:
      "Sternocostal region shows greater slack stiffness than abdominal [Wolfram 2023]. 8 weeks stretching: comparable to resistance training for ROM/strength/thickness [Wohlann 2024]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    movementSlugs: ["shoulder-external-rotation", "shoulder-abduction"],
    muscleRoles: [
      {
        muscleSlug: "pectoralis-major",
        role: "primary",
        notes: "Target muscle — clavicular, sternal, and abdominal portions",
      },
      {
        muscleSlug: "anterior-deltoid",
        role: "secondary",
        notes: "Anterior shoulder stretch at higher arm positions",
      },
    ],
    functionalTaskSlugs: ["posture-maintenance", "dressing-upper-body"],
    cues: [
      { text: "Place forearm on door frame at the height matching your target", cueType: "verbal" },
      { text: "45° for upper chest, 90° for middle, 135° for lower", cueType: "verbal" },
      { text: "Step through the doorway and lean forward gently", cueType: "verbal" },
      { text: "Keep your core braced — don't arch your back", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Wall Corner Stretch",
        description:
          "Stand in a corner with both arms on walls at 90°. Bilateral stretch with more support.",
      },
    ],
    progressions: [
      {
        name: "Single-Arm with Rotation",
        description:
          "Add trunk rotation away from the stretching arm for increased pectoralis lengthening.",
      },
    ],
  },
  {
    slug: "median-nerve-glide",
    name: "Median Nerve Glide",
    description: "A neurodynamic mobilization for the median nerve using a sequence of shoulder abduction, elbow extension, wrist and finger extension, then cervical lateral flexion away from the arm. Move gently through the sequence to glide the nerve, easing off if tingling worsens."    "5-10 reps of sequence, 3-5x daily for 6-12 weeks. Combine with nighttime neutral wrist splinting [Zaheer 2023, Ijaz 2022]",
    emgNotes:
      "CTS symptom severity MD -1.20 (95% CI -1.72 to -0.67), functional severity MD -1.06 (95% CI -1.53 to -0.60) [Zaheer 2023]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    movementSlugs: ["wrist-extension", "finger-extension", "shoulder-abduction"],
    muscleRoles: [
      {
        muscleSlug: "flexor-digitorum-superficialis",
        role: "stabilizer",
        notes: "Nerve gliding through carpal tunnel region",
      },
      {
        muscleSlug: "extensor-digitorum",
        role: "primary",
        notes: "Active wrist and finger extension during tensioning",
      },
      { muscleSlug: "anterior-deltoid", role: "stabilizer", notes: "Shoulder positioning during sequence" },
    ],
    functionalTaskSlugs: ["typing", "gripping-cup"],
    cues: [
      { text: "Start with a fist at your shoulder", cueType: "verbal" },
      { text: "Slowly extend your elbow, then wrist, then fingers in sequence", cueType: "verbal" },
      { text: "Tilt your head away from the stretching arm at the end", cueType: "verbal" },
      { text: "You should feel a gentle nerve stretch — stop if tingling worsens", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Single-Joint Glide",
        description:
          "Move only wrist or only elbow — not the full sequence. Less neural tension.",
      },
    ],
    progressions: [
      {
        name: "Full Sequence with Hold",
        description:
          "Hold end-range position for 5-10 seconds for increased neural tensioning.",
      },
    ],
  },
  {
    slug: "ulnar-nerve-glide",
    name: "Ulnar Nerve Glide",
    description: "A sequence of joint movements that tension and glide the ulnar nerve, shoulder abduction, elbow flexion, wrist extension, and cervical lateral flexion, used for ulnar neuropathy at the elbow (cubital tunnel). Move gently and avoid reproducing tingling in the ring and little fingers."5-10 reps of sequence, 2-3x daily for 6-8 weeks. Combine with elbow positioning education [Svernlöv 2009]",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    notes:
      "Very low-certainty evidence. Patient education about avoiding provocative positions may be equally effective [Svernlöv 2009, Caliandro 2025].",
    movementSlugs: ["wrist-extension", "elbow-flexion", "shoulder-abduction"],
    muscleRoles: [
      { muscleSlug: "extensor-digitorum", role: "primary", notes: "Active wrist extension during tensioning" },
      {
        muscleSlug: "flexor-carpi-ulnaris",
        role: "stabilizer",
        notes: "Ulnar nerve passes through FCU — involved in gliding",
      },
    ],
    functionalTaskSlugs: ["typing"],
    cues: [
      { text: "Start with arm relaxed at side", cueType: "verbal" },
      { text: "Bend your elbow, extend your wrist, then spread your fingers", cueType: "verbal" },
      { text: "Abduct your shoulder while maintaining the positions", cueType: "verbal" },
      {
        text: "Gentle stretch only — avoid reproducing tingling in ring and pinky fingers",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Elbow Positioning Only",
        description:
          "Focus on avoiding sustained elbow flexion >90°. Education-based approach.",
      },
    ],
    progressions: [
      {
        name: "Full Neural Tension Sequence",
        description:
          "Add cervical lateral flexion away and shoulder depression for maximum nerve excursion.",
      },
    ],
  },
  {
    slug: "radial-nerve-glide",
    name: "Radial Nerve Glide",
    description: "Sequential movements that mobilize the radial nerve: shoulder depression → elbow extension → forearm pronation → wrist flexion. Addresses the neural component of lateral elbow pain, producing a gentle stretch along the back of the forearm."   "5-10 reps of sequence, 2x/week for 6 weeks. Combine with conservative lateral elbow rehab [Yilmaz 2022]",
    emgNotes:
      "Pain reduction: rest ES=0.84, night ES=0.91, activity ES=1.06 in lateral epicondylitis [Yilmaz 2022]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    movementSlugs: ["wrist-flexion", "forearm-pronation"],
    muscleRoles: [
      {
        muscleSlug: "extensor-carpi-radialis-longus",
        role: "stabilizer",
        notes: "Radial nerve passes near ECRL — involved in tension",
      },
      {
        muscleSlug: "supinator",
        role: "stabilizer",
        notes: "Radial nerve passes through supinator — key tension point",
      },
    ],
    functionalTaskSlugs: ["typing", "gripping-cup"],
    cues: [
      {
        text: "Depress your shoulder, straighten your elbow, turn palm down, then flex your wrist",
        cueType: "verbal",
      },
      { text: "Move slowly through the sequence — 3-5 seconds per step", cueType: "verbal" },
      { text: "You should feel a gentle stretch along the back of your forearm", cueType: "verbal" },
      { text: "Stop if you feel sharp pain or shooting sensations", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Wrist Flexion Only",
        description:
          "Single-joint approach: just wrist flexion with pronation. Less neural tension.",
      },
    ],
    progressions: [
      {
        name: "Full Sequence with Lateral Flexion",
        description:
          "Add cervical lateral flexion away for maximum radial nerve excursion.",
      },
    ],
  },
  // ── Batch 2 literature review: Additional Exercises ────────────────────────────
  {
    slug: "turkish-get-up",
    name: "Turkish Get-Up",
    description: "Multi-phase exercise transitioning from supine to standing while holding a weight locked out overhead, progressing through roll, bridge, sweep, lunge, and stand, then reversing back to the floor.": "3-5 reps per side with moderate load (8-12 kg KB)",
    evidenceLevel: "limited",
    difficulty: "advanced",
    equipment: ["kettlebell"],
    bodyPosition: "supine",
    notes:
      "No published RCTs. Closed-chain phases produce greater shoulder stabilizer activation [Pozzi 2022].",
    movementSlugs: [
      "hip-extension",
      "shoulder-flexion",
      "thoracic-rotation",
      "knee-extension",
    ],
    muscleRoles: [
      {
        muscleSlug: "infraspinatus",
        role: "primary",
        notes: "Overhead shoulder stabilization [Pozzi 2022]",
      },
      {
        muscleSlug: "anterior-deltoid",
        role: "primary",
        notes: "Overhead maintenance",
      },
      {
        muscleSlug: "gluteus-maximus",
        role: "secondary",
        notes: "Bridge and lunge phases",
      },
      {
        muscleSlug: "external-oblique",
        role: "secondary",
        notes: "Rotational transitions",
      },
      { muscleSlug: "erector-spinae", role: "stabilizer" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer" },
    ],
    functionalTaskSlugs: ["floor-transfers", "overhead-work", "bed-mobility"],
    cues: [
      {
        text: "Start supine, weight pressed to ceiling",
        cueType: "verbal",
      },
      {
        text: "Roll to elbow, then hand — eyes on the weight",
        cueType: "verbal",
      },
      {
        text: "Bridge hips, sweep back leg to half-kneeling",
        cueType: "verbal",
      },
      {
        text: "Stand from lunge, reverse every step to return",
        cueType: "verbal",
      },
    ],
    regressions: [
      {
        name: "Half Get-Up",
        description: "Stop at seated position and reverse.",
      },
      {
        name: "Arm Bar",
        description: "Sidelying overhead hold with rotation.",
      },
    ],
    progressions: [
      {
        name: "Heavier Load",
        description: "Progress KB weight once phases are fluid.",
      },
      {
        name: "Bottoms-Up Get-Up",
        description: "KB upside-down for grip and stability demand.",
      },
    ],
  },
  {
    slug: "farmers-carry",
    name: "Farmer's Carry (Loaded Carry)",
    description: "Walk while holding heavy weights at your sides, standing tall with the shoulders packed down. The loaded carry demands strong trunk cocontraction and grip, training lateral trunk stability and spinal stiffness."ter walks, 2-3x/week, ≥4 weeks [Knapik 2012]",
    emgNotes:
      "QL substantial activation. Glutes ~80% MVC, low back ~50% MVC [McGill 2009, 2012]",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: ["dumbbells"],
    bodyPosition: "standing",
    movementSlugs: ["hip-extension", "ankle-plantarflexion"],
    muscleRoles: [
      {
        muscleSlug: "quadratus-lumborum",
        role: "primary",
        notes: "Lateral trunk stability [McGill 2009]",
      },
      {
        muscleSlug: "erector-spinae",
        role: "primary",
        notes: "Trunk rigidity through cocontraction",
      },
      {
        muscleSlug: "gluteus-medius",
        role: "secondary",
        notes: "Pelvic stability during loaded gait",
      },
      {
        muscleSlug: "trapezius-upper",
        role: "secondary",
        notes: "Shoulder depression resistance",
      },
      { muscleSlug: "transversus-abdominis", role: "stabilizer" },
    ],
    functionalTaskSlugs: ["carrying-lifting", "walking"],
    cues: [
      { text: "Stand tall — don't lean", cueType: "verbal" },
      { text: "Shoulders packed down and back", cueType: "verbal" },
      { text: "Normal stride, controlled steps", cueType: "verbal" },
      { text: "Squeeze handles hard", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Lighter Load",
        description: "Reduce weight until posture maintained.",
      },
      {
        name: "Bilateral Only",
        description: "Equal weight both sides before suitcase carry.",
      },
    ],
    progressions: [
      {
        name: "Suitcase Carry",
        description: "One-sided — greater lateral trunk demand.",
      },
      {
        name: "Overhead Carry",
        description:
          "Highest spine loads due to cocontraction [McGill 2009].",
      },
    ],
  },
  {
    slug: "front-plank",
    name: "Front Plank and Variations",
    description: "Prone forearm plank held with elbows under the shoulders and a straight line from head to heels. Brace the abdominals and squeeze the glutes to keep the hips from sagging; a slight posterior pelvic tilt and scapular set increase activation. Well-tolerated in chronic low back pain."urance: 3-4×30-60s. Strength: harder variations 3-4×15-30s. Rehab: 10-20s holds [Calatayud 2019]",
    emgNotes:
      "RA 46-48% MVIC. EO 77% with bracing [García-Jaén 2020]. Hollowing: IO ES=2.02-2.27 [García-Jaén 2020]. Scap adduction+PPT: highest overall [Cortell-Tormo 2017]",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "prone",
    movementSlugs: ["lumbar-flexion", "lumbar-extension"],
    muscleRoles: [
      {
        muscleSlug: "rectus-abdominis",
        role: "primary",
        notes: "46-48% MVIC [Calatayud 2019]",
      },
      {
        muscleSlug: "external-oblique",
        role: "primary",
        notes: "77% MVIC with bracing [García-Jaén 2020]",
      },
      {
        muscleSlug: "internal-oblique",
        role: "secondary",
        notes: "Increases with hollowing ES=2.02-2.27",
      },
      { muscleSlug: "transversus-abdominis", role: "stabilizer" },
      { muscleSlug: "erector-spinae", role: "stabilizer" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "carrying-lifting"],
    cues: [
      {
        text: "Forearms on floor, elbows under shoulders, straight line head to feet",
        cueType: "verbal",
      },
      {
        text: "Squeeze glutes, brace abs — don't sag",
        cueType: "verbal",
      },
      {
        text: "Tuck tailbone slightly for more activation",
        cueType: "verbal",
      },
      { text: "Breathe normally", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Knee Plank",
        description: "From knees — reduced lever arm.",
      },
      {
        name: "Incline Plank",
        description: "Hands on bench or wall.",
      },
    ],
    progressions: [
      {
        name: "Plank with Arm Reach",
        description: "Alternate reaching forward.",
      },
      {
        name: "Body Saw",
        description: "Rock forward/backward on forearms.",
      },
      {
        name: "Suspended Plank",
        description:
          "Feet in TRX — greatest RA/EO activation [Calatayud 2017].",
      },
    ],
  },
  {
    slug: "side-plank-hip-abduction",
    name: "Side Plank with Hip Abduction",
    description: "A side plank in which the top leg is lifted into hip abduction. Set up on the forearm with the hips stacked, raise the top leg toward the ceiling without letting the hips drop or rotate, then lower with control. Adds gluteus medius demand to the standard side plank hold."per side, or isometric 3×15-30s holds",
    emgNotes:
      "Side plank: highest lumbar ES [Calatayud 2017]. Glute med 54.9-81.9% MVIC unilateral exercises [Mausehund 2019]",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "sidelying",
    movementSlugs: ["hip-abduction", "thoracic-lateral-flexion", "lumbar-lateral-flexion"],
    muscleRoles: [
      {
        muscleSlug: "gluteus-medius",
        role: "primary",
        notes: "Hip abduction against gravity",
      },
      {
        muscleSlug: "quadratus-lumborum",
        role: "primary",
        notes: "Lateral trunk stability",
      },
      { muscleSlug: "external-oblique", role: "secondary" },
      { muscleSlug: "internal-oblique", role: "secondary" },
      {
        muscleSlug: "erector-spinae",
        role: "stabilizer",
        notes: "Highest among plank variations [Calatayud 2017]",
      },
    ],
    functionalTaskSlugs: [
      "posture-maintenance",
      "walking",
      "single-leg-balance",
    ],
    cues: [
      {
        text: "Forearm under shoulder, hips stacked",
        cueType: "verbal",
      },
      {
        text: "Lift top leg toward ceiling in plank",
        cueType: "verbal",
      },
      {
        text: "Don't let hips drop or rotate",
        cueType: "verbal",
      },
      { text: "Lower leg with control", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Knee Side Plank",
        description: "Bottom knee on ground, no abduction.",
      },
      {
        name: "Sidelying Hip Abduction",
        description: "Remove plank — isolate glute med.",
      },
    ],
    progressions: [
      {
        name: "Side Plank with Band",
        description: "Band above knees for increased resistance.",
      },
      {
        name: "Side Plank with Rotation",
        description: "Add trunk rotation between abduction reps.",
      },
    ],
  },
  {
    slug: "step-up-variations",
    name: "Step-Up Variations (Forward, Lateral, Cross-Over)",
    description: "Step up onto a box or step and stand to full hip extension, driving through the heel of the stepping leg, then control the descent. Vary the entry direction, forward, lateral, or cross-over, to bias different glute and thigh muscles, and raise step height to increase demand."ess height 4→8→12+ inches [Muyor 2020, Simenz 2012]",
    emgNotes:
      "Lateral: VL 52.8%, VM 50.4%, glute med 42.8% [Muyor 2020]. 8-inch: VM 60% vs 4-inch 24% [Brask 1984]. Crossover: highest glute med [Simenz 2012]",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: ["step", "dumbbells"],
    bodyPosition: "standing",
    movementSlugs: ["hip-extension", "knee-extension", "hip-abduction"],
    muscleRoles: [
      {
        muscleSlug: "quadriceps",
        role: "primary",
        notes: "VL 52.8%, VM 50.4% [Muyor 2020]",
      },
      {
        muscleSlug: "gluteus-maximus",
        role: "secondary",
        notes: "35.6% — highest standard direction [Simenz 2012]",
      },
      {
        muscleSlug: "gluteus-medius",
        role: "secondary",
        notes: "42.8% — highest crossover direction [Simenz 2012]",
      },
      {
        muscleSlug: "hamstrings",
        role: "stabilizer",
        notes: "BF 24.8% [Muyor 2020]",
      },
    ],
    functionalTaskSlugs: [
      "stair-climbing",
      "floor-transfers",
      "carrying-lifting",
    ],
    cues: [
      {
        text: "Drive through heel of stepping leg",
        cueType: "verbal",
      },
      {
        text: "Stand fully tall at top — full hip extension",
        cueType: "verbal",
      },
      {
        text: "Control descent — don't drop",
        cueType: "verbal",
      },
      { text: "Knee tracks over 2nd toe", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Low Step (4 inches)",
        description: "VM 24% MVIC — appropriate start [Brask 1984].",
      },
      {
        name: "Hand Support",
        description: "Fingertip touch on wall for balance.",
      },
    ],
    progressions: [
      {
        name: "Higher Step (8-12 inches)",
        description: "VM 60% MVIC at 8 inches [Brask 1984].",
      },
      {
        name: "Loaded Step-Up",
        description:
          "Add dumbbells. Forces scale more than bilateral squat [Kipp 2022].",
      },
      {
        name: "Lateral/Crossover",
        description: "Crossover for highest glute med [Simenz 2012].",
      },
    ],
  },
  {
    slug: "kettlebell-swing",
    name: "Kettlebell Swing (Two-Hand)",
    description: "Explosive two-hand hip-hinge swing that snaps the hips forward to drive a kettlebell up to about chest height, with the arms simply guiding the bell. Builds posterior chain power through ballistic hip extension."io: 15:15 protocol 20 min 3x/week. Strength: 3-5×8-10 at 8-10RM. Pain: 8 rounds 20s swings/10s rest [Falatic 2015, Keilman 2017]",
    emgNotes:
      "Hip hinge: hamstrings MD 3.92 vs squat swing (p=0.002). Medial hamstrings > BF (MD 9.93, p=0.022) [Del Monte 2020]. Low back ~50% MVC, glutes ~80% MVC [McGill 2012]",
    evidenceLevel: "moderate",
    difficulty: "intermediate",
    equipment: ["kettlebell"],
    bodyPosition: "standing",
    movementSlugs: ["hip-extension", "hip-flexion", "ankle-plantarflexion"],
    muscleRoles: [
      {
        muscleSlug: "gluteus-maximus",
        role: "primary",
        notes: "~80% MVC explosive hip extension [McGill 2012]",
      },
      {
        muscleSlug: "hamstrings",
        role: "primary",
        notes:
          "Significantly higher with hip hinge technique [Del Monte 2020]",
      },
      {
        muscleSlug: "erector-spinae",
        role: "secondary",
        notes: "~50% MVC trunk rigidity [McGill 2012]",
      },
      {
        muscleSlug: "quadratus-lumborum",
        role: "secondary",
        notes: "Lateral stability",
      },
      { muscleSlug: "transversus-abdominis", role: "stabilizer" },
    ],
    functionalTaskSlugs: [
      "carrying-lifting",
      "floor-transfers",
      "running-jogging",
    ],
    cues: [
      {
        text: "Hip HINGE, not squat — push hips back",
        cueType: "verbal",
      },
      {
        text: "Snap hips forward to drive bell — arms just along for the ride",
        cueType: "verbal",
      },
      {
        text: "Stand tall at top: squeeze glutes, vertical torso",
        cueType: "verbal",
      },
      {
        text: "Bell goes between legs, not below knees",
        cueType: "verbal",
      },
      { text: "Exhale sharply at top", cueType: "verbal" },
    ],
    regressions: [
      {
        name: "Kettlebell Deadlift",
        description:
          "Remove ballistic component. Practice hip hinge with load.",
      },
      {
        name: "Wall-Facing Swing",
        description:
          "12 inches from wall — forces hip hinge pattern.",
      },
    ],
    progressions: [
      {
        name: "Single-Arm Swing",
        description:
          "Anti-rotation demand. RA ipsilateral 42-48% higher [Andersen 2016].",
      },
      {
        name: "Kettlebell Snatch",
        description:
          "Single-arm overhead finish. Advanced full-body power.",
      },
    ],
  },
  // ── Coverage Gap Exercises: Hand, Cervical, Scapular ──────────────────
  {
    slug: "thumb-ip-mcp-strengthening",
    name: "Thumb IP and MCP Strengthening",
    description: "Isolated thumb-joint strengthening targeting the FPL (IP flexion), EPL (IP extension), FPB (MCP flexion), and EPB (MCP extension)."h direction (IP flex/ext, MCP flex/ext), 3x/week. Modified Borg Scale moderate-to-somewhat-hard [Lamb 2015]",
    emgNotes: "FPL: linear EMG-force relationship [Cooney 1985]. EPL: independent activation at 20-50% MVC [Birdwell 2013]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["therapy-putty"],
    bodyPosition: "seated",
    movementSlugs: ["thumb-ip-flexion", "thumb-ip-extension", "thumb-mcp-flexion", "thumb-mcp-extension"],
    muscleRoles: [
      { muscleSlug: "flexor-pollicis-longus", role: "primary", notes: "IP flexion — linear EMG-force relationship [Cooney 1985]" },
      { muscleSlug: "extensor-pollicis-longus", role: "primary", notes: "IP extension — independent activation at 20-50% MVC [Birdwell 2013]" },
      { muscleSlug: "flexor-pollicis-brevis", role: "primary", notes: "MCP flexion" },
      { muscleSlug: "abductor-pollicis-brevis", role: "synergist", notes: "Assists MCP positioning" },
    ],
    functionalTaskSlugs: ["gripping-cup", "dressing-upper-body"],
    cues: [
      { text: "Keep wrist neutral — don't bend it during thumb exercises", cueType: "verbal" },
      { text: "IP flexion: bend just the tip of the thumb, hold 3 seconds", cueType: "verbal" },
      { text: "IP extension: straighten just the tip against light resistance", cueType: "verbal" },
      { text: "MCP flexion: bend the thumb at the base joint, keeping IP straight", cueType: "verbal" },
    ],
    regressions: [
      { name: "Passive ROM", description: "Use other hand to gently move thumb through each range. Build tolerance first." },
    ],
    progressions: [
      { name: "Putty Resistance", description: "Perform all movements against therapy putty for progressive resistance." },
    ],
  },
  {
    slug: "thumb-adduction-key-pinch",
    name: "Thumb Adduction / Key Pinch Exercise",
    description: "Strengthens the adductor pollicis through key (lateral) pinch tasks, pinching a key or card between the thumb pad and the side of the index finger." holds (5 seconds each), 3x/week. Train at 50% MVC for strength gains [Lyle 1998]",
    emgNotes: "Adductor pollicis nearly equal to FPL during pinch [Cooney 1985]. 79% MVC increase after training at 50% MVC [Lyle 1998]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["therapy-putty"],
    bodyPosition: "seated",
    movementSlugs: ["thumb-adduction"],
    muscleRoles: [
      { muscleSlug: "adductor-pollicis", role: "primary", notes: "Primary during key pinch — activity increases proportionally with force [Cooney 1985]" },
      { muscleSlug: "flexor-pollicis-longus", role: "secondary", notes: "Co-active during pinch [Cooney 1985]" },
      { muscleSlug: "flexor-pollicis-brevis", role: "synergist", notes: "MCP stabilization during pinch" },
    ],
    functionalTaskSlugs: ["gripping-cup", "opening-jar", "dressing-upper-body"],
    cues: [
      { text: "Pinch a key or card between your thumb pad and the side of your index finger", cueType: "verbal" },
      { text: "Squeeze and hold for 5 seconds, then release slowly", cueType: "verbal" },
      { text: "Focus on pressing thumb INWARD toward your palm, not forward", cueType: "verbal" },
    ],
    regressions: [
      { name: "Light Pinch", description: "Pinch a soft sponge or tissue. Build tolerance before resistance." },
    ],
    progressions: [
      { name: "Putty Key Pinch", description: "Pinch therapy putty laterally with progressive resistance levels." },
    ],
  },
  {
    slug: "finger-adduction-exercise",
    name: "Finger Adduction Exercise (Palmar Interossei)",
    description: "Strengthen the palmar interossei by placing a piece of paper between adjacent fingers and squeezing to hold it against a gentle pull, working through each finger pair." isometric contractions preferred for partially denervated muscle [Herbison 1983]",
    emgNotes: "Rubber band resistance: significantly increases intrinsic activation, minimizes extrinsic [Boudreau 2022]. Ulnar nerve injury: 75-76% pinch-to-zoom reduction [Bertelli 2020]",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    movementSlugs: ["finger-adduction"],
    muscleRoles: [
      { muscleSlug: "palmar-interossei", role: "primary", notes: "Primary finger adductors — ulnar nerve innervated [Boudreau 2022]" },
      { muscleSlug: "flexor-digitorum-profundus", role: "stabilizer", notes: "MCP stability during adduction" },
    ],
    functionalTaskSlugs: ["gripping-cup", "typing"],
    cues: [
      { text: "Place a piece of paper between two fingers", cueType: "verbal" },
      { text: "Squeeze the fingers together to hold the paper — don't let it drop", cueType: "verbal" },
      { text: "Hold 5 seconds, relax, repeat with each finger pair", cueType: "verbal" },
    ],
    regressions: [
      { name: "Isometric Hold Only", description: "Press fingers together without resistance. Build motor control first." },
    ],
    progressions: [
      { name: "Card Hold with Pull", description: "Hold paper between fingers while someone gently tries to pull it out." },
    ],
  },
  {
    slug: "thumb-putty-program",
    name: "Comprehensive Thumb Putty Program",
    description: "Therapy-putty program for the thumb, working opposition, abduction, adduction, and pinch strength by squeezing and pressing the putty in varied positions." 12 weeks for sustained benefit. Progress putty resistance by color. Modified Borg moderate-to-somewhat-hard [Brosseau 2018, Lamb 2015]",
    emgNotes: "CMC OA: short-term pain reduction SMD -5.0, grip strength improvement 21 lbs [Thakker 2025]. Ottawa Panel: 46 grade A recommendations [Brosseau 2018]",
    evidenceLevel: "strong",
    difficulty: "beginner",
    equipment: ["therapy-putty"],
    bodyPosition: "seated",
    movementSlugs: ["thumb-opposition", "thumb-abduction", "thumb-adduction", "thumb-mcp-flexion", "finger-flexion"],
    muscleRoles: [
      { muscleSlug: "opponens-pollicis", role: "primary", notes: "Opposition exercises" },
      { muscleSlug: "abductor-pollicis-brevis", role: "primary", notes: "Abduction and opposition" },
      { muscleSlug: "adductor-pollicis", role: "primary", notes: "Key pinch and lateral pinch" },
      { muscleSlug: "flexor-pollicis-brevis", role: "secondary", notes: "MCP flexion during pinch" },
      { muscleSlug: "flexor-digitorum-superficialis", role: "secondary", notes: "Grip component" },
    ],
    functionalTaskSlugs: ["gripping-cup", "opening-jar", "dressing-upper-body"],
    cues: [
      { text: "Opposition: press thumb into putty touching each fingertip", cueType: "verbal" },
      { text: "Pinch: squeeze putty between thumb and fingers in different positions", cueType: "verbal" },
      { text: "Grip: make a full fist squeeze around the putty", cueType: "verbal" },
      { text: "Progress to next putty color when current feels easy for all 3 sets", cueType: "verbal" },
    ],
    regressions: [
      { name: "Softest Putty", description: "Start with tan/yellow (extra-soft) putty. Focus on ROM before resistance." },
    ],
    progressions: [
      { name: "Functional Tasks", description: "Progress from putty to real-world tasks: buttons, jar opening, key turning." },
    ],
  },
  {
    slug: "suboccipital-exercise",
    name: "Upper Cervical (Suboccipital) Exercise with Release",
    description: "Craniocervical flexion and extension targeting the upper cervical segments (C0-C2), often preceded by a suboccipital release. Performed as gentle chin-nod stages that progress in depth, optionally guided by pressure biofeedback, followed by controlled upper-cervical rotation." through 5 pressure stages (20-30 mmHg). Combine with suboccipital release [Pardos-Aguilella 2024, Kim 2016]",
    emgNotes: "DCF: linear EMG-pressure relationship [Falla 2003]. Suboccipital release + CCF superior to CCF alone [Kim 2016]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["pressure-biofeedback-unit"],
    bodyPosition: "supine",
    notes: "Extends deep-neck-flexor-training by targeting C0-C2 extension and rotation. Combines with suboccipital self-release using tennis balls.",
    movementSlugs: ["cervical-extension-upper", "cervical-rotation-upper", "cervical-flexion-upper"],
    muscleRoles: [
      { muscleSlug: "deep-cervical-flexors", role: "primary", notes: "CCF component — longus colli and capitis" },
      { muscleSlug: "sternocleidomastoid", role: "stabilizer", notes: "Should show MINIMAL activation [Falla 2004]" },
      { muscleSlug: "semispinalis-capitis", role: "secondary", notes: "Extension component at C0-C2" },
    ],
    functionalTaskSlugs: ["posture-maintenance"],
    cues: [
      { text: "Suboccipital release: lie with two tennis balls in a sock under the base of your skull", cueType: "verbal" },
      { text: "Rest for 2-3 minutes — breathe and let the muscles relax", cueType: "verbal" },
      { text: "Then perform chin tucks with biofeedback: 5 stages, 20→30 mmHg", cueType: "verbal" },
      { text: "For upper cervical rotation: gentle rotation at C1-C2 only — keep lower neck still", cueType: "verbal" },
    ],
    regressions: [
      { name: "Suboccipital Release Only", description: "Start with just the tennis ball release for 2-3 minutes. No active exercise until comfortable." },
    ],
    progressions: [
      { name: "Device-Guided Training", description: "Use device-guided craniocervical flexion and extension training [Pardos-Aguilella 2024]." },
    ],
  },
  {
    slug: "scapular-shrugs-depression",
    name: "Scapular Elevation and Depression (Shrugs / Reverse Shrugs)",
    description: "Shrugs (lifting the shoulders straight up) target the upper trapezius and levator scapulae; reverse shrugs (actively pushing the shoulders down and slightly back) target the lower trapezius and serratus anterior. Shrugging with the arms abducted biases the scapular upward rotators."epression), 2-3x/week [Kibler 2008, Choi 2015]",
    emgNotes: "UT 21-36% MVIC. Levator scapulae 25-58% MVIC (robbery exercise highest). LT 15-30% MVIC depression [Berckmans 2021, Kibler 2008]",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["dumbbells"],
    bodyPosition: "standing",
    movementSlugs: ["scapular-elevation", "scapular-depression"],
    muscleRoles: [
      { muscleSlug: "trapezius-upper", role: "primary", notes: "21-36% MVIC — elevation [Berckmans 2021]" },
      { muscleSlug: "levator-scapulae", role: "primary", notes: "25-58% MVIC — co-primary elevator [Berckmans 2021]" },
      { muscleSlug: "trapezius-lower", role: "primary", notes: "15-30% MVIC — depression [Kibler 2008]" },
      { muscleSlug: "serratus-anterior", role: "secondary", notes: "Assists depression and upward rotation" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "carrying-lifting"],
    cues: [
      { text: "Shrug: lift both shoulders straight up toward ears, hold 3 seconds", cueType: "verbal" },
      { text: "Reverse shrug: actively push shoulders DOWN and slightly back", cueType: "verbal" },
      { text: "For abducted shrugs: hold arms at 90° and shrug — targets upward rotators", cueType: "verbal" },
    ],
    regressions: [
      { name: "Seated Shrugs", description: "Perform seated to reduce balance demand. No weight." },
    ],
    progressions: [
      { name: "Dumbbell Shrugs at 90° ABD", description: "Hold dumbbells with arms at 90° abduction. Increases upward rotator activation [Choi 2015]." },
    ],
  },
  {
    slug: "scapular-downward-rotation-control",
    name: "Scapular Downward Rotation Control (Arm Lowering)",
    description: "Controlled arm lowering from overhead, emphasizing slow eccentric scapular downward rotation as the shoulder blade glides smoothly down and in without hiking or dumping. Trains controlled mobility for hand-behind-back reaching." second eccentric), 2-3x/week",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    notes: "Downward rotation is less commonly trained. Addressed through controlled mobility and eccentric control [Berckmans 2021].",
    movementSlugs: ["scapular-downward-rotation"],
    muscleRoles: [
      { muscleSlug: "rhomboid-major", role: "primary", notes: "25-45% MVIC — primary downward rotator [Berckmans 2021]" },
      { muscleSlug: "levator-scapulae", role: "primary", notes: "25-58% MVIC — assists downward rotation [Berckmans 2021]" },
      { muscleSlug: "trapezius-lower", role: "stabilizer", notes: "Eccentric control during lowering" },
    ],
    functionalTaskSlugs: ["dressing-upper-body", "reaching-overhead"],
    cues: [
      { text: "Raise your arm fully overhead with good scapular mechanics", cueType: "verbal" },
      { text: "Now SLOWLY lower your arm back to your side over 3-5 seconds", cueType: "verbal" },
      { text: "Focus on the shoulder blade gliding smoothly down and in", cueType: "verbal" },
      { text: "Don't let the shoulder 'dump' or hike during lowering", cueType: "verbal" },
    ],
    regressions: [
      { name: "Wall Slide Down", description: "Perform against a wall for tactile feedback during the lowering phase." },
    ],
    progressions: [
      { name: "Weighted Arm Lowering", description: "Hold a light dumbbell. Eccentric control with external load." },
    ],
  },
  {
    slug: "cat-cow",
    name: "Cat-Cow",
    description: "Rhythmic spinal flexion-extension exercise performed in quadruped. Patient alternates between arching (cow/extension) and rounding (cat/flexion) the spine. Trains segmental motor control through lumbar and thoracic regions. Well-suited for chronic LBP motor control retraining.",
    confidence: 0.80,
    notes: "Multifidus activation 9.7-16.9% MVIC during lordosis phase [Shah 2020]. Used as a motor control exercise in chronic LBP rehabilitation. Gentle rhythmic loading promotes segmental mobility and neuromuscular awareness.",
    dosing: "2-3×10-15 reps, slow controlled tempo, 2-3x/week",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "quadruped",
    evidenceLevel: "moderate",
    emgNotes: "Multifidus 9.7-16.9% MVIC during lordosis (cow) phase [Shah 2020]. Low-level activation appropriate for early motor control training.",
    movementSlugs: ["lumbar-flexion", "lumbar-extension", "thoracic-flexion", "thoracic-extension"],
    muscleRoles: [
      { muscleSlug: "multifidus", role: "primary", notes: "9.7-16.9% MVIC during lordosis phase [Shah 2020]" },
      { muscleSlug: "erector-spinae", role: "primary", notes: "Active during extension (cow) phase" },
      { muscleSlug: "rectus-abdominis", role: "secondary", notes: "Active during flexion (cat) phase" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Tonic stabilization throughout movement cycle" },
      { muscleSlug: "external-oblique", role: "stabilizer", notes: "Assists spinal flexion during cat phase" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "bed-mobility", "floor-transfers"],
    cues: [
      { text: "Start on hands and knees — wrists under shoulders, knees under hips", cueType: "verbal" },
      { text: "Cow: drop your belly, lift your tailbone and chest, look slightly up", cueType: "verbal" },
      { text: "Cat: round your back toward the ceiling, tuck your chin and tailbone", cueType: "verbal" },
      { text: "Move slowly — one vertebra at a time, like a wave through your spine", cueType: "verbal" },
      { text: "Breathe in during cow, breathe out during cat", cueType: "verbal" },
    ],
    regressions: [
      { name: "Seated Cat-Cow", description: "Perform the flexion-extension cycle while seated on a chair. Reduces load on wrists and knees." },
      { name: "Partial Range Cat-Cow", description: "Limit the range of motion to the comfortable mid-range. Reduces end-range stress." },
    ],
    progressions: [
      { name: "Cat-Cow with Breath Holds", description: "Hold each position for 3-5 seconds with controlled breathing. Increases isometric demand and body awareness." },
      { name: "Cat-Cow with Limb Lift", description: "At the end of cow phase, extend one arm or leg. Combines motor control with anti-rotation stability." },
    ],
  },
  {
    slug: "quadruped-rockback",
    name: "Quadruped Rockback",
    description: "Flexion-biased exercise performed in quadruped. Patient rocks hips back toward heels while maintaining neutral or slightly flexed lumbar spine. Opens the lumbar spinal canal and neural foramina, providing symptom relief for lumbar stenosis. Doubles as a gentle hip and lumbar mobility drill.",
    confidence: 0.80,
    notes: "Flexion-biased positioning increases spinal canal diameter, making this a first-line exercise for lumbar spinal stenosis symptom management. Can be performed as reps or sustained holds.",
    dosing: "3×10 reps or 3×30-60s holds, 2-3x/week",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "quadruped",
    evidenceLevel: "moderate",
    emgNotes: "Low-level multifidus and erector spinae activation during controlled flexion. Primary benefit is mechanical — canal opening rather than muscle strengthening.",
    movementSlugs: ["lumbar-flexion", "hip-flexion"],
    muscleRoles: [
      { muscleSlug: "erector-spinae", role: "stabilizer", notes: "Eccentric control during flexion rockback" },
      { muscleSlug: "multifidus", role: "stabilizer", notes: "Segmental control during flexion" },
      { muscleSlug: "gluteus-maximus", role: "secondary", notes: "Eccentric control of hip flexion" },
      { muscleSlug: "rectus-abdominis", role: "stabilizer", notes: "Maintains lumbar flexion posture" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Core stabilization throughout" },
    ],
    functionalTaskSlugs: ["floor-transfers", "posture-maintenance"],
    cues: [
      { text: "Start on hands and knees — wrists under shoulders, knees under hips", cueType: "verbal" },
      { text: "Slowly sit your hips back toward your heels as far as comfortable", cueType: "verbal" },
      { text: "Let your low back round gently — don't fight to stay arched", cueType: "verbal" },
      { text: "Hold the end position and breathe deeply, then return to start", cueType: "verbal" },
    ],
    regressions: [
      { name: "Pillow-Assisted Rockback", description: "Place a pillow between calves and thighs to limit depth. Reduces hip and knee flexion demand." },
      { name: "Partial Range Rockback", description: "Rock back only halfway. Gradually increase depth as tolerated." },
    ],
    progressions: [
      { name: "Rockback with Lateral Shift", description: "Rock back and shift hips slightly left or right to bias one side of the spinal canal." },
      { name: "Extended Hold Rockback", description: "Hold end position for 60-90 seconds. Sustained canal opening for stenosis management." },
    ],
  },
  {
    slug: "thoracic-rotation-quadruped",
    name: "Thoracic Rotation in Quadruped (Thread the Needle)",
    description: "Quadruped rotational mobility exercise. Patient threads one arm under the body then opens it toward the ceiling. The quadruped position locks the lumbar spine, isolating rotation to the thoracic segments. Clinically valuable for improving thoracic mobility in shoulder impingement syndrome.",
    confidence: 0.80,
    notes: "Quadruped position effectively locks lumbar rotation, isolating movement to thoracic spine. Thoracic mobility improvements linked to reduced shoulder impingement symptoms [Calik 2025, Hunter 2020].",
    dosing: "2-3×8-10 reps per side, 2-3x/week",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "quadruped",
    evidenceLevel: "moderate",
    emgNotes: "Low-to-moderate activation of thoracic rotators. Primary benefit is joint mobility rather than muscle strengthening.",
    movementSlugs: ["thoracic-rotation"],
    muscleRoles: [
      { muscleSlug: "rotatores-thoracis", role: "primary", notes: "Short segmental rotators of the thoracic spine" },
      { muscleSlug: "internal-oblique", role: "synergist", notes: "Ipsilateral rotation component" },
      { muscleSlug: "external-oblique", role: "synergist", notes: "Contralateral rotation component" },
      { muscleSlug: "serratus-anterior", role: "stabilizer", notes: "Scapular stabilization on support arm" },
      { muscleSlug: "multifidus", role: "stabilizer", notes: "Segmental stabilization during rotation" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "reaching-overhead"],
    cues: [
      { text: "Start on hands and knees — keep your hips stacked over your knees throughout", cueType: "verbal" },
      { text: "Thread one arm under your body, reaching through to the far side", cueType: "verbal" },
      { text: "Then open that arm toward the ceiling, following your hand with your eyes", cueType: "verbal" },
      { text: "Rotate from your mid-back — keep your hips and low back still", cueType: "verbal" },
      { text: "Exhale as you thread through, inhale as you open up", cueType: "verbal" },
    ],
    regressions: [
      { name: "Seated Thoracic Rotation", description: "Sit in a chair with arms crossed. Rotate upper body to each side. Reduces balance and wrist demand." },
    ],
    progressions: [
      { name: "Thread the Needle with Hold", description: "Hold the open (rotated) position for 5-10 seconds. Increases end-range thoracic rotation." },
      { name: "Thread the Needle with Band", description: "Hold a light resistance band in the rotating hand. Adds load to the opening phase." },
    ],
  },
  {
    slug: "thoracic-extension-wall",
    name: "Thoracic Extension with Hip Hinge on Wall",
    description: "Wall-based thoracic extension stretch. Stand about arm's length from a wall, hinge at the hips, place the hands on the wall, and sink the chest down between the arms. Targets upper thoracic extension. Often called the wall prayer stretch."d improves upper thoracic extension ROM [Calik 2025]. Combines hip hinge pattern with gravity-assisted thoracic extension. Useful for desk workers and those with postural kyphosis.",
    dosing: "3×30-60s holds, 2-3x/week",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "moderate",
    emgNotes: "Low-level erector spinae and thoracic extensor activation. Primarily a passive stretch with gravity-assisted positioning.",
    movementSlugs: ["thoracic-extension", "hip-flexion"],
    muscleRoles: [
      { muscleSlug: "erector-spinae", role: "secondary", notes: "Thoracic erector spinae — active lengthening under stretch" },
      { muscleSlug: "latissimus-dorsi", role: "secondary", notes: "Stretched during overhead arm position" },
      { muscleSlug: "serratus-anterior", role: "stabilizer", notes: "Scapular upward rotation during overhead position" },
      { muscleSlug: "hamstrings", role: "stabilizer", notes: "Maintains hip hinge position" },
      { muscleSlug: "gluteus-maximus", role: "stabilizer", notes: "Hip hinge control" },
    ],
    functionalTaskSlugs: ["posture-maintenance", "reaching-overhead"],
    cues: [
      { text: "Stand arm's length from the wall. Place both hands on the wall at shoulder height", cueType: "verbal" },
      { text: "Hinge at your hips and walk your hands down, sinking your chest toward the floor", cueType: "verbal" },
      { text: "Let your chest drop between your arms — feel the stretch through your upper back", cueType: "verbal" },
      { text: "Hold and breathe deeply — let gravity do the work", cueType: "verbal" },
    ],
    regressions: [
      { name: "Hands Higher on Wall", description: "Keep hands at shoulder height or above. Reduces the degree of thoracic extension required." },
    ],
    progressions: [
      { name: "Prayer Stretch on Floor", description: "Perform the same stretch in quadruped (child's pose variant) with arms extended. Greater ROM available." },
      { name: "Foam Roller Thoracic Extension", description: "Lie supine over a foam roller at the thoracic spine. Arms overhead. Passive extension with support." },
    ],
  },
  {
    slug: "supine-chin-tuck-liftoff",
    name: "Supine Chin Tuck with Liftoff",
    description: "A deep cervical flexor endurance exercise. Lie supine, tuck the chin (craniocervical flexion), then lift the head slightly off the surface while holding the tucked position. Trains the deep neck flexors with minimal sternocleidomastoid activation." norms: men 38.9±20.1s, women 29.4±13.7s [Domenech 2011]. Craniocervical flexion (CCF) component ensures preferential deep cervical flexor activation with less SCM activation compared to head-lift alone [O'Leary 2007].",
    dosing: "5-10 reps × 10s holds, progress hold duration toward normative values, 2-3x/week",
    difficulty: "beginner-intermediate",
    equipment: [],
    bodyPosition: "supine",
    evidenceLevel: "strong",
    emgNotes: "CCF pattern activates deep cervical flexors (longus colli/capitis) with significantly less SCM activation than head-lift alone [O'Leary 2007]. Target hold: men ~39s, women ~29s [Domenech 2011].",
    movementSlugs: ["cervical-flexion-upper", "cervical-flexion"],
    muscleRoles: [
      { muscleSlug: "deep-cervical-flexors", role: "primary", notes: "Longus colli and capitis — CCF pattern targets these preferentially [O'Leary 2007]" },
      { muscleSlug: "sternocleidomastoid", role: "synergist", notes: "Should show MINIMAL activation — CCF reduces SCM contribution [O'Leary 2007]" },
      { muscleSlug: "scalenes", role: "stabilizer", notes: "Cervical stabilization during hold" },
    ],
    functionalTaskSlugs: ["posture-maintenance"],
    cues: [
      { text: "Lie on your back without a pillow. Gently tuck your chin as if making a double chin", cueType: "verbal" },
      { text: "Keep the tuck and lift your head just 1-2 cm off the surface", cueType: "verbal" },
      { text: "Hold that position — don't let your chin poke forward", cueType: "verbal" },
      { text: "If the front of your neck cramps, you're lifting too high or losing the tuck", cueType: "verbal" },
      { text: "Breathe normally and hold for 10 seconds, then rest", cueType: "verbal" },
    ],
    regressions: [
      { name: "Chin Tuck Without Liftoff", description: "Perform the chin tuck only, pressing the back of the head into the surface. No liftoff. Builds CCF activation pattern." },
      { name: "Chin Tuck with Towel Support", description: "Place a small folded towel under the head. Perform chin tuck with gentle head press into towel. Reduces demand." },
    ],
    progressions: [
      { name: "Extended Duration Holds", description: "Progressively increase hold time toward normative values: men ~39s, women ~29s [Domenech 2011]." },
      { name: "Chin Tuck Liftoff with Rotation", description: "Maintain the tuck and liftoff, then add gentle rotation left and right. Adds rotational endurance demand." },
    ],
  },
  {
    slug: "foam-roller-bridge",
    name: "Foam Roller Bridge",
    description: "Lie on your back with both feet on a foam roller and knees bent, then squeeze the glutes and lift the hips into a bridge, keeping the hips level on the unstable surface before lowering under control. Turning the toes slightly outward increases gluteal recruitment."ck bridge with leg lift: L/G ratio 3.35 — high lumbar stabilizer demand [Khosrokiani 2021]. Bridge with external rotation increases glute max and multifidus activation [El Melhat 2022]. Foam roller adds proprioceptive challenge beyond standard bridge.",
    dosing: "3×10-15 reps with 5-10s holds at top, 2-3x/week",
    difficulty: "beginner-intermediate",
    equipment: ["foam-roller"],
    bodyPosition: "supine",
    evidenceLevel: "moderate",
    emgNotes: "L/G ratio 3.35 for back bridge with leg lift on unstable surface [Khosrokiani 2021]. Bridge with ER increases glute max and multifidus activation [El Melhat 2022].",
    movementSlugs: ["hip-extension", "lumbar-extension"],
    muscleRoles: [
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "Primary hip extensor — activation enhanced with ER [El Melhat 2022]" },
      { muscleSlug: "multifidus", role: "stabilizer", notes: "Segmental lumbar stabilization — increased with ER and unstable surface [El Melhat 2022]" },
      { muscleSlug: "erector-spinae", role: "stabilizer", notes: "L/G ratio 3.35 indicates high lumbar demand [Khosrokiani 2021]" },
      { muscleSlug: "hamstrings", role: "secondary", notes: "Hip extension co-contraction — altered recruitment on unstable surface" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Core bracing for pelvic stability on roller" },
      { muscleSlug: "gluteus-medius", role: "stabilizer", notes: "Pelvic control on unstable surface" },
    ],
    functionalTaskSlugs: ["walking", "floor-transfers", "stair-climbing"],
    cues: [
      { text: "Lie on your back with both feet on the foam roller, knees bent", cueType: "verbal" },
      { text: "Squeeze your glutes and lift your hips — the roller will wobble, that's okay", cueType: "verbal" },
      { text: "Hold at the top for 5-10 seconds, keeping your hips level", cueType: "verbal" },
      { text: "For more glute activation, turn your toes slightly outward", cueType: "verbal" },
      { text: "Lower slowly — don't just drop back down", cueType: "verbal" },
    ],
    regressions: [
      { name: "Standard Bridge", description: "Perform a regular bridge with feet flat on the floor. Remove the unstable surface challenge." },
      { name: "Foam Roller Bridge — Feet Wider", description: "Place feet wider apart on the roller for a more stable base. Reduces balance demand." },
    ],
    progressions: [
      { name: "Single-Leg Foam Roller Bridge", description: "Extend one leg while bridging on the other foot on the roller. Significantly increases stability and glute demand." },
      { name: "Foam Roller Bridge with March", description: "Hold bridge position on roller and alternately lift knees. Combines instability with dynamic hip flexion." },
    ],
  },
  {
    slug: "kettlebell-good-morning",
    name: "Kettlebell Good Morning",
    description: "Standing hip hinge holding a kettlebell at the chest (goblet) or behind the neck, loading the posterior chain, erector spinae and glutes, through a controlled hinge. Hinge until you feel a hamstring stretch, then drive the hips forward to stand and squeeze the glutes. An effective intermediate-level posterior chain strengthener." MVIC and glute max ~80% MVIC reported with 16kg kettlebell [McGill 2012]. Hip hinge pattern is foundational for safe lifting mechanics. Kettlebell position allows self-limiting load.",
    dosing: "3×8-12 reps, 2-3x/week",
    difficulty: "intermediate",
    equipment: ["kettlebell"],
    bodyPosition: "standing",
    evidenceLevel: "moderate",
    emgNotes: "Erector spinae ~50% MVIC, gluteus maximus ~80% MVIC with 16kg kettlebell [McGill 2012]. Substantial posterior chain loading.",
    movementSlugs: ["hip-extension", "hip-flexion", "lumbar-extension"],
    muscleRoles: [
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "~80% MVIC with 16kg — primary hip extensor [McGill 2012]" },
      { muscleSlug: "erector-spinae", role: "primary", notes: "~50% MVIC — spinal extension and anti-flexion [McGill 2012]" },
      { muscleSlug: "hamstrings", role: "secondary", notes: "Hip extension synergist — eccentrically loaded during hinge" },
      { muscleSlug: "multifidus", role: "stabilizer", notes: "Segmental lumbar stabilization under load" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Intra-abdominal pressure maintenance" },
      { muscleSlug: "gluteus-medius", role: "stabilizer", notes: "Frontal plane pelvic stability" },
    ],
    functionalTaskSlugs: ["carrying-lifting", "floor-transfers"],
    cues: [
      { text: "Hold the kettlebell at your chest or behind your neck", cueType: "verbal" },
      { text: "Push your hips straight back like you're closing a car door with your butt", cueType: "verbal" },
      { text: "Keep your back flat — the kettlebell should not pull you into rounding", cueType: "verbal" },
      { text: "Hinge until you feel a stretch in your hamstrings, then drive your hips forward to stand", cueType: "verbal" },
      { text: "Squeeze your glutes hard at the top", cueType: "verbal" },
    ],
    regressions: [
      { name: "Bodyweight Good Morning", description: "Perform the hip hinge without load. Hands behind head or crossed at chest. Learn the pattern first." },
      { name: "Dowel Good Morning", description: "Hold a dowel along the spine (contact at head, upper back, sacrum). Provides feedback for maintaining neutral spine." },
    ],
    progressions: [
      { name: "Barbell Good Morning", description: "Progress to a barbell across the upper back. Allows heavier loading of the posterior chain." },
      { name: "Single-Leg Good Morning", description: "Perform on one leg (kickstand or full single-leg). Adds unilateral demand and balance challenge." },
    ],
  },
  {
    slug: "single-leg-hip-hinge-bench",
    name: "Single Leg Hip Hinge with Bench",
    description: "Bench-supported single-leg Romanian deadlift. Patient stands on one leg with the rear foot elevated on a bench behind them. Hinges at the hip to lower the trunk while maintaining a neutral spine. Provides stability support while training unilateral posterior chain strength and balance.",
    confidence: 0.78,
    notes: "Bench support reduces balance demand compared to unsupported single-leg RDL, allowing greater focus on posterior chain loading. Unilateral hip hinge addresses side-to-side asymmetries in glute and hamstring strength.",
    dosing: "3×8-10 reps per side, 2-3x/week",
    difficulty: "intermediate",
    equipment: ["bench"],
    bodyPosition: "standing",
    evidenceLevel: "limited",
    emgNotes: "Unilateral hip hinge increases ipsilateral glute max and hamstring activation compared to bilateral. Bench support stabilizes the pelvis, allowing higher loading of the working leg.",
    movementSlugs: ["hip-extension", "hip-flexion", "knee-flexion"],
    muscleRoles: [
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "Unilateral hip extension — primary mover" },
      { muscleSlug: "hamstrings", role: "primary", notes: "Eccentric control during lowering, concentric during return" },
      { muscleSlug: "erector-spinae", role: "stabilizer", notes: "Anti-flexion spinal stability under unilateral load" },
      { muscleSlug: "gluteus-medius", role: "stabilizer", notes: "Frontal plane pelvic stability on single leg" },
      { muscleSlug: "multifidus", role: "stabilizer", notes: "Segmental lumbar control" },
      { muscleSlug: "quadriceps", role: "stabilizer", notes: "Knee stability on stance leg" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing", "carrying-lifting"],
    cues: [
      { text: "Stand on one leg with your back foot up on the bench behind you", cueType: "verbal" },
      { text: "Hinge forward at the hip — push your hips back, not down", cueType: "verbal" },
      { text: "Keep your back flat and your standing knee slightly bent", cueType: "verbal" },
      { text: "Lower until you feel a strong hamstring stretch, then drive back up with your glute", cueType: "verbal" },
    ],
    regressions: [
      { name: "Bilateral RDL", description: "Perform the hip hinge on both legs. Removes the single-leg balance demand." },
      { name: "Kickstand RDL", description: "Keep the rear foot on the ground as a kickstand instead of elevated. Partial unilateral loading." },
    ],
    progressions: [
      { name: "Dumbbell Single-Leg RDL", description: "Hold dumbbells while performing the bench-supported single-leg hinge. Increases posterior chain load." },
      { name: "Unsupported Single-Leg RDL", description: "Remove the bench support entirely. Full balance and posterior chain challenge." },
    ],
  },
  {
    slug: "hip-abduction-extension-sliders",
    name: "Hip Abduction/Extension with Sliders",
    description: "Slider-based hip exercise combining abduction and extension with eccentric emphasis. Patient places foot on a slider and controls the sliding motion through hip abduction and/or extension arcs. The slider provides low-friction movement that emphasizes eccentric control during the return phase.",
    confidence: 0.75,
    notes: "Slider exercises provide eccentric emphasis during the return phase. Low-friction surface allows smooth, controlled movement through full ROM. Useful for hip stability and gluteal strengthening with reduced impact.",
    dosing: "3×10-12 reps per side, 2-3x/week",
    difficulty: "intermediate",
    equipment: ["sliders"],
    bodyPosition: "standing",
    evidenceLevel: "limited",
    emgNotes: "Slider-based movements emphasize eccentric gluteal control. Abduction component targets gluteus medius; extension component targets gluteus maximus.",
    movementSlugs: ["hip-abduction", "hip-extension"],
    muscleRoles: [
      { muscleSlug: "gluteus-medius", role: "primary", notes: "Primary hip abductor — controls slide-out and eccentric return" },
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "Hip extension component during posterior slide" },
      { muscleSlug: "gluteus-minimus", role: "synergist", notes: "Assists abduction alongside gluteus medius" },
      { muscleSlug: "tensor-fasciae-latae", role: "synergist", notes: "Hip abduction synergist — monitor for over-dominance" },
      { muscleSlug: "quadriceps", role: "stabilizer", notes: "Stance leg knee stability" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Core stability during single-leg stance" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing"],
    cues: [
      { text: "Stand with one foot on the slider, weight on the stance leg", cueType: "verbal" },
      { text: "Slowly slide the foot out to the side (abduction) or behind you (extension)", cueType: "verbal" },
      { text: "Control the return — don't let the slider snap back. Slow and steady", cueType: "verbal" },
      { text: "Keep your hips level throughout — don't let the pelvis drop on the sliding side", cueType: "verbal" },
    ],
    regressions: [
      { name: "Wall-Supported Slider", description: "Hold onto a wall or counter for balance during the sliding motion. Reduces balance demand." },
      { name: "Towel Substitute", description: "Use a towel on a smooth floor instead of sliders. Slightly more friction for easier control." },
    ],
    progressions: [
      { name: "Slider Curtsy Lunge", description: "Slide the foot diagonally behind the stance leg into a curtsy position. Adds rotational hip stability demand." },
      { name: "Dual Slider Squat", description: "Both feet on sliders, slide out into wide squat and return. Bilateral eccentric adductor and abductor challenge." },
    ],
  },
  {
    slug: "single-leg-squat-pistol",
    name: "Single Leg Squat / Pistol Squat",
    description: "A full-depth squat performed on one leg while the other leg is held out in front. It is the most demanding single-leg strength exercise for the quadriceps, glutes, and hip stabilizers. Lower slowly with the knee tracking over the toes, descend as far as control allows, then drive back up." shows highest EMG activity across lower extremity muscles vs lunge and step-up [Muyor 2020]. PFP patients demonstrate reduced glute med/max activation during single-leg squat [Glaviano 2022]. Useful as both assessment and training tool.",
    dosing: "3×6-10 reps per side, 3-5s eccentric, 2-3x/week",
    difficulty: "intermediate-advanced",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "strong",
    emgNotes: "Highest lower extremity EMG vs lunge and step-up [Muyor 2020]. PFP patients show reduced glute med/max activation [Glaviano 2022]. Useful as assessment and training exercise.",
    movementSlugs: ["knee-flexion", "knee-extension", "hip-flexion", "hip-extension"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "Highest quad activation among single-leg exercises [Muyor 2020]" },
      { muscleSlug: "gluteus-maximus", role: "primary", notes: "Hip extension from deep squat — reduced in PFP [Glaviano 2022]" },
      { muscleSlug: "gluteus-medius", role: "stabilizer", notes: "Frontal plane pelvic control — reduced in PFP [Glaviano 2022]" },
      { muscleSlug: "hamstrings", role: "synergist", notes: "Knee and hip stabilization during deep squat" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Core stability during single-leg demand" },
      { muscleSlug: "gastrocnemius", role: "stabilizer", notes: "Ankle stability and balance" },
    ],
    functionalTaskSlugs: ["stair-climbing", "squat-to-stand", "walking"],
    cues: [
      { text: "Stand on one leg. Extend the other leg in front of you", cueType: "verbal" },
      { text: "Slowly lower down — count 3-5 seconds on the way down", cueType: "verbal" },
      { text: "Keep your knee tracking over your toes, don't let it collapse inward", cueType: "verbal" },
      { text: "Go as deep as you can with control, then drive back up", cueType: "verbal" },
      { text: "If you can't go full depth, use a box or bench to limit the range", cueType: "verbal" },
    ],
    regressions: [
      { name: "Box Pistol Squat", description: "Squat to a bench or box behind you. Limits depth and provides a safety net." },
      { name: "TRX-Assisted Pistol Squat", description: "Hold TRX straps for balance and partial offloading. Allows full ROM with reduced demand." },
    ],
    progressions: [
      { name: "Weighted Pistol Squat", description: "Hold a dumbbell or kettlebell at chest. Counterweight actually helps balance while increasing load." },
      { name: "Deficit Pistol Squat", description: "Stand on a small platform to increase available depth. Maximum strength and mobility challenge." },
    ],
  },
  {
    slug: "knee-split-squat-isometric",
    name: "Knee Split Squat Isometric Holds",
    description: "Sustained isometric hold in a split-squat position at a target knee flexion angle for ligament and tendon conditioning. The prolonged tensile load promotes collagen adaptation in the knee's ligaments and tendons."g at specific joint angles promotes collagen synthesis and tendon/ligament adaptation. Protocol: progress toward 5×45s holds. Sustained loading is distinct from dynamic training — targets tissue remodeling rather than muscle hypertrophy.",
    dosing: "Progress to 5×45s holds, 2-3x/week",
    difficulty: "intermediate",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "moderate",
    emgNotes: "Sustained quadriceps activation at target knee angle. Isometric holds produce consistent muscle activation without the peak force spikes of dynamic movement.",
    movementSlugs: ["knee-flexion", "knee-extension", "hip-flexion", "hip-extension"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "Sustained isometric contraction at target knee angle" },
      { muscleSlug: "gluteus-maximus", role: "secondary", notes: "Hip extension maintenance during hold" },
      { muscleSlug: "hamstrings", role: "stabilizer", notes: "Knee stabilization and co-contraction" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Core stability during sustained hold" },
      { muscleSlug: "gluteus-medius", role: "stabilizer", notes: "Frontal plane pelvic control" },
      { muscleSlug: "gastrocnemius", role: "stabilizer", notes: "Ankle stability" },
    ],
    functionalTaskSlugs: ["stair-climbing", "squat-to-stand", "walking"],
    cues: [
      { text: "Step into a split squat position — front foot flat, back heel lifted", cueType: "verbal" },
      { text: "Lower to your target depth and HOLD — don't move up or down", cueType: "verbal" },
      { text: "Keep your front knee tracking over your toes", cueType: "verbal" },
      { text: "Breathe steadily — don't hold your breath during the hold", cueType: "verbal" },
      { text: "Start with 20-second holds and build toward 45 seconds", cueType: "verbal" },
    ],
    regressions: [
      { name: "Wall-Supported Isometric", description: "Lean against a wall in a wall-sit position. Bilateral and supported. Reduces balance demand." },
      { name: "Shorter Duration Holds", description: "Start with 10-15 second holds. Build tolerance before progressing to 45 seconds." },
    ],
    progressions: [
      { name: "Weighted Split Squat Isometric", description: "Hold dumbbells during the isometric split squat. Increases tensile loading on tendons and ligaments." },
      { name: "Elevated Rear Foot Isometric", description: "Place the rear foot on a bench (Bulgarian split squat position). Increases front leg demand." },
    ],
  },
  {
    slug: "heel-toe-tandem-walk",
    name: "Heel-Toe Walking / Tandem Gait",
    description: "Dynamic balance exercise where patient walks in a straight line placing the heel of one foot directly in front of the toes of the other foot. Challenges balance, proprioception, and vestibular integration. Commonly used for fall prevention and gait training in older adults.",
    confidence: 0.82,
    notes: "Tandem gait is a standard clinical balance assessment and training tool. Challenges narrow base of support, vestibular processing, and proprioceptive feedback. Evidence-based fall prevention component.",
    dosing: "3×20-30 steps, 2-3x/week",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "strong",
    emgNotes: "Dynamic activation of ankle dorsiflexors and plantarflexors for balance corrections. Tibialis anterior and gastrocnemius/soleus provide continuous postural adjustments during narrow-base walking.",
    movementSlugs: ["ankle-dorsiflexion", "ankle-plantarflexion", "hip-flexion", "knee-flexion", "knee-extension"],
    muscleRoles: [
      { muscleSlug: "tibialis-anterior", role: "primary", notes: "Ankle dorsiflexion and balance corrections during heel strike" },
      { muscleSlug: "gastrocnemius", role: "primary", notes: "Plantarflexion during push-off and balance corrections" },
      { muscleSlug: "soleus", role: "synergist", notes: "Sustained postural plantarflexion" },
      { muscleSlug: "gluteus-medius", role: "stabilizer", notes: "Frontal plane pelvic stability — critical with narrow base of support" },
      { muscleSlug: "quadriceps", role: "stabilizer", notes: "Knee stability during stance phase" },
      { muscleSlug: "transversus-abdominis", role: "stabilizer", notes: "Core stability during dynamic balance" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing"],
    cues: [
      { text: "Walk in a straight line — place your heel directly in front of the other foot's toes", cueType: "verbal" },
      { text: "Look straight ahead, not down at your feet", cueType: "verbal" },
      { text: "Arms out to the side for balance if needed", cueType: "verbal" },
      { text: "Move slowly and deliberately — this is about control, not speed", cueType: "verbal" },
    ],
    regressions: [
      { name: "Near-Tandem Walk", description: "Walk with a small gap between heel and toes instead of touching. Slightly wider base of support." },
      { name: "Wall-Assisted Tandem Walk", description: "Walk tandem alongside a wall, fingertips touching the wall for safety. Reduces fall risk during practice." },
    ],
    progressions: [
      { name: "Eyes-Closed Tandem Walk", description: "Perform tandem walking with eyes closed. Eliminates visual input, increasing vestibular and proprioceptive demand." },
      { name: "Tandem Walk with Head Turns", description: "Walk tandem while turning the head left and right. Adds vestibular challenge (VOR demand)." },
    ],
  },
  {
    slug: "backwards-walking",
    name: "Backwards Walking",
    description: "Retrograde gait training, walking backwards in a clear, controlled environment. The reversed gait mechanics increase quadriceps demand, improve proprioception, and reduce knee-joint loading."-week backwards walking program: pain VAS reduction 1.8 vs 1.0 (p=0.01), significant quadriceps strength improvement compared to forward walking [Alghadir 2019]. Effective for knee OA rehabilitation.",
    dosing: "10 minutes per session, 3x/week for at least 6 weeks",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "standing",
    evidenceLevel: "strong",
    emgNotes: "Increased quadriceps activation due to reversed gait mechanics — concentric quad demand during backward step. Reduced knee joint compressive forces compared to forward walking.",
    movementSlugs: ["knee-extension", "knee-flexion", "hip-extension", "ankle-plantarflexion"],
    muscleRoles: [
      { muscleSlug: "quadriceps", role: "primary", notes: "Increased demand due to reversed gait pattern — significant strength gains [Alghadir 2019]" },
      { muscleSlug: "gluteus-maximus", role: "secondary", notes: "Hip extension during backward push-off" },
      { muscleSlug: "gastrocnemius", role: "synergist", notes: "Ankle plantarflexion during backward toe-off" },
      { muscleSlug: "hamstrings", role: "stabilizer", notes: "Knee stabilization during backward stance" },
      { muscleSlug: "gluteus-medius", role: "stabilizer", notes: "Pelvic stability during single-leg stance phases" },
      { muscleSlug: "tibialis-anterior", role: "stabilizer", notes: "Ankle control and balance during backward stepping" },
    ],
    functionalTaskSlugs: ["walking", "stair-climbing"],
    cues: [
      { text: "Find a clear, flat space. Start by walking backwards slowly", cueType: "verbal" },
      { text: "Reach back with your toes first, then roll to your heel", cueType: "verbal" },
      { text: "Keep your posture upright — don't lean forward excessively", cueType: "verbal" },
      { text: "Start along a wall or with a partner for safety", cueType: "verbal" },
      { text: "Aim for 10 continuous minutes at a comfortable pace", cueType: "verbal" },
    ],
    regressions: [
      { name: "Assisted Backwards Walking", description: "Hold onto a railing or walker while walking backwards. Provides stability and confidence." },
      { name: "Slow Treadmill Backwards Walking", description: "Use a treadmill at very low speed (0.5-1.0 mph) while holding handrails. Controlled environment." },
    ],
    progressions: [
      { name: "Backwards Walking on Incline", description: "Walk backwards up a gentle incline. Increases quadriceps demand." },
      { name: "Backwards Jogging", description: "Progress to a light backward jog. Increases speed and reactive demand." },
    ],
  },
  {
    slug: "frog-pose-hold",
    name: "Frog Pose Holds",
    description: "Sustained adductor and inner hip stretch in a wide-knee quadruped position. Patient kneels with knees spread wide, feet turned outward, and sinks hips toward the floor. Provides a prolonged stretch to the adductor group and hip internal structures. Effective for improving hip abduction ROM and addressing adductor tightness.",
    confidence: 0.75,
    notes: "Sustained stretching (60-90s) at end-range promotes tissue creep and lasting ROM improvements in the adductor group. Wide-knee quadruped position provides a stable, gravity-assisted stretch.",
    dosing: "3×60-90s holds, 2-3x/week",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "quadruped",
    evidenceLevel: "limited",
    emgNotes: "Minimal muscle activation — this is a passive stretch. Adductor group is on stretch (not contracting). Low-level gluteal activation may occur to maintain position.",
    movementSlugs: ["hip-abduction", "hip-external-rotation"],
    muscleRoles: [
      { muscleSlug: "adductor-group", role: "primary", notes: "On stretch — target tissue for ROM improvement" },
      { muscleSlug: "adductor-longus", role: "primary", notes: "Primary adductor being lengthened" },
      { muscleSlug: "gracilis", role: "secondary", notes: "Stretched along with adductor group" },
      { muscleSlug: "pectineus", role: "secondary", notes: "Stretched during wide-knee position" },
      { muscleSlug: "gluteus-medius", role: "stabilizer", notes: "Low-level activation to maintain abducted position" },
    ],
    functionalTaskSlugs: ["floor-transfers"],
    cues: [
      { text: "Start on hands and knees. Slowly widen your knees apart as far as comfortable", cueType: "verbal" },
      { text: "Turn your feet outward so the insides of your feet rest on the floor", cueType: "verbal" },
      { text: "Sink your hips back and down toward the floor — let gravity do the work", cueType: "verbal" },
      { text: "Hold and breathe deeply. You should feel a stretch in your inner thighs", cueType: "verbal" },
      { text: "If it's too intense, don't go as wide. Find a stretch you can hold for 60-90 seconds", cueType: "verbal" },
    ],
    regressions: [
      { name: "Supine Butterfly Stretch", description: "Lie on your back with soles of feet together and knees falling outward. Less intense adductor stretch." },
      { name: "Narrow Frog Pose", description: "Don't spread knees as wide. Reduce stretch intensity while maintaining the position." },
    ],
    progressions: [
      { name: "Frog Pose with Forward Rock", description: "Gently rock hips forward and back while in frog position. Dynamically explores end-range." },
      { name: "Weighted Frog Pose", description: "Place a sandbag or weight plate on the hips. Gravity-assisted deeper stretch." },
    ],
  },
];

export async function seedExercises() {
  logSection("Exercises");

  const movementMap = new Map<string, string>();
  const movs = await prisma.movement.findMany({ select: { id: true, slug: true } });
  for (const m of movs) movementMap.set(m.slug, m.id);

  const muscleMap = new Map<string, string>();
  const muscs = await prisma.muscle.findMany({ select: { id: true, slug: true } });
  for (const m of muscs) muscleMap.set(m.slug, m.id);

  const taskMap = new Map<string, string>();
  const tsks = await prisma.functionalTask.findMany({ select: { id: true, slug: true } });
  for (const t of tsks) taskMap.set(t.slug, t.id);

  for (const ex of exercises) {
    const exercise = await prisma.exercise.upsert({
      where: { slug: ex.slug },
      update: {
        name: ex.name,
        description: ex.description,
        confidence: ex.confidence,
        notes: ex.notes,
        dosing: ex.dosing,
        emgNotes: ex.emgNotes,
        evidenceLevel: ex.evidenceLevel,
        difficulty: ex.difficulty,
        equipment: ex.equipment ?? [],
        bodyPosition: ex.bodyPosition,
      },
      create: {
        slug: ex.slug,
        name: ex.name,
        description: ex.description,
        status: "draft",
        confidence: ex.confidence,
        notes: ex.notes,
        dosing: ex.dosing,
        emgNotes: ex.emgNotes,
        evidenceLevel: ex.evidenceLevel,
        difficulty: ex.difficulty,
        equipment: ex.equipment ?? [],
        bodyPosition: ex.bodyPosition,
      },
    });

    // Movement links
    for (const ms of ex.movementSlugs) {
      const movementId = movementMap.get(ms);
      if (!movementId) throw new Error(`Movement not found: ${ms}`);
      await prisma.exerciseMovement.upsert({
        where: { exerciseId_movementId: { exerciseId: exercise.id, movementId } },
        update: {},
        create: { exerciseId: exercise.id, movementId },
      });
    }

    // Muscle roles
    for (const mr of ex.muscleRoles) {
      const muscleId = muscleMap.get(mr.muscleSlug);
      if (!muscleId) throw new Error(`Muscle not found: ${mr.muscleSlug}`);
      await prisma.exerciseMuscle.upsert({
        where: { exerciseId_muscleId: { exerciseId: exercise.id, muscleId } },
        update: { role: mr.role, notes: mr.notes },
        create: { exerciseId: exercise.id, muscleId, role: mr.role, notes: mr.notes },
      });
    }

    // Functional task links
    if (ex.functionalTaskSlugs) {
      for (const ts of ex.functionalTaskSlugs) {
        const functionalTaskId = taskMap.get(ts);
        if (!functionalTaskId) throw new Error(`Functional task not found: ${ts}`);
        await prisma.exerciseFunctionalTask.upsert({
          where: { exerciseId_functionalTaskId: { exerciseId: exercise.id, functionalTaskId } },
          update: {},
          create: { exerciseId: exercise.id, functionalTaskId },
        });
      }
    }

    // Cues
    await prisma.cue.deleteMany({ where: { exerciseId: exercise.id } });
    for (let i = 0; i < ex.cues.length; i++) {
      await prisma.cue.create({
        data: {
          text: ex.cues[i].text,
          cueType: ex.cues[i].cueType,
          order: i,
          exerciseId: exercise.id,
        },
      });
    }

    // Regressions
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

    // Progressions
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
  }

  logCount("exercises", exercises.length);
}
