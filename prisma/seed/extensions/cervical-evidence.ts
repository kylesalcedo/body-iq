import { prisma, logSection, logCount } from "../client";

/**
 * Cervical evidence reconciliation — literature review responses (2026-04-20).
 *
 * The literature does not support "Cervical Protraction" or "Cervical Retraction"
 * as isolated therapeutic movements. Retraction is studied as **craniocervical
 * flexion (CCF)** — protraction is a postural fault, not a training target.
 * Upper Cervical Extension has limited high-quality evidence.
 *
 * This extension:
 *   1. Rewrites the clinical notes on the three affected movements so the
 *      movement detail pages explain the nuance.
 *   2. Links existing CCF / chin-tuck exercises to the `cervical-retraction`
 *      movement (clinical shorthand → CCF exercises).
 *   3. Adds one new exercise (Sitting CCF with Oblique Elastic Band) — the only
 *      clearly novel, accessible intervention from the three responses.
 */

const CERVICAL_RETRACTION_NOTES = [
  "Clinical context: peer-reviewed literature does not study cervical retraction as",
  "an isolated movement. The evidence-based analog is craniocervical flexion (CCF)",
  "— upper cervical flexion with a subtle posterior head translation — which",
  "preferentially activates longus colli and longus capitis with minimal SCM",
  "activation. The exercises below are CCF-based interventions, which is what",
  "clinicians typically mean when they prescribe \"retraction\" or \"chin tuck.\"",
  "Evidence: Falla 2012 (PMID 22156825), Blomgren 2018 (PMID 30486819), Cagnie",
  "2008 (PMID 17991788).",
].join(" ");

const CERVICAL_PROTRACTION_NOTES = [
  "Clinical context: cervical protraction is an observational/postural finding,",
  "not a therapeutic training target. Literature treats forward-head posture as",
  "the condition to reduce via craniocervical flexion training — not as a",
  "movement to train. No evidence-based exercises load this pattern as a goal.",
].join(" ");

const UPPER_CERVICAL_EXTENSION_NOTES = [
  "Evidence caveat: no published EMG % MVIC data isolates the upper cervical",
  "extensors (rectus capitis posterior major/minor, obliquus capitis superior/",
  "inferior). Most cervical-extension research pools extensor groups together.",
  "Strongest evidence for upper-cervical-specific training is device-guided",
  "(Spinertial) craniocervical extension in cervicogenic headache populations",
  "(Pardos-Aguilella 2024). Label downstream prescriptions as moderate, not strong.",
].join(" ");

async function updateMovementNotes() {
  logSection("Cervical movement clinical notes");

  const updates = [
    {
      slug: "cervical-retraction",
      description:
        "Posterior translation of the head on the neck (chin tuck). Combines upper cervical flexion with lower cervical extension. In research literature, trained as craniocervical flexion (CCF) — see notes for clinical context.",
      notes: CERVICAL_RETRACTION_NOTES,
    },
    {
      slug: "cervical-protraction",
      description:
        "Anterior translation of the head on the neck (forward-head posture). Upper cervical extension with lower cervical flexion. Treated as a postural observation, not a therapeutic training target — see notes.",
      notes: CERVICAL_PROTRACTION_NOTES,
    },
    {
      slug: "cervical-extension-upper",
      notes: UPPER_CERVICAL_EXTENSION_NOTES,
    },
  ];

  let count = 0;
  for (const u of updates) {
    const res = await prisma.movement.updateMany({
      where: { slug: u.slug },
      data: {
        ...(u.description ? { description: u.description } : {}),
        notes: u.notes,
      },
    });
    count += res.count;
  }
  logCount("cervical movements updated", count);

  // Tag movements where the evidence gap has been reviewed and accepted so the
  // prompt-gaps scanner stops re-emitting literature review prompts for them.
  const gapTag = await prisma.tag.upsert({
    where: { slug: "evidence-gap-accepted" },
    update: {},
    create: {
      slug: "evidence-gap-accepted",
      name: "Evidence gap accepted",
      category: "review-state",
    },
  });

  const acceptedGapSlugs = ["cervical-protraction", "cervical-extension-upper"];
  for (const slug of acceptedGapSlugs) {
    const mov = await prisma.movement.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!mov) continue;
    const existing = await prisma.tagOnEntity.findFirst({
      where: { movementId: mov.id, tagId: gapTag.id },
      select: { id: true },
    });
    if (!existing) {
      await prisma.tagOnEntity.create({
        data: {
          entityType: "Movement",
          movementId: mov.id,
          tagId: gapTag.id,
        },
      });
    }
  }
  logCount("evidence-gap-accepted tags applied", acceptedGapSlugs.length);
}

async function linkCcfExercisesToRetraction() {
  logSection("CCF exercises → cervical-retraction movement");

  const retraction = await prisma.movement.findUnique({
    where: { slug: "cervical-retraction" },
    select: { id: true },
  });
  if (!retraction) {
    console.warn("  cervical-retraction movement not found — skipping");
    return;
  }

  // These existing exercises are all CCF / chin-tuck based and should show up
  // when a clinician browses the Cervical Retraction movement page.
  const exerciseSlugs = [
    "deep-neck-flexor-training",
    "supine-chin-tuck-liftoff",
    "suboccipital-exercise",
    "scapular-stability-rows",
  ];

  let linked = 0;
  for (const slug of exerciseSlugs) {
    const ex = await prisma.exercise.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!ex) {
      console.warn(`  exercise not found: ${slug} — skipping`);
      continue;
    }
    await prisma.exerciseMovement.upsert({
      where: {
        exerciseId_movementId: {
          exerciseId: ex.id,
          movementId: retraction.id,
        },
      },
      update: {},
      create: { exerciseId: ex.id, movementId: retraction.id },
    });
    linked += 1;
  }

  logCount("exercise→retraction links", linked);
}

async function addSittingCcfObliqueBand() {
  logSection("New exercise: Sitting CCF with Oblique Elastic Band");

  const retraction = await prisma.movement.findUnique({
    where: { slug: "cervical-retraction" },
    select: { id: true },
  });
  const upperFlexion = await prisma.movement.findUnique({
    where: { slug: "cervical-flexion-upper" },
    select: { id: true },
  });
  const dcf = await prisma.muscle.findUnique({
    where: { slug: "deep-cervical-flexors" },
    select: { id: true },
  });
  const scm = await prisma.muscle.findUnique({
    where: { slug: "sternocleidomastoid" },
    select: { id: true },
  });
  if (!retraction || !upperFlexion || !dcf || !scm) {
    console.warn("  prerequisite movement/muscle missing — skipping");
    return;
  }

  const ex = await prisma.exercise.upsert({
    where: { slug: "sitting-ccf-oblique-band" },
    update: {
      name: "Sitting Craniocervical Flexion with Oblique Band Resistance",
      description:
        "Seated craniocervical flexion performed against an elastic band anchored to the ipsilateral side in an oblique plane (combining lateral flexion with extension resistance). Ipsilateral oblique resistance preferentially activates longus colli compared to straight lateral or contralateral forces.",
      notes:
        "Evidence: Prodoehl 2025, Musculoskeletal Science & Practice (PMID 39862671). Ipsilateral oblique resistance produces significantly higher longus colli activation than contralateral oblique (p=0.002, Cohen's d = -0.84). Sitting version activates longus colli equivalent to supine CCF (p=0.758). Useful when patients cannot tolerate supine positioning or need upright functional progressions.",
      dosing:
        "10 reps × 10-sec holds, 2×/day for 6 weeks. Moderate elastic band tension, anchored at shoulder height on the ipsilateral side.",
      emgNotes:
        "Longus colli activation: ipsilateral oblique > contralateral (Cohen's d = -0.82). Straight lateral resistance activates SCM more — avoid. Sitting with oblique resistance ≈ supine CCF [Prodoehl 2025].",
      evidenceLevel: "moderate",
      difficulty: "intermediate",
      equipment: ["resistance-band"],
      bodyPosition: "seated",
    },
    create: {
      slug: "sitting-ccf-oblique-band",
      name: "Sitting Craniocervical Flexion with Oblique Band Resistance",
      description:
        "Seated craniocervical flexion performed against an elastic band anchored to the ipsilateral side in an oblique plane (combining lateral flexion with extension resistance). Ipsilateral oblique resistance preferentially activates longus colli compared to straight lateral or contralateral forces.",
      status: "draft",
      confidence: 0.8,
      notes:
        "Evidence: Prodoehl 2025, Musculoskeletal Science & Practice (PMID 39862671). Ipsilateral oblique resistance produces significantly higher longus colli activation than contralateral oblique (p=0.002, Cohen's d = -0.84). Sitting version activates longus colli equivalent to supine CCF (p=0.758). Useful when patients cannot tolerate supine positioning or need upright functional progressions.",
      dosing:
        "10 reps × 10-sec holds, 2×/day for 6 weeks. Moderate elastic band tension, anchored at shoulder height on the ipsilateral side.",
      emgNotes:
        "Longus colli activation: ipsilateral oblique > contralateral (Cohen's d = -0.82). Straight lateral resistance activates SCM more — avoid. Sitting with oblique resistance ≈ supine CCF [Prodoehl 2025].",
      evidenceLevel: "moderate",
      difficulty: "intermediate",
      equipment: ["resistance-band"],
      bodyPosition: "seated",
    },
  });

  for (const movementId of [retraction.id, upperFlexion.id]) {
    await prisma.exerciseMovement.upsert({
      where: {
        exerciseId_movementId: { exerciseId: ex.id, movementId },
      },
      update: {},
      create: { exerciseId: ex.id, movementId },
    });
  }

  const muscleRoles = [
    {
      muscleId: dcf.id,
      role: "primary" as const,
      notes:
        "Longus colli preferentially activated with ipsilateral oblique resistance (Cohen's d = -0.82) [Prodoehl 2025]",
    },
    {
      muscleId: scm.id,
      role: "stabilizer" as const,
      notes: "Should remain soft on palpation — minimize activation",
    },
  ];
  for (const mr of muscleRoles) {
    await prisma.exerciseMuscle.upsert({
      where: {
        exerciseId_muscleId: {
          exerciseId: ex.id,
          muscleId: mr.muscleId,
        },
      },
      update: { role: mr.role, notes: mr.notes },
      create: {
        exerciseId: ex.id,
        muscleId: mr.muscleId,
        role: mr.role,
        notes: mr.notes,
      },
    });
  }

  await prisma.cue.deleteMany({ where: { exerciseId: ex.id } });
  const cues = [
    {
      text: "Anchor the band at shoulder height on the same side you'll resist — ipsilateral.",
      cueType: "verbal",
    },
    {
      text: "Tuck your chin and resist the diagonal pull — don't let the head drift forward.",
      cueType: "verbal",
    },
    {
      text: "Keep shoulders relaxed and down; palpate the SCM — it should stay soft.",
      cueType: "tactile",
    },
    {
      text: "Avoid a straight lateral pull — that recruits superficial muscles.",
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
      name: "Unresisted Seated CCF",
      description:
        "Perform the chin tuck without the band to groove the motor pattern first.",
    },
    {
      name: "Lighter Band Tension",
      description:
        "Use a lighter resistance band — quality of the chin-tuck pattern matters more than load.",
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
      name: "Longer Isometric Holds",
      description:
        "Extend the hold to 5–10 seconds at end-range before releasing.",
    },
    {
      name: "Increase Band Tension",
      description:
        "Step up resistance only once SCM remains soft and the chin-tuck is precise.",
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

  logCount("exercise upserted", 1);
}

export async function seedCervicalEvidenceExtension() {
  logSection("Cervical evidence reconciliation (CCF / retraction / protraction)");
  await updateMovementNotes();
  await linkCcfExercisesToRetraction();
  await addSittingCcfObliqueBand();
}
