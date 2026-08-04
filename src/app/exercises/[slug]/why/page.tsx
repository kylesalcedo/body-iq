import { notFound } from "next/navigation";
import Link from "next/link";
import { getExercise, allExerciseSlugs } from "@/lib/queries";
import { StatusBadge } from "@/components/badges";
import { UI } from "@/components/ui-helpers";

export { allExerciseSlugs as generateStaticParams };

const ROLE_META: Record<string, { label: string; cls: string }> = {
  primary: { label: "primary", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  secondary: { label: "secondary", cls: "bg-blue-50 text-blue-800 border-blue-200" },
  synergist: { label: "synergist", cls: "bg-purple-50 text-purple-800 border-purple-200" },
  stabilizer: { label: "stabilizer", cls: "bg-sky-50 text-sky-800 border-sky-200" },
  lengthening: { label: "lengthening", cls: "bg-teal-50 text-teal-800 border-teal-200" },
  common_association: { label: "associated", cls: "bg-gray-50 text-gray-700 border-gray-200" },
};
const ROLE_ORDER = ["primary", "secondary", "synergist", "stabilizer", "lengthening", "common_association"];
const DIMS = [
  { key: "evidence", label: "Evidence", max: 30 },
  { key: "coherence", label: "Coherence", max: 30 },
  { key: "completeness", label: "Completeness", max: 25 },
  { key: "rigor", label: "Review rigor", max: 15 },
];

function scoreBand(s: number) {
  return s >= 85 ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : s >= 70 ? "bg-blue-50 text-blue-800 border-blue-200"
    : s >= 60 ? "bg-amber-50 text-amber-800 border-amber-200"
    : "bg-red-50 text-red-800 border-red-200";
}

export default async function WhyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ex = await getExercise(slug);
  if (!ex) notFound();

  const breakdown = (ex as any).scoreBreakdown as Record<string, { score: number; max: number }> | null;
  const qs = (ex as any).qualityScore as number | null;

  const byRole = new Map<string, string[]>();
  for (const em of ex.muscles) {
    const r = em.role || "common_association";
    if (!byRole.has(r)) byRole.set(r, []);
    byRole.get(r)!.push(em.muscle.name);
  }
  const primaryNames = (byRole.get("primary") ?? []).join(", ");
  const primaryMovements = ex.movements.map((m) => m.movement.name);
  const coherenceScore = breakdown?.coherence?.score;

  return (
    <div className="max-w-3xl">
      {/* header */}
      <div className="mb-6">
        <Link href={`/exercises/${ex.slug}`} className="text-xs hover:underline" style={{ color: UI.sub }}>← {ex.name}</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight" style={{ color: UI.ink }}>{ex.name}</h1>
        <p className="mt-1 text-sm" style={{ color: UI.sub }}>The movements it trains, the muscles that produce them, and the citations behind them.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {qs != null && <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${scoreBand(qs)}`}>{qs} / 100</span>}
          <StatusBadge status={ex.status} />
          {(ex as any).evidenceLevel && <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">{(ex as any).evidenceLevel} evidence</span>}
        </div>
        <div className="mt-4 h-px" style={{ background: UI.line }} />
      </div>

      {/* score breakdown */}
      {breakdown && (
        <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {DIMS.map((d) => {
            const dim = breakdown[d.key];
            if (!dim) return null;
            const pct = Math.round((dim.score / d.max) * 100);
            return (
              <div key={d.key} className="rounded-md border px-3 py-2" style={{ borderColor: UI.line }}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold" style={{ color: UI.ink }}>{d.label}</span>
                  <span className="tabular-nums" style={{ color: UI.sub }}>{dim.score}/{d.max}</span>
                </div>
                <div className="mt-1.5 h-[5px] overflow-hidden rounded-sm" style={{ background: UI.fill }}>
                  <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: UI.acc }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* stage 1 — movements */}
      <section className="mb-1">
        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider" style={{ color: UI.sub }}>
          Trains <span style={{ color: UI.ink }}>{ex.movements.length} movement{ex.movements.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-hidden rounded-lg border" style={{ borderColor: UI.line }}>
          {ex.movements.map((m, i) => (
            <Link key={m.movement.slug} href={`/movements/${m.movement.slug}`}
              className="flex items-baseline justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-[#ededed]"
              style={{ borderTop: i === 0 ? undefined : `1px solid ${UI.line}` }}>
              <span className="text-[13.5px] font-semibold" style={{ color: UI.ink }}>{m.movement.name}</span>
              <span className="text-xs" style={{ color: UI.sub }}>
                {m.movement.joint?.region?.name ? `${m.movement.joint.region.name} · ` : ""}{m.movement.joint?.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
      <div className="my-2 text-center text-sm" style={{ color: "#c4c4c4" }}>↓</div>

      {/* stage 2 — muscles by role */}
      <section className="mb-1">
        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider" style={{ color: UI.sub }}>
          Produced by <span style={{ color: UI.ink }}>{ex.muscles.length} muscles</span>, weighted by role
        </div>
        <div className="flex flex-col gap-2 rounded-lg border p-3" style={{ borderColor: UI.line }}>
          {ROLE_ORDER.filter((r) => byRole.has(r)).map((r) => {
            const meta = ROLE_META[r];
            const names = byRole.get(r)!;
            return (
              <div key={r} className="grid grid-cols-[104px_1fr] items-start gap-3">
                <span className={`rounded border px-1.5 py-1 text-center font-mono text-[9.5px] font-bold uppercase tracking-wide ${meta.cls}`}>
                  {meta.label}{names.length > 1 ? ` ×${names.length}` : ""}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {names.map((n) => <span key={n} className="rounded-md px-2 py-1 text-xs" style={{ background: UI.fill, color: UI.ink }}>{n}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <div className="my-2 text-center text-sm" style={{ color: "#c4c4c4" }}>↓</div>

      {/* stage 3 — sources */}
      <section className="mb-5">
        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider" style={{ color: UI.sub }}>
          Backed by <span style={{ color: UI.ink }}>{ex.sources.length} source{ex.sources.length !== 1 ? "s" : ""}</span>
        </div>
        {ex.sources.length > 0 ? (
          <div className="overflow-hidden rounded-lg border" style={{ borderColor: UI.line }}>
            {ex.sources.map((s, i) => (
              <Link key={s.id} href={`/sources/${s.source.slug}`}
                className="flex items-baseline justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-[#ededed]"
                style={{ borderTop: i === 0 ? undefined : `1px solid ${UI.line}` }}>
                <span className="text-[12.5px]" style={{ color: UI.ink }}>
                  {s.source.authors ? `${s.source.authors}` : s.source.title}
                  {s.source.year ? ` (${s.source.year})` : ""}
                </span>
                <span className="shrink-0 font-mono text-[10.5px]" style={{ color: UI.sub }}>
                  {s.source.pmid ? `PMID ${s.source.pmid}` : s.source.doi ? "DOI" : "ref"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: UI.sub }}>No sources linked yet.</p>
        )}
      </section>

      {/* coherence — objective */}
      {coherenceScore != null && primaryNames && (
        <div className="rounded-lg border p-3 text-[12.5px]" style={{ borderColor: "#cfe8d8", background: "#f2f9f5", color: "#2f5d47" }}>
          <b style={{ color: "#245038" }}>Coherence: {coherenceScore}/30.</b> The primary movers ({primaryNames}) produce the linked movements — {primaryMovements.slice(0, 3).join(", ")}. The recorded muscle roles and the linked movements are internally consistent.
        </div>
      )}
    </div>
  );
}
