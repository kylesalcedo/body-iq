import { Fragment } from "react";
import Link from "next/link";
import { getProgressionLadders, type ProgressionLadder } from "@/lib/queries";
import { PageHeader, EmptyState, UI } from "@/components/ui-helpers";

export const metadata = { title: "Progression Ladders · Body IQ" };

type Step = { kind: "regression" | "base" | "progression"; name: string; matchedSlug: string | null };

const KIND: Record<Step["kind"], string> = {
  regression: "border-sky-200 bg-sky-50 text-sky-800",
  base: "border-indigo-300 bg-indigo-50 text-indigo-900 font-semibold",
  progression: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function StepChip({ step }: { step: Step }) {
  const cls = `inline-flex items-center rounded-md border px-2 py-1 text-xs ${KIND[step.kind]}`;
  return step.matchedSlug ? (
    <Link href={`/exercises/${step.matchedSlug}`} className={`${cls} hover:brightness-95`}>{step.name}</Link>
  ) : (
    <span className={cls}>{step.name}</span>
  );
}

function Ladder({ ladder }: { ladder: ProgressionLadder }) {
  const steps: Step[] = [
    ...ladder.regressions.map((r) => ({ kind: "regression" as const, name: r.name, matchedSlug: r.matchedSlug })),
    { kind: "base" as const, name: ladder.name, matchedSlug: ladder.slug },
    ...ladder.progressions.map((p) => ({ kind: "progression" as const, name: p.name, matchedSlug: p.matchedSlug })),
  ];
  return (
    <div className="rounded-lg border bg-white p-3" style={{ borderColor: UI.line }}>
      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((s, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="px-0.5 text-sm" style={{ color: "#c4c4c4" }} aria-hidden>→</span>}
            <StepChip step={s} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export default async function ProgressionsPage() {
  const ladders = await getProgressionLadders();

  // Group by region, preserving the query's region order.
  const groups: [string, ProgressionLadder[]][] = [];
  const index = new Map<string, ProgressionLadder[]>();
  for (const l of ladders) {
    if (!index.has(l.regionName)) {
      const arr: ProgressionLadder[] = [];
      index.set(l.regionName, arr);
      groups.push([l.regionName, arr]);
    }
    index.get(l.regionName)!.push(l);
  }

  return (
    <div>
      <PageHeader
        title="Progression Ladders"
        subtitle={`${ladders.length} ladders · easiest regression → base exercise → hardest progression`}
      />

      <p className="mb-5 text-sm" style={{ color: UI.sub }}>
        Each row is a full ladder. <span className="rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-xs text-sky-800">easier</span>{" "}
        <span className="rounded border border-indigo-300 bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-900">base</span>{" "}
        <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-800">harder</span>{" "}
        — chips that link go to the full exercise.
      </p>

      {ladders.length === 0 ? (
        <EmptyState message="No exercises with recorded regressions or progressions yet." />
      ) : (
        <div className="space-y-6">
          {groups.map(([region, ls]) => (
            <section key={region}>
              <div className="mb-2 flex items-baseline gap-2.5">
                <h2 className="text-sm font-bold tracking-tight" style={{ color: UI.ink }}>{region}</h2>
                <span className="text-xs" style={{ color: UI.sub }}>{ls.length} ladder{ls.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2">
                {ls.map((l) => <Ladder key={l.slug} ladder={l} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
