# Body IQ × Jev — review triage validation pass

**Date:** 2026-09-22 · **Repo:** kylesalcedo/body-iq · **PR:** [#3](https://github.com/kylesalcedo/body-iq/pull/3) (branch `review-triage` from the kyle-instinct fork, Kyle's merge gate) · **Data:** v0.3.0 dataset export, 305 exercises

## What ran

One full validation pass, per Kyle's "do it once and get the data":

1. **Deterministic stage (free):** the repo's own four qualityScore validators (evidence / coherence / completeness / rigor) plus the Wulf cue audit, ported faithfully onto the Postgres-free dataset export. Derived the four approved triage triggers: conflicting evidence, weak cue/source match, suspiciously confident entries, research gaps.
2. **Jev stage (advisory):** all 305 records, one batched call each (`review_priority` score 0–4, `primary_concern` choice, `research_gap_first` noul) against `api.typesafe.ai/v1/systemone`, concurrency 5. Numeric state only — no clinical prose. Jev ordered the queue; it touched nothing else.

**Measured cost: 305/305 calls OK, 261,825 input tokens, $0.010997 — 1.1 cents for a full pass.** p50 latency 120ms, max 323ms. (Dry-run estimate was $0.0068; real payloads ran ~858 tokens/call.) A monthly full pass is ~$0.13/year. Cost is a non-issue.

## What the queue surfaced

All 305 exercises are `draft` — the review backlog is the whole dataset, so ordering is the whole game.

- 188/305 records have **zero linked sources**; **135 of those claim moderate/strong evidence anyway.**
- **88 suspiciously confident** (confidence ≥ 0.75 on thin evidence), 37 of those ≥ 0.85 with no sources at all.
- 13 coherence conflicts, 2 high + 20 medium unresolved audit flags.
- Jev's concern picks: evidence-gap 206, overconfident-metadata 71, coherence-conflict 16, completeness-gap 12.
- Top 5 Jev-ranked: **side-bridge** (0.88 confidence, zero sources, medium audit flag), **sitting-ccf-oblique-band**, **pfm-lengthening-positions** (coherence conflict), **thumb-putty-program** and **mcgill-curl-up** (both 0.90–0.95 confidence with high audit flags). Named, popular exercises with real problems — the records most likely to mislead a reader.

Full ranked queue: `review-queue-jev.md` (top 25) and `queue-jev.json` (all 305, with research-first probabilities — 187 records scored ≥0.8 for the citation-research queue).

## Did Jev add anything over the free deterministic ranking?

Yes, visibly:

- Rank correlation is moderate (Spearman 0.77) but the **top-25 overlap is only 8/25** — Jev re-ordered the head of the queue, which is the part that matters.
- **Jev demoted** a cluster of breathing and vestibular drills (box-breathing, cawthorne-cooksey, tennis-ball-foot-roll...) that the deterministic heuristic put on top because their composites are low. Those records are incomplete but low-stakes — there is little to be clinically wrong about.
- **Jev promoted** named exercises people actually look up (side-bridge, mcgill-curl-up, kettlebell-swing, upper-trapezius-stretch, wall-slide, nordic-hamstring-curl) carrying audit flags, coherence conflicts, or 0.9 confidence on zero sources. Blast radius — exactly what the raw composite deficit can't weigh.
- **Calibration checks pass:** records with high audit flags averaged priority 3.9/4, coherence conflicts 3.73, very-confident-no-sources 3.68 — while clean records with no triage signals averaged 1.56, and clean high-composite records 1.29. Jev is reading the evidence, not guessing.

## Honest verdict for the monthly decision

**Worth repeating monthly, with one caveat.** The cost is 1.1 cents — that argument is over. The deterministic layer alone produces a decent queue, but Jev's re-rank is the difference between "fix the breathing drills' missing regressions first" and "fix the famous exercises claiming evidence they don't have first." That's the review order a human would pick.

The caveat: this validates internal consistency, not outcomes. Nobody has worked the queue yet, so we don't know whether Jev's order predicts which records Kyle actually edits. Recommended validation before committing: Kyle works the top of the queue once; we compare his actual edits against Jev's top ranks. If the hit rate is good, make it monthly (fresh export each time, pennies).

One tuning note for the next pass: Jev scored 232/305 records ≥ 3.0, so the order inside band 3 carries the signal — a future tweak could ask for finer resolution there, but the top ~60 are cleanly separated and that's a workable queue as-is.

## Caveats

- Snapshot is the v0.3.0 release export (Aug 4): 305 exercises matches current main, but the source layer predates the citations sync (309 linked sources here vs ~435 after ingest) and the newest progression-edge typing. The pipeline reads any export, so a fresh `pnpm export:dataset` rerun covers current main exactly.
- Jev output is advisory ordering only — no clinical truth, no citations, no status changes. Promotion stays a human act.
- The triage script lives on PR #3; it defaults to a dry run (no network), and `--run` always logs measured spend to `exports/review-triage/spend-log.json`.
