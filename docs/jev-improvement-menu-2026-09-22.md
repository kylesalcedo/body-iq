# Jev improvement menu - 2026-09-22

Angles where Jev can improve Body IQ, grounded in what the repo actually holds
(v0.3.0: 305 exercises, 309 sources, 1,097 cues, 2,024 exercise-muscle rows,
484 regressions, 550 progressions, 605 exercise-goal links, 37 goals).

Cost basis: $0.042 per million input tokens, measured on this repo at about
750 tokens per evidence packet and 1,250 per abstract-sized intake call.
Every angle keeps the same rules: Jev answers multiple-choice / score / noul
questions, humans approve changes, nothing writes to the database, and all
content stays educational and non-diagnostic.

What Jev does not do here: write prose. The call shape used in this repo
returns choices, scores, and probabilities. The repo has no quiz items, so
"question generation" and "distractor quality" do not apply. Text rewriting
(cues, rationales) stays with the existing prompt flows; Jev can pick which
records need it and check the result.

| # | Angle | Status | What Jev answers | Scope | Est. cost per full pass | Feeds |
|---|---|---|---|---|---|---|
| 1 | Evidence agreement gate | Built, live | supported / thin / unsupported / conflicting + review p | 318 packets | $0.010 (measured) | human-review.json, review queue |
| 2 | Research-article intake | Built, live pilot | relevance, design, finding, review p per PubMed candidate | 13 rehab goals; extend to 24 other goals | $0.003 per 13 goals (measured); about $0.009 for all 37 | proposed-citations.md -> ingest:citations -> resolve-sources -> score |
| 3 | Evidence-level overclaim check | Run 2026-09-22 ($0.0078; 153 overstated by both) | Does stored `evidenceLevel` match linked evidence? (matches / overstated / understated) | 234 exercises marked moderate or strong; 188 exercises have no linked source | about $0.01 | confidence rubric, score EVIDENCE validator, triage |
| 4 | Citation freshness | Run 2026-09-22 ($0.0019; 14 refresh candidates) | For each older source, is a newer SR/guideline on the same topic consistent / superseding / unrelated? | 121 of 309 sources are pre-2016 | about $0.03 (5 PubMed candidates each) | resolve-sources, intake shortlist |
| 5 | Cue focus labeling | Run 2026-09-22 ($0.0208; 60% vs stored, not applied) | internal / external / tactile / imagery / instruction per cue, checked against the regex audit | 505 of 1,097 cues have no focus label | about $0.014 | cue:audit, cue-rewrite prompts |
| 6 | Muscle-role coherence | Proposed | primary / secondary / stabilizer / not-involved vs stored role | 2,024 exercise-muscle rows | about $0.034 | score COHERENCE validator, apply-verified-muscles |
| 7 | Difficulty calibration | Proposed | beginner / intermediate / advanced vs stored, plus whether each progression edge is harder and each regression easier | 305 exercises, 1,034 edges | about $0.02 | progression graph, planner |
| 8 | Exercise-goal relevance and caution flags | Proposed | essential / supportive / weak link, and noul "needs an educational caution note" | 605 links, 66 with caution text | about $0.01 | goal pages; a human writes any caution wording |
| 9 | Pre-filter for validate-agent | Proposed | Which queued entities are worth a Claude review call | draft queue (all 305 exercises are draft) | under $0.01 | cuts Claude spend in validate:agent |
| 10 | Release CI pass | Proposed | Runs 1, 2 (dry), 3, and triage on each tagged release | whole dataset | about $0.03 per release | release notes, human queue |

## Findings from building 1 and 2

- Rehab goals are the best entry for evidence building: condition-level PubMed
  search gave 31 direct candidates from 61, with 90% design agreement.
- Exercise-name search is weak (23 of 40 names had zero PubMed hits). Route
  exercise evidence through goals, movements, or muscles.
- Jev rates nearly every new article as worth a human read before linking
  (review p never below 0.37). Keep that as the default; use the shortlist to
  order reading, not to skip it.
- Schema gap: `SourceOnEntity` has no Goal FK, so condition-level evidence
  cannot be stored against a goal. Adding `goalId` is a small migration and the
  main unlock for angle 2.

## Suggested order

1. Add the Goal <-> Source link, then approve the 18-article intake shortlist.
2. Evidence-level overclaim check (3): cheapest high-signal fix, since 188
   exercises have no sources but most carry a moderate or strong label.
3. Citation freshness (4) and cue labeling (5).
4. Coherence, difficulty, and goal-link checks (6-8) once 1-3 have shrunk the queue.

Results for 3-5 and cross-source verification: docs/jev-audits-2026-09-22.md.
