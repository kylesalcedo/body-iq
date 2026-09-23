---
type: concept
status: current
updated: 2026-09-22
links: [validation-lifecycle, data-pipeline]
---

# Review Triage (Jev-assisted queue ordering)

Every entity is `draft` until a human promotes it
([[validation-lifecycle]]). With 305 exercises and a validator suite that
already scores every record deterministically, the bottleneck is *where a
reviewer's hour goes first*. `scripts/review-triage.ts` answers that.

## Two stages

**Stage 1 — deterministic (free, repeatable).** The script re-computes the
four `score-exercises.ts` validators (evidence / coherence / completeness /
rigor) and the `cue-quality.ts` audit against the Postgres-free dataset
export, then derives triage signals: conflicting evidence (unresolved AUDIT
flags), weak cue/source match (evidence claims with no linked sources),
suspiciously confident entries (high `confidence` on thin evidence), and
completeness / research gaps.

**Stage 2 — Jev (advisory).** Each record's *numeric and categorical* state
(no clinical prose) goes to Jev (TypeSafe System One) in one batched call per
record. Back comes a calibrated review priority (0-4), a primary-concern
pick, and a research-gap-first probability, which re-orders the deterministic
candidate list.

## Guardrails

- Jev **orders the queue only**. It never decides clinical truth, never adds
  or removes a citation, never changes `status` or `confidence`. Promotion
  stays a human act, exactly as [[validation-lifecycle]] defines it.
- Stage 1 alone produces a usable queue (deterministic heuristic ordering);
  Jev is a refinement, not a dependency.
- Every live pass writes `exports/review-triage/spend-log.json` (calls,
  measured input tokens, cost at the current $0.042/Mtok price) so spend is
  auditable. A full 305-record pass measures in the pennies.

## Running it

```bash
pnpm export:dataset                 # or download the release asset
pnpm triage                          # dry run: stage 1 + payloads + cost estimate
TYPESAFE_API_KEY=... pnpm triage --run   # live Jev pass
```

Outputs land in `exports/review-triage/` (gitignored): `features.json`,
`review-queue.md`, `queue.json`, `jev-payloads.jsonl`, and on live runs
`jev-answers.jsonl` + `spend-log.json`.
