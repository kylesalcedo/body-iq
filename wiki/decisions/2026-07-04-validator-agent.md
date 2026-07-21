---
type: decision
status: current
updated: 2026-07-04
links: [../concepts/validation-lifecycle, ../concepts/data-pipeline, ../backlog]
---

# ADR: Human-in-the-loop validation assistant (validate-agent)

**Date:** 2026-07-04 · **Status:** accepted

## Context
The Validation Queue accumulates many draft / low-confidence entities, and
scoring each against the confidence rubric by hand is slow. An LLM can triage
this — but a validation-first project cannot let a model silently promote its
own confidence scores.

## Decision
Add `scripts/validate-agent.ts` (`pnpm validate:agent`) — a **report-only**
assistant that:

- Pulls entities from the validation queue (`status` draft/needs_review, or
  `confidence < 0.6`) for a chosen `--type` (exercise / muscle / movement).
- Sends each entity's data **and its linked sources** to the Claude API
  (`claude-opus-4-8`, adaptive thinking, `effort: low`, structured JSON output)
  with the confidence rubric from `CONTRIBUTING.md` in the system prompt.
- Emits a markdown report of *suggestions* — suggested confidence, suggested
  status, rationale, and concerns — to `private/validation-agent/` (gitignored).

It **never writes to the database.** A human reads the report and applies
changes by hand or via a seed edit. There is deliberately no `--apply` flag.

## Guardrails
- Gated on `ANTHROPIC_API_KEY`; `--dry-run` lists candidates with zero API calls.
- The model is told to judge only the sources shown and to keep confidence low
  when evidence is thin — the same "when unsure, score low" rule humans follow
  ([[../decisions/2026-07-04-confidence-rubric]]).
- Report-only keeps the audit trail human: the accepted change is a human
  commit, not a model write.

## Consequences
- New dependency: `@anthropic-ai/sdk`.
- Triage gets faster without ceding authority over validation state.
- Natural next step (deferred): a reviewer that also proposes *source*
  additions for entities whose evidence is thin — an extension of
  [[../concepts/source-resolution]].

## Alternatives rejected
- **Auto-apply suggested confidence.** Violates validation-first; a
  confident-but-wrong model score is exactly what the rubric guards against.
- **Bake it into the web UI.** A CLI report keeps it a deliberate, reviewable
  batch step rather than an always-on surface that invites rubber-stamping.
