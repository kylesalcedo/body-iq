---
type: concept
status: current
updated: 2026-09-22
links: [evidence-validation, source-resolution, data-pipeline, review-triage]
---

# Research intake (Jev-vetted article candidates)

`pnpm research:intake` grows the evidence base instead of only checking what is
already linked. It is the front half of the citation flow:

    research:intake -> human approval -> ingest:citations --apply -> resolve-sources -> score

**Stage 1 (free, deterministic).** PubMed E-utilities search per target. Rehab
goals use an explicit condition vocabulary (`GOAL_TERMS`) plus an exercise /
rehabilitation filter and a systematic review, meta-analysis, RCT, or guideline
publication-type filter, last 10 years. Exercises search their name in
title/abstract. Metadata comes from PubMed only: PMID, DOI, title, journal,
year, publication types. The summary is the abstract's own conclusion
sentences, verbatim. Nothing is generated. Candidates already in the corpus
(PMID or DOI match) are marked and skipped.

**Stage 2 (Jev, advisory).** One call per new candidate, four questions:
`relevance` (direct / indirect / off-topic), `study_design`, `finding`
(supports-exercise / mixed-or-uncertain / no-benefit-or-harm / not-reported),
and `intake_review_needed` (noul). Jev's design answer is cross-checked against
PubMed's publication type.

**Gate.** A candidate is proposed only if Jev says `direct` with confidence
>= 0.75, Jev and PubMed agree on design, the design is SR/MA, guideline, or RCT,
it has a PMID, it is new to the corpus, and review probability < 0.35.
`shortlist.json` holds candidates that pass everything except the review
probability, ordered for the curator. Proposals and shortlist entries still
need a human; nothing is written to the database.

**Goal-level links.** Condition-level articles attach to a goal through
`SourceOnEntity` with `entityType: "Goal"` and `goalId` set (nullable FK added
2026-09-22, see [[../decisions/2026-09-22-goal-source-link]]). They are still
listed separately so a human approves each one before it is linked.

Framing: evidence curation for educational content. It never produces or
validates a diagnosis or a treatment recommendation.

First live pass: [[../../docs/research-intake-jev-2026-09-22]].

**Cross-source check.** Before integration, run `pnpm sources:crosscheck -- --from exports/research-intake/shortlist.json`. Only `corroborated` articles (found in 3+ of PubMed, Europe PMC, OpenAlex, Crossref, Semantic Scholar, with matching DOI, title, and year, and no retraction) are eligible. The `goal-evidence` seed extension enforces this.
