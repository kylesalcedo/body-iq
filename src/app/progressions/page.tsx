import { Fragment } from "react";
import Link from "next/link";
import { getProgressionLadders, type ProgressionLadder } from "@/lib/queries";
import { PageHeader, EmptyState, UI } from "@/components/ui-helpers";

export const metadata = { title: "Progression Ladders · Body IQ" };

type Kind = "regression" | "base" | "progression";

// Linked (a real exercise page) → darker + bold. Unlinked → muted.
function chipClass(kind: Kind, linked: boolean) {
  const base = "inline-flex items-center whitespace-nowrap rounded-md border px-2 py-1 text-xs transition";
  const map: Record<Kind, { on: string; off: string }> = {
    regression: { on: "border-sky-300 bg-sky-100 text-sky-900 font-semibold hover:bg-sky-200", off: "border-sky-200 bg-sky-50 text-sky-600" },
    base: { on: "border-indigo-300 bg-indigo-100 text-indigo-900 font-semibold hover:bg-indigo-200", off: "border-indigo-300 bg-indigo-100 text-indigo-900 font-semibold" },
    progression: { on: "border-emerald-300 bg-emerald-100 text-emerald-900 font-semibold hover:bg-emerald-200", off: "border-emerald-200 bg-emerald-50 text-emerald-600" },
  };
  return `${base} ${linked ? map[kind].on : map[kind].off}`;
}

function Chip({ kind, name, matchedSlug }: { kind: Kind; name: string; matchedSlug: string | null }) {
  const cls = chipClass(kind, !!matchedSlug);
  return matchedSlug ? <Link href={`/exercises/${matchedSlug}`} className={cls}>{name}</Link> : <span className={cls}>{name}</span>;
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
        subtitle={`${ladders.length} ladders · easier variations, the base exercise, and harder progressions`}
      />

      <p className="mb-6 text-sm" style={{ color: UI.sub }}>
        <span className="font-semibold" style={{ color: UI.ink }}>Bold, darker chips link</span> to a full exercise page;
        muted chips are recorded steps without their own entry yet.
      </p>

      {ladders.length === 0 ? (
        <EmptyState message="No exercises with recorded regressions or progressions yet." />
      ) : (
        <div className="space-y-7">
          {groups.map(([region, ls]) => (
            <section key={region}>
              <div className="mb-2 flex items-baseline gap-2.5">
                <h2 className="text-sm font-bold tracking-tight" style={{ color: UI.ink }}>{region}</h2>
                <span className="text-xs" style={{ color: UI.sub }}>{ls.length} ladder{ls.length !== 1 ? "s" : ""}</span>
              </div>

              {/* One grid per region → the middle (auto) column sizes to the widest
                  base name, so every base exercise lines up in a column. */}
              <div className="grid items-center gap-x-3" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
                {/* column headings */}
                <div className="pb-1.5 text-right text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#a3a3a3" }}>← Easier</div>
                <div className="pb-1.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#a3a3a3" }}>Base</div>
                <div className="pb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#a3a3a3" }}>Harder →</div>

                {ls.map((l) => (
                  <Fragment key={l.slug}>
                    <div className="flex flex-wrap justify-end gap-1.5 border-t py-2" style={{ borderColor: UI.line }}>
                      {l.regressions.map((r, i) => <Chip key={i} kind="regression" name={r.name} matchedSlug={r.matchedSlug} />)}
                    </div>
                    <div className="flex justify-center border-t px-3 py-2" style={{ borderColor: UI.line }}>
                      <Chip kind="base" name={l.name} matchedSlug={l.slug} />
                    </div>
                    <div className="flex flex-wrap justify-start gap-1.5 border-t py-2" style={{ borderColor: UI.line }}>
                      {l.progressions.map((p, i) => <Chip key={i} kind="progression" name={p.name} matchedSlug={p.matchedSlug} />)}
                    </div>
                  </Fragment>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
