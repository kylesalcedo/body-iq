/**
 * Authoring-prompt builders for coverage gaps.
 *
 * Single source of truth shared by:
 *   - scripts/prompt-gaps.ts   (batch CLI: writes prompts/ files)
 *   - the /coverage heatmap UI  (per-cell "copy prompt" buttons)
 *
 * Prompts follow the project's evidence conventions (no project-internal
 * references, real citations only, "insufficient evidence" over fabrication).
 */

export type MovementGap = { region: string; movement: string };
export type MuscleGap = { name: string; asPrimary: number };

/** "Cervical Spine" + "Cervical Retraction" → "Cervical Retraction" (dedupe region stem). */
function qualifiedMovement(region: string, movement: string): string {
  const regionStem = region.split(" ")[0].replace(/s$/, "").toLowerCase();
  const movementHasRegion = movement.toLowerCase().includes(regionStem);
  return movementHasRegion ? movement : `${region} ${movement}`;
}

/** Prompt to author exercises for one under-covered movement. */
export function movementGapPrompt(g: MovementGap): string {
  const movement = qualifiedMovement(g.region, g.movement);
  const movementLower = movement.toLowerCase();

  return `# Evidence-Based Exercises for ${movement}

Provide **4–6 evidence-based exercises** that train ${movementLower}. Prioritize peer-reviewed support (EMG studies, RCTs, systematic reviews).

For each exercise, provide:

1. **Exercise name** and a 1–2 sentence description
2. **Primary / secondary / stabilizer muscles** with EMG % MVIC where published
3. **Equipment** (bodyweight, dumbbell, band, cable, machine, etc.)
4. **Evidence-based dosing** — sets, reps, frequency, with source
5. **Coaching cues** (2–4 concise cues, mix verbal and tactile)
6. **Regressions and progressions**
7. **Clinical indications** — the patient populations for which this exercise has validation
8. **Evidence level** — strong / moderate / limited / expert-opinion
9. **Citations** — author, year, journal, DOI/PMID

## Companion questions

1. What is the biomechanical rationale for training ${movementLower} in isolation versus as part of compound movement patterns?
2. Which populations benefit most from direct ${movementLower} training (rehabilitation, sport performance, aging)?
3. Are there common substitution patterns or compensations to monitor during ${movementLower} loading?

## Deliverable format

Markdown, H3 per exercise. End with a summary table:

| Exercise | Primary muscle (% MVIC) | Evidence level | Key citation |

If fewer than four evidence-based options exist, say "insufficient evidence" rather than fabricating content.
`;
}

/** Prompt to author primary-activator exercises for one or more under-covered muscles. */
export function muscleGapPrompt(group: MuscleGap[]): string {
  const byName = group
    .slice(0, 12)
    .map(
      (m) =>
        `- **${m.name}** (currently a primary mover in ${m.asPrimary} exercise${m.asPrimary === 1 ? "" : "s"})`
    )
    .join("\n");

  return `# Primary-Activator Exercises for Underrepresented Muscles

For each muscle below, identify **2–4 exercises** where it is the **primary activator** (not secondary, synergist, or stabilizer). Prioritize exercises with EMG validation showing the muscle at ≥40% MVIC or peak activation among comparative studies.

${byName}

For each exercise, provide:

1. **Exercise name** and a 1–2 sentence description
2. **EMG data** — % MVIC for the target muscle plus comparator muscles where available
3. **Equipment** and positioning
4. **Evidence-based dosing** from the source study
5. **Coaching cues** (2–4 concise cues, including tactile cues to discourage substitution)
6. **Regressions and progressions**
7. **Clinical indications** and contraindications
8. **Evidence level** — strong / moderate / limited / expert-opinion
9. **Citations** — author, year, journal, DOI/PMID

## Companion questions

1. For each muscle, what is the common **substitution pattern** when it is weak or inhibited? How should the exercise be cued to minimize substitution?
2. Are there muscles in this list for which **isolation training has no evidence** of being superior to compound-movement training? If so, flag them and explain.

## Deliverable format

Markdown, H3 per muscle, H4 per exercise. End with a summary table:

| Muscle | Best-evidence exercise | % MVIC | Evidence level | Key citation |

Flag any muscle for which fewer than two well-validated primary-activator exercises exist.
`;
}

/** Batch prompt covering several under-covered movements in one request. */
export function movementGapBatchPrompt(gaps: MovementGap[]): string {
  const byName = gaps
    .slice(0, 15)
    .map((g) => `- **${qualifiedMovement(g.region, g.movement)}**`)
    .join("\n");

  return `# Evidence-Based Exercises for Under-Covered Movements

For each movement below, provide **3–5 evidence-based exercises** that train it. Prioritize peer-reviewed support (EMG studies, RCTs, systematic reviews).

${byName}

For each exercise, provide:

1. **Exercise name** and a 1–2 sentence description
2. **Primary / secondary / stabilizer muscles** with EMG % MVIC where published
3. **Equipment**
4. **Evidence-based dosing** — sets, reps, frequency, with source
5. **Coaching cues** (2–4 concise cues)
6. **Regressions and progressions**
7. **Evidence level** — strong / moderate / limited / expert-opinion
8. **Citations** — author, year, journal, DOI/PMID

## Deliverable format

Markdown, H3 per movement, H4 per exercise. End with a summary table:

| Movement | Exercise | Primary muscle (% MVIC) | Evidence level | Key citation |

If a movement has fewer than three evidence-based options, say "insufficient evidence" rather than fabricating content.
`;
}
