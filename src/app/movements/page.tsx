import { getMovementsGroupedByRegion } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, MetaNum, UI } from "@/components/ui-helpers";
import Link from "next/link";

// ROM scaled to 180° so ranges compare at a glance across every movement.
function RomCell({ min, max, unit }: { min: number | null; max: number | null; unit: string | null }) {
  if (max == null) {
    return <span className="font-mono text-xs" style={{ color: "#bdbdbd" }}>—</span>;
  }
  const suffix = !unit || unit === "degrees" ? "°" : ` ${unit}`;
  const pct = Math.max(3, Math.round((max / 180) * 100));
  return (
    <div>
      <div className="font-mono text-[12.5px] font-bold tabular-nums" style={{ color: UI.ink }}>
        {min ?? 0}–{max}{suffix}
      </div>
      <div className="mt-1 h-[5px] overflow-hidden rounded-sm" style={{ background: UI.fill }}>
        <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: UI.acc }} />
      </div>
    </div>
  );
}

export default async function MovementsPage() {
  const regions = await getMovementsGroupedByRegion();

  let total = 0;
  let withRom = 0;
  for (const r of regions) {
    for (const j of r.joints) {
      for (const m of j.movements) {
        total++;
        if ((m as any).aromMax != null) withRom++;
      }
    }
  }

  return (
    <div>
      <PageHeader title="Movements" subtitle={`${total} movements · ${withRom} with measured range · grouped by region`} />

      <div className="space-y-6">
        {regions.map((region) => {
          const movements = region.joints
            .flatMap((j) => j.movements.map((m) => ({ ...m, jointName: j.name })))
            .sort((a, b) => a.name.localeCompare(b.name));
          if (movements.length === 0) return null;

          return (
            <section key={region.slug}>
              <div className="mb-2 flex items-baseline gap-2.5">
                <h2 className="text-sm font-bold tracking-tight" style={{ color: UI.ink }}>{region.name}</h2>
                <span className="font-mono text-[11px]" style={{ color: UI.sub }}>{movements.length} movements</span>
              </div>

              <div className="overflow-hidden rounded-lg border" style={{ borderColor: UI.line }}>
                {movements.map((m, i) => (
                  <Link
                    key={m.slug}
                    href={`/movements/${m.slug}`}
                    className="flex items-center gap-4 px-4 py-2.5 transition-colors hover:bg-[#ededed]"
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${UI.line}` }}
                  >
                    {/* name + joint / plane */}
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold" style={{ color: UI.ink }}>{m.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px]" style={{ color: UI.sub }}>
                        {m.plane && (
                          <span className="rounded-[3px] border px-1.5 py-px uppercase tracking-wide" style={{ borderColor: UI.line }}>
                            {m.plane}
                          </span>
                        )}
                        <span className="truncate">{m.jointName}</span>
                      </div>
                    </div>

                    {/* ROM — fixed width so every row's values align */}
                    <div className="w-[128px] shrink-0">
                      <RomCell min={(m as any).aromMin} max={(m as any).aromMax} unit={(m as any).romUnit} />
                    </div>

                    {/* counts */}
                    <div className="hidden w-[168px] shrink-0 text-right font-mono text-[10.5px] sm:block" style={{ color: UI.sub }}>
                      <MetaNum>{m._count.muscles}</MetaNum> muscles · <MetaNum>{m._count.exercises}</MetaNum> exercises
                    </div>

                    {/* status — fixed width so the ROM and count columns stay aligned across rows */}
                    <div className="hidden w-[150px] shrink-0 md:flex md:justify-end md:gap-1.5">
                      <StatusBadge status={m.status} />
                      <ConfidenceBadge confidence={m.confidence} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
