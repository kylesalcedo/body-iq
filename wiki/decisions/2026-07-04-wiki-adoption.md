---
type: decision
status: current
updated: 2026-07-04
links: [../WIKI, ../overview]
---

# ADR: Adopt a meta-layer wiki, commit it, gitignore raw/

**Date:** 2026-07-04 · **Status:** accepted

## Context
The project accretes context across sessions — modeling rationale, editorial
standards, pipeline conventions — that currently has no home. There was no
`CLAUDE.md`. A Karpathy-style `wiki/` schema was proposed.

## Decision
Adopt `wiki/` **adapted to this project's shape**: the database already is the
authoritative store of *domain facts* (muscles, exercises, sources, each with
validation metadata), so the wiki does **not** duplicate domain content. It
covers only the meta-layer — `concepts/` (how the system is modeled and how
content is produced) and `decisions/` (ADRs) — plus `overview`, `stack`,
`backlog`, `index`, `log`.

- **Commit the wiki** to the open-source repo. For a validation-first project,
  the methodology (confidence rubric, evidence discipline, pipeline) is core to
  its credibility and to letting others build on it.
- **Gitignore `raw/`.** It will hold third-party paper PDFs and private notes
  with no redistribution rights. (The existing `.gitignore` already excludes
  `prompts/`, `research/`, `notes/`, etc.)
- Add `WIKI.md` (schema) and `CLAUDE.md` (agent on-ramp pointing at the wiki).

## Consequences
- One source of truth per fact: domain facts in the DB, rationale in the wiki.
- The temptation to write `wiki/entities/<muscle>.md` is explicitly ruled out.
- Maintenance burden: concept/decision pages must be updated on meaningful
  changes and a `log.md` entry appended.

## Alternatives rejected
- **Full entity wiki** (a page per muscle/exercise) — duplicates the DB, would
  drift, violates single-source-of-truth.
- **Keep local + gitignored** — loses the credibility/reuse benefit that is the
  whole point for a public evidence-based project.
