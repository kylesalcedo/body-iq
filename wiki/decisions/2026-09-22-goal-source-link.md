---
type: decision
status: proposed
updated: 2026-09-22
links: [../concepts/research-intake, ../concepts/knowledge-graph-model]
---

# ADR: Goal <-> Source link on SourceOnEntity

**Date:** 2026-09-22 · **Status:** proposed in PR #3 (schema only; not applied to any database)

## Context

`SourceOnEntity` attaches citations to Region, Joint, Movement, Muscle,
FunctionalTask, and Exercise, but not Goal. The research-article intake
([[../concepts/research-intake]]) finds most of its direct evidence at the
condition level (rehab goals), and those articles had nowhere to go except
being copied onto each of the goal's linked exercises.

## Decision

Add a nullable `goalId` FK on `SourceOnEntity` (cascade delete, indexed) and
the back-relation `Goal.sources`. Goal-level links use `entityType: "Goal"`
with `goalId` set, following the existing one-FK-per-row convention.

## Consequences

- Additive only. Existing rows are untouched; `pnpm db:push` applies it with
  no data loss. Equivalent SQL (from `prisma migrate diff`) is below.
- Approved condition-level articles from the intake shortlist can be linked
  to their goal directly. Linking stays a human step.
- Readers that filter on `entityType === "Exercise"` (review triage, evidence
  validation, research intake) are unaffected. Goal pages and the dataset
  export can start reading `Goal.sources` when there are rows to show.

## SQL

```sql
-- AlterTable
ALTER TABLE "SourceOnEntity" ADD COLUMN "goalId" TEXT;

-- CreateIndex
CREATE INDEX "SourceOnEntity_goalId_idx" ON "SourceOnEntity"("goalId");

-- AddForeignKey
ALTER TABLE "SourceOnEntity" ADD CONSTRAINT "SourceOnEntity_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```
