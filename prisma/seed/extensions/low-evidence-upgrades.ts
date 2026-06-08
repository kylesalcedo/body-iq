import { prisma, logSection, logCount } from "../client";

/**
 * Low-evidence exercise reconciliation — OpenEvidence response (2026-04-20).
 *
 * Upgrades Bicep Curl evidence level, adds cross-reference note to Sidelying
 * Hip Adduction pointing at Copenhagen Adduction (the strong-evidence analog,
 * already in the DB), and adds one new consolidated exercise: 6-direction
 * Wrist Resistance Training (Chu 2018).
 */

async function upgradeBicepCurl() {
  logSection("Bicep Curl evidence upgrade");

  const res = await prisma.exercise.updateMany({
    where: { slug: "bicep-curl" },
    data: {
      evidenceLevel: "moderate",
      notes:
        "Evidence upgraded from limited → moderate. Single-joint bicep curl produces significantly greater elbow-flexor hypertrophy than multi-joint alternatives (11.06% vs. 5.16% over 8 weeks at 3–6 sets × 8–12 reps to failure, 2×/wk) [Mannarino 2021, PMID 31268995]. EMG 20–50% MVIC in supination; dumbbell curl 50–95% peak RMS [Oliveira 2009; Borms 2017]. Incline and preacher variations produce regional hypertrophy differences — incline favors proximal growth [Kassiano 2025].",
      emgNotes:
        "20–50% MVIC biceps brachii in supinated grip; 50–95% peak RMS during concentric dumbbell curl [Oliveira 2009, Borms 2017].",
    },
  });
  logCount("bicep-curl updated", res.count);
}

async function crossReferenceSidelyingAdduction() {
  logSection("Sidelying Hip Adduction → Copenhagen cross-reference");

  const res = await prisma.exercise.updateMany({
    where: { slug: "hip-adduction-sidelying" },
    data: {
      notes:
        "Limited evidence in isolation. For strong-evidence adductor training, see Copenhagen Adduction Exercise — long-lever variation produces 108% MVIC (highest of any adduction exercise) with RCT-validated 17.83% muscle-thickness gains over 8 weeks [Serner 2014 PMID 23511698; Alonso-Fernández 2022 PMID 35682148; Collings 2026 PMID 41931009]. Use sidelying as a regression or for populations who cannot tolerate the long-lever demand.",
    },
  });
  logCount("sidelying-hip-adduction updated", res.count);
}

async function addWristResistance6Direction() {
  logSection("New exercise: 6-Direction Wrist Resistance Training");

  const movementSlugs = [
    "wrist-flexion",
    "wrist-extension",
    "radial-deviation",
    "ulnar-deviation",
    "forearm-pronation",
    "forearm-supination",
  ];
  const movements = await prisma.movement.findMany({
    where: { slug: { in: movementSlugs } },
    select: { id: true, slug: true },
  });
  const missingMov = movementSlugs.filter(
    (s) => !movements.some((m) => m.slug === s),
  );
  if (missingMov.length) {
    console.warn(`  missing movements — skipping: ${missingMov.join(", ")}`);
    return;
  }

  const muscleSlugs = [
    "flexor-carpi-radialis",
    "flexor-carpi-ulnaris",
    "extensor-carpi-radialis-longus",
    "extensor-carpi-radialis-brevis",
    "extensor-carpi-ulnaris",
    "pronator-teres",
    "supinator",
  ];
  const muscles = await prisma.muscle.findMany({
    where: { slug: { in: muscleSlugs } },
    select: { id: true, slug: true },
  });
  const muscleById = new Map(muscles.map((m) => [m.slug, m.id]));

  const ex = await prisma.exercise.upsert({
    where: { slug: "wrist-resistance-6-direction" },
    update: {
      name: "6-Direction Wrist Resistance Training",
      description:
        "Comprehensive resistance-training protocol loading all six wrist and forearm motions: flexion, extension, radial deviation, ulnar deviation, pronation, and supination. Performed with dumbbell or band resistance at the forearm/hand. A 6-week RCT showed significant motor-control improvements by week 2 and strength gains (1RM and isokinetic) by week 4 compared to ROM-only training.",
      notes:
        "Consolidates isolated wrist curls and wrist-deviation exercises under a single evidence-based protocol. Evidence: Chu 2018 (PMID 28759532) — RCT with objective 1RM and isokinetic outcomes. Moderate evidence.",
      dosing:
        "6 directions × progressive resistance, ~3 sets × 10–15 reps per direction, 2–3×/wk for 6 weeks minimum.",
      emgNotes:
        "Thera-band wrist work: flexion 3.8–15.7% MVIC, extension 20.2–34.8% MVIC. Strength outcomes measured via 1RM + isokinetic testing [Chu 2018].",
      evidenceLevel: "moderate",
      difficulty: "beginner",
      equipment: ["dumbbell", "resistance-band"],
      bodyPosition: "seated",
    },
    create: {
      slug: "wrist-resistance-6-direction",
      name: "6-Direction Wrist Resistance Training",
      description:
        "Comprehensive resistance-training protocol loading all six wrist and forearm motions: flexion, extension, radial deviation, ulnar deviation, pronation, and supination. Performed with dumbbell or band resistance at the forearm/hand. A 6-week RCT showed significant motor-control improvements by week 2 and strength gains (1RM and isokinetic) by week 4 compared to ROM-only training.",
      status: "draft",
      confidence: 0.8,
      notes:
        "Consolidates isolated wrist curls and wrist-deviation exercises under a single evidence-based protocol. Evidence: Chu 2018 (PMID 28759532) — RCT with objective 1RM and isokinetic outcomes. Moderate evidence.",
      dosing:
        "6 directions × progressive resistance, ~3 sets × 10–15 reps per direction, 2–3×/wk for 6 weeks minimum.",
      emgNotes:
        "Thera-band wrist work: flexion 3.8–15.7% MVIC, extension 20.2–34.8% MVIC. Strength outcomes measured via 1RM + isokinetic testing [Chu 2018].",
      evidenceLevel: "moderate",
      difficulty: "beginner",
      equipment: ["dumbbell", "resistance-band"],
      bodyPosition: "seated",
    },
  });

  for (const m of movements) {
    await prisma.exerciseMovement.upsert({
      where: { exerciseId_movementId: { exerciseId: ex.id, movementId: m.id } },
      update: {},
      create: { exerciseId: ex.id, movementId: m.id },
    });
  }

  const muscleRoles: {
    muscleSlug: string;
    role: "primary" | "secondary";
    notes?: string;
  }[] = [
    { muscleSlug: "flexor-carpi-radialis", role: "primary", notes: "Flexion + radial deviation" },
    { muscleSlug: "flexor-carpi-ulnaris", role: "primary", notes: "Flexion + ulnar deviation" },
    { muscleSlug: "extensor-carpi-radialis-longus", role: "primary", notes: "Extension + radial deviation" },
    { muscleSlug: "extensor-carpi-radialis-brevis", role: "primary", notes: "Extension + radial deviation" },
    { muscleSlug: "extensor-carpi-ulnaris", role: "primary", notes: "Extension + ulnar deviation" },
    { muscleSlug: "pronator-teres", role: "primary", notes: "Pronation" },
    { muscleSlug: "supinator", role: "primary", notes: "Supination" },
  ];
  for (const mr of muscleRoles) {
    const muscleId = muscleById.get(mr.muscleSlug);
    if (!muscleId) continue;
    await prisma.exerciseMuscle.upsert({
      where: {
        exerciseId_muscleId: { exerciseId: ex.id, muscleId },
      },
      update: { role: mr.role, notes: mr.notes },
      create: {
        exerciseId: ex.id,
        muscleId,
        role: mr.role,
        notes: mr.notes,
      },
    });
  }

  await prisma.cue.deleteMany({ where: { exerciseId: ex.id } });
  const cues = [
    {
      text: "Rest the forearm on a table with the hand off the edge — isolates the wrist from shoulder/elbow compensation.",
      cueType: "verbal",
    },
    {
      text: "Cycle all 6 directions in a single session: flexion → extension → radial → ulnar → pronation → supination.",
      cueType: "verbal",
    },
    {
      text: "Keep the forearm quiet — movement at the wrist/forearm only, not the elbow.",
      cueType: "tactile",
    },
    {
      text: "Progress load only when the current weight feels easy for 3×15 in all six directions.",
      cueType: "verbal",
    },
  ];
  for (let i = 0; i < cues.length; i++) {
    await prisma.cue.create({
      data: {
        text: cues[i].text,
        cueType: cues[i].cueType,
        order: i,
        exerciseId: ex.id,
      },
    });
  }

  await prisma.regression.deleteMany({ where: { exerciseId: ex.id } });
  const regressions = [
    {
      name: "Isometric 6-Direction Holds",
      description:
        "Perform isometric holds against the opposite hand in each direction — no equipment, no motion. Builds tolerance before dynamic loading.",
    },
    {
      name: "Theraband Resistance",
      description:
        "Elastic band (lowest color) instead of dumbbell — easier to grade and produces 3.8–15.7% MVIC flexion / 20.2–34.8% MVIC extension.",
    },
  ];
  for (let i = 0; i < regressions.length; i++) {
    await prisma.regression.create({
      data: {
        name: regressions[i].name,
        description: regressions[i].description,
        order: i,
        exerciseId: ex.id,
      },
    });
  }

  await prisma.progression.deleteMany({ where: { exerciseId: ex.id } });
  const progressions = [
    {
      name: "Progressive Dumbbell Loading",
      description:
        "Step up dumbbell weight every 1–2 weeks per Chu 2018 protocol. Target 1RM improvement at 4 weeks.",
    },
    {
      name: "Isokinetic Testing + Targeted Loading",
      description:
        "Use an isokinetic dynamometer to identify the weakest of the 6 directions and bias volume toward it.",
    },
  ];
  for (let i = 0; i < progressions.length; i++) {
    await prisma.progression.create({
      data: {
        name: progressions[i].name,
        description: progressions[i].description,
        order: i,
        exerciseId: ex.id,
      },
    });
  }

  logCount("wrist-resistance-6-direction upserted", 1);
}

export async function seedLowEvidenceUpgradesExtension() {
  logSection("Low-evidence exercise reconciliation");
  await upgradeBicepCurl();
  await crossReferenceSidelyingAdduction();
  await addWristResistance6Direction();
}
