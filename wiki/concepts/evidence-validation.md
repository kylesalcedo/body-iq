---
type: concept
status: current
updated: 2026-09-22
links: [validation-lifecycle, review-triage, data-pipeline]
---

# Evidence validation (Jev agreement gate)

`pnpm evidence:validate` turns the review backlog into explicit multiple-choice
evidence checks. It builds research packets from the dataset's linked PMID/DOI
articles for every exercise and every rehab goal. Rehab goals are the repo's
educational proxy for the conditions people search for; the pass does not make
or validate a patient's diagnosis.

A deterministic validator answers `supported / thin / unsupported /
conflicting`. Jev independently answers the same choice from the stored article
metadata and summaries. An item is auto-cleared only when both say `supported`,
Jev confidence is at least 0.75, human-review probability is below 0.35, and the
packet includes at least two identifiable research articles. Every other item
stays in `human-review.json`. The script never changes content, citations,
confidence, or status.

`TYPESAFE_API_URL` makes egress swappable. It defaults to TypeSafe's direct
endpoint and can point to the trusted relay without changing code. Live runs
write measured calls, agreement rate, auto-cleared count, token use, and cost to
`exports/evidence-validation/spend-and-agreement.json`.
