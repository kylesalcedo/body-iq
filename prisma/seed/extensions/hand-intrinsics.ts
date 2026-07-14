import { prisma, logSection, logCount } from "../client";
import { MuscleRole } from "@prisma/client";

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
  notes?: string;
};

const exercises: ExerciseSpec[] = [
  {
    slug: "intrinsic-plus-hold",
    name: "Intrinsic-Plus Position Hold",
    description:
      "Isometric hold at MCP flexion 60–90° with simultaneous IP extension. Targets lumbricals; guards against claw-hand deformity.",
    dosing: "3–10 reps, 5–10 s holds, daily (extrapolated from general hand protocols).",
    emgNotes:
      "No published EMG for isolated lumbrical activation — position is anatomically rational but unvalidated.",
    evidenceLevel: "expert-opinion",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.5,
    notes:
      "Primary watch-out is FDS/FDP substitution; cue palpation at volar MCP. Position is used widely in post-op splinting protocols.",
    movementSlugs: ["finger-flexion", "finger-extension"],
    muscleRoles: [
      { muscleSlug: "lumbricals", role: "primary", notes: "No EMG data available" },
      { muscleSlug: "extensor-digitorum", role: "secondary", notes: "Provides IP extension" },
      { muscleSlug: "dorsal-interossei", role: "synergist" },
    ],
    cues: [
      { text: "Palpate volar MCP to ensure flexion occurs at MCP, not IP joints", cueType: "tactile" },
      { text: "Make a tabletop with your fingers — fingertips stay extended", cueType: "verbal" },
      { text: "Avoid wrist flexion — it recruits the extrinsic flexors", cueType: "verbal" },
    ],
    regressions: [
      { name: "Passive Positioning", description: "Therapist or opposite hand places and holds the intrinsic-plus posture." },
      { name: "Single-Finger Intrinsic-Plus", description: "One digit at a time to reduce coordination demand." },
    ],
    progressions: [
      { name: "Putty Resistance", description: "Press fingertips into putty while holding MCP flexion + IP extension." },
      { name: "Elastic-Band Resistance", description: "Band at fingertips pulling into extension, resist with intrinsic-plus." },
    ],
  },
  {
    slug: "tendon-gliding-sequence",
    name: "Tendon Gliding Sequence",
    description:
      "Sequential finger positions: straight → hook fist → straight fist → tabletop. Standard post-carpal-tunnel-release mobility protocol.",
    dosing: "10 reps of the full sequence, 3–4×/day (Peters 2016 Cochrane — widely used post-CTR).",
    emgNotes: "No isolated-lumbrical EMG validation.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.75,
    movementSlugs: ["finger-flexion", "finger-extension"],
    muscleRoles: [
      { muscleSlug: "flexor-digitorum-superficialis", role: "primary", notes: "Straight-fist phase" },
      { muscleSlug: "flexor-digitorum-profundus", role: "primary", notes: "Hook and straight-fist phases" },
      { muscleSlug: "lumbricals", role: "secondary", notes: "Tabletop phase" },
      { muscleSlug: "extensor-digitorum", role: "secondary" },
      { muscleSlug: "dorsal-interossei", role: "synergist" },
    ],
    cues: [
      { text: "Move slowly — 3–5 seconds per position", cueType: "verbal" },
      { text: "Full MCP flexion with IP extension in the tabletop position", cueType: "verbal" },
      { text: "Avoid clawing (MCP hyperextension with IP flexion)", cueType: "verbal" },
    ],
    regressions: [{ name: "Passive-Assisted Gliding", description: "Therapist assists each position." }],
    progressions: [{ name: "Resisted Tabletop", description: "Add resistance in the tabletop phase." }],
  },
  {
    slug: "rubber-band-finger-abduction",
    name: "Rubber-Band Finger Abduction",
    description:
      "Fingers abduct against an elastic band. The only intrinsic exercise with direct EMG validation for selective intrinsic activation.",
    dosing: "10–15 reps, 3×/week (extrapolated; EMG study did not specify dosing).",
    emgNotes:
      "Significantly greater 1st DI and ADM activation vs stress-ball squeeze or baoding balls; minimized EDC substitution [Boudreau 2022].",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "seated",
    confidence: 0.85,
    movementSlugs: ["finger-abduction"],
    muscleRoles: [
      { muscleSlug: "dorsal-interossei", role: "primary", notes: "Selective activation confirmed by EMG [Boudreau 2022]" },
      { muscleSlug: "abductor-digiti-minimi", role: "primary", notes: "Increased activation vs alternatives" },
      { muscleSlug: "extensor-digitorum", role: "stabilizer", notes: "Minimized — intentionally low" },
    ],
    cues: [
      { text: "Keep MCPs neutral — avoid hyperextension", cueType: "verbal" },
      { text: "Spread fingers maximally, hold 2–3 seconds", cueType: "verbal" },
      { text: "Palpate the first web space to confirm 1st DI activation", cueType: "tactile" },
    ],
    regressions: [
      { name: "Unresisted Abduction", description: "Active spread with no band." },
      { name: "Single-Finger Manual Resistance", description: "Therapist resists one digit at a time." },
    ],
    progressions: [
      { name: "Heavier Band", description: "Increase band tension incrementally." },
      { name: "Combined Abduction + MCP Flexion", description: "Abduct while holding intrinsic-plus for combined DI loading." },
    ],
  },
  {
    slug: "finger-adduction-card-squeeze",
    name: "Finger Adduction (Card Squeeze)",
    description:
      "Squeeze a card, coin, or thin object between adjacent fingers to load the palmar interossei.",
    dosing: "10 reps per finger pair, daily (no published evidence; extrapolated).",
    emgNotes: "No published EMG for palmar interossei isolation.",
    evidenceLevel: "expert-opinion",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.45,
    movementSlugs: ["finger-adduction"],
    muscleRoles: [
      { muscleSlug: "palmar-interossei", role: "primary", notes: "No EMG data" },
      { muscleSlug: "dorsal-interossei", role: "stabilizer", notes: "Antagonist; co-contraction" },
    ],
    cues: [
      { text: "Keep fingers straight — avoid MCP or IP flexion", cueType: "verbal" },
      { text: "Squeeze firmly enough to resist a gentle pull on the card", cueType: "verbal" },
    ],
    regressions: [{ name: "Thicker Objects", description: "Easier to grip." }],
    progressions: [
      { name: "Thinner Objects", description: "Paper → card stock → business card." },
      { name: "Pull Resistance", description: "Therapist pulls the card to grade effort." },
    ],
  },
  {
    slug: "thumb-opposition-sequence",
    name: "Thumb Opposition Sequence",
    description:
      "Touch thumb tip sequentially to each fingertip, emphasizing rotation of the thumb pad to face the finger pad (true opposition, not just flexion).",
    dosing: "10 reps × 3×/week (hand-OA protocols); daily for post-nerve injury.",
    emgNotes:
      "Included in multiple hand-OA and CMC-arthritis RCTs [Østerås 2017; Deveza 2021 JAMA IM; Thakker 2025 network meta-analysis].",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.8,
    movementSlugs: ["thumb-opposition", "thumb-abduction"],
    muscleRoles: [
      { muscleSlug: "opponens-pollicis", role: "primary" },
      { muscleSlug: "abductor-pollicis-brevis", role: "primary" },
      { muscleSlug: "flexor-pollicis-brevis", role: "primary" },
      { muscleSlug: "flexor-pollicis-longus", role: "secondary", notes: "Extrinsic — monitor to avoid IP hyperflexion" },
      { muscleSlug: "adductor-pollicis", role: "synergist" },
    ],
    cues: [
      { text: "Form an O with each finger — rotate, don't just flex", cueType: "verbal" },
      { text: "Avoid IP hyperextension (recruits FPL)", cueType: "verbal" },
      { text: "Palpate the thenar eminence to confirm activation", cueType: "tactile" },
    ],
    regressions: [
      { name: "Passive Opposition", description: "Opposite hand places thumb in opposition and holds." },
      { name: "Thumb-to-Index Only", description: "Simplify to one opposition pair." },
    ],
    progressions: [
      { name: "Pinch Small Objects", description: "Beads, coins, buttons for pincer precision." },
      { name: "Band-Resisted Opposition", description: "Elastic band around the thumb providing extension resistance." },
    ],
  },
  {
    slug: "pinch-strengthening",
    name: "Pinch Strengthening (Tip / Three-Jaw-Chuck / Lateral)",
    description:
      "Isometric or isotonic pinch against putty or a pinch gauge. Three grips train different thumb-finger couples: tip (FPL + FPB + 1st lumbrical), three-jaw-chuck (opponens, APB, FPB, adductor pollicis), lateral/key (adductor pollicis dominant).",
    dosing:
      "Strength: 6–10 reps × 6-s holds × 3×/week. Endurance: 10–15 reps sub-max × 3×/week.",
    emgNotes:
      "1st DI stabilizes the index finger across all pinch types. Normative data: Mathiowetz 1985.",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["pinch-gauge", "therapy-putty"],
    bodyPosition: "seated",
    confidence: 0.8,
    movementSlugs: ["thumb-opposition", "thumb-adduction", "finger-flexion"],
    muscleRoles: [
      { muscleSlug: "adductor-pollicis", role: "primary", notes: "Dominant in lateral (key) pinch" },
      { muscleSlug: "flexor-pollicis-brevis", role: "primary" },
      { muscleSlug: "opponens-pollicis", role: "primary", notes: "Three-jaw-chuck pinch" },
      { muscleSlug: "abductor-pollicis-brevis", role: "secondary" },
      { muscleSlug: "flexor-pollicis-longus", role: "secondary", notes: "Extrinsic — tip pinch" },
      { muscleSlug: "dorsal-interossei", role: "stabilizer", notes: "1st DI stabilizes index across all pinch types" },
      { muscleSlug: "lumbricals", role: "stabilizer", notes: "1st lumbrical contributes to tip pinch" },
    ],
    cues: [
      { text: "Tip pinch: keep IPs slightly flexed, avoid hyperextension", cueType: "verbal" },
      { text: "Lateral pinch: thumb IP should flex, not hyperextend", cueType: "verbal" },
      { text: "Monitor for 1st DI cramping in the first web space", cueType: "tactile" },
    ],
    regressions: [
      { name: "Soft Media Pinch", description: "Foam or low-grade putty." },
      { name: "Short Hold Time", description: "2-second holds before progressing to 6-second." },
    ],
    progressions: [
      { name: "Graded Putty Resistance", description: "Progress putty density." },
      { name: "Pinch Gauge with Progressive Load", description: "Target % of published norms for age/sex." },
      { name: "Functional Pinch Tasks", description: "Turn keys, open jars, remove pop-top lids." },
    ],
  },
  {
    slug: "isolated-small-finger-abduction",
    name: "Isolated Small-Finger Abduction",
    description:
      "Abduct the small finger away from the ring finger against a rubber band or manual resistance. Targets ADM.",
    dosing: "10–15 reps × 3×/week (extrapolated; no dosing in EMG study).",
    emgNotes: "Increased ADM activation with rubber-band resistance [Boudreau 2022].",
    evidenceLevel: "limited",
    difficulty: "beginner",
    equipment: ["resistance-band"],
    bodyPosition: "seated",
    confidence: 0.65,
    movementSlugs: ["finger-abduction"],
    muscleRoles: [
      { muscleSlug: "abductor-digiti-minimi", role: "primary", notes: "EMG-validated activation [Boudreau 2022]" },
      { muscleSlug: "dorsal-interossei", role: "secondary", notes: "3rd and 4th DI" },
      { muscleSlug: "extensor-digitorum", role: "stabilizer" },
    ],
    cues: [
      { text: "Palpate the hypothenar eminence to confirm ADM activation", cueType: "tactile" },
      { text: "Keep the small finger extended — avoid MCP flexion", cueType: "verbal" },
      { text: "Avoid ulnar deviation of the wrist", cueType: "verbal" },
    ],
    regressions: [{ name: "Active Abduction", description: "Unresisted abduction." }],
    progressions: [
      { name: "Heavier Band", description: "Increase band tension." },
      { name: "Combined Abduction + MCP Flexion", description: "Add intrinsic-plus component." },
    ],
  },
  {
    slug: "hypothenar-reactivation-bendz",
    name: "Hypothenar Reactivation (Bendz Method)",
    description:
      "Two functional grip patterns: locking grip (5th metacarpal flexion with small-finger flexion) and supporting grip (5th metacarpal flexion with small-finger extension to support a plate). Targets ADM, ODM, FDMB.",
    dosing: "Daily practice during immobilization recovery (Bendz 1993 — expert opinion).",
    emgNotes: "No EMG or RCT validation. Single-author expert opinion.",
    evidenceLevel: "expert-opinion",
    difficulty: "beginner",
    equipment: [],
    bodyPosition: "seated",
    confidence: 0.4,
    movementSlugs: ["finger-flexion"],
    muscleRoles: [
      { muscleSlug: "abductor-digiti-minimi", role: "primary" },
      { muscleSlug: "opponens-digiti-minimi", role: "primary" },
      { muscleSlug: "flexor-digiti-minimi-brevis", role: "primary" },
      { muscleSlug: "flexor-carpi-ulnaris", role: "secondary", notes: "Extrinsic contributor" },
      { muscleSlug: "palmar-interossei", role: "synergist" },
      { muscleSlug: "lumbricals", role: "stabilizer" },
    ],
    cues: [
      { text: "Locking grip: flex the 5th metacarpal first, then flex the small finger to lock", cueType: "verbal" },
      { text: "Supporting grip: flex 5th metacarpal, extend small finger to create a shelf for a plate", cueType: "verbal" },
      { text: "Palpate the hypothenar eminence to confirm activation", cueType: "tactile" },
    ],
    regressions: [{ name: "Passive Positioning", description: "Therapist positions the 5th metacarpal." }],
    progressions: [{ name: "Loaded Supporting Grip", description: "Add weight to the supported object (plate, book)." }],
  },
  {
    slug: "dexterity-training-pegboard",
    name: "Dexterity Training (Purdue Pegboard / 9-Hole Peg)",
    description:
      "Task-specific manipulation of pegs, pins, or small objects into target holes. Used as both assessment and training.",
    dosing: "10–15 minutes, 3–5×/week.",
    emgNotes:
      "Task-specific training more effective than general exercises for functional outcomes after peripheral nerve injury [Hsu 2019; Chen 2022].",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["pegboard"],
    bodyPosition: "seated",
    confidence: 0.8,
    movementSlugs: ["thumb-opposition", "finger-flexion", "finger-abduction"],
    muscleRoles: [
      { muscleSlug: "opponens-pollicis", role: "primary" },
      { muscleSlug: "abductor-pollicis-brevis", role: "primary" },
      { muscleSlug: "dorsal-interossei", role: "secondary" },
      { muscleSlug: "lumbricals", role: "secondary" },
      { muscleSlug: "flexor-digitorum-superficialis", role: "synergist" },
      { muscleSlug: "flexor-digitorum-profundus", role: "synergist" },
    ],
    cues: [
      { text: "Precision over speed initially", cueType: "verbal" },
      { text: "Mirror therapy feedback enhances cortical activation", cueType: "visual" },
      { text: "Progress large → small objects", cueType: "verbal" },
    ],
    regressions: [{ name: "Large-Bore Pegs", description: "Larger pegs and slower pace." }],
    progressions: [
      { name: "Smaller Objects", description: "Progress to smaller pegs or beads." },
      { name: "Timed Trials", description: "Standardized timed trials to track progress." },
      { name: "Bilateral Assembly", description: "Purdue Pegboard Assembly subtest." },
    ],
  },
  {
    slug: "sensory-reeducation-mirror-therapy",
    name: "Sensory Re-education with Mirror Therapy",
    description:
      "Phase 1 (early re-innervation): texture and shape identification with eyes open, then closed. Phase 2 (after 2-point discrimination returns): stereognosis and locognosia. Mirror therapy enhances cortical activation.",
    dosing:
      "Classical SRE: 5–10 min × 4×/day. Mirror therapy + SRE: 12 weeks, frequency per protocol.",
    emgNotes:
      "Not muscle-specific. Mirror therapy + SRE has moderate evidence for dexterity and functional outcomes [Xia 2021; Chen 2022].",
    evidenceLevel: "moderate",
    difficulty: "beginner",
    equipment: ["mirror-box"],
    bodyPosition: "seated",
    confidence: 0.78,
    movementSlugs: ["finger-flexion", "finger-extension"],
    muscleRoles: [
      { muscleSlug: "lumbricals", role: "stabilizer", notes: "Not the target — sensorimotor protocol" },
      { muscleSlug: "dorsal-interossei", role: "stabilizer", notes: "Not the target — sensorimotor protocol" },
    ],
    cues: [
      { text: "Phase 1: eyes open → eyes closed, identify textures and shapes", cueType: "verbal" },
      { text: "Phase 2: object identification and locognosia (where was touched)", cueType: "verbal" },
      { text: "Use a mirror box to enhance cortical activation", cueType: "visual" },
    ],
    regressions: [{ name: "Large Distinct Objects", description: "Eyes open, unambiguous textures." }],
    progressions: [
      { name: "Small Similar Objects", description: "Eyes closed, subtle texture distinctions." },
      { name: "Timed Stereognosis", description: "Moberg pick-up test formalized as training." },
    ],
  },
];

export async function seedHandIntrinsicsExtension() {
  logSection("Hand intrinsics (evidence-honest)");

  const [movs, muscs] = await Promise.all([
    prisma.movement.findMany({ select: { id: true, slug: true } }),
    prisma.muscle.findMany({ select: { id: true, slug: true } }),
  ]);
  const movementMap = new Map(movs.map((m) => [m.slug, m.id]));
  const muscleMap = new Map(muscs.map((m) => [m.slug, m.id]));

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
        equipment: ex.equipment ?? [],
        bodyPosition: ex.bodyPosition,
        confidence: ex.confidence ?? 0.6,
        notes: ex.notes,
      },
      create: {
        slug: ex.slug,
        name: ex.name,
        description: ex.description,
        status: "draft",
        confidence: ex.confidence ?? 0.6,
        notes: ex.notes,
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
  }

  logCount("hand intrinsic exercises", exercises.length);
}
