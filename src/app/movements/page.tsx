import { getMovementsGroupedByRegion } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, UI } from "@/components/ui-helpers";
import Link from "next/link";

// Movement | Joint | Plane | Range | Muscles | Exercises | Status.
// Same template on the header and every row → columns line up across the page.
const COLS = "minmax(150px,2.2fr) minmax(120px,1.6fr) 78px 132px 74px 84px 104px 64px";

// ROM scaled to 180° so ranges compare at a glance across every movement.
function RomCell({ min, max, unit }: { min: number | null; max: number | null; unit: string | null }) {
  if (max == null) return <span className="text-sm" style={{ color: "#bdbdbd" }}>—</span>;
  const suffix = !unit || unit === "degrees" ? "°" : ` ${unit}`;
  const pct = Math.max(3, Math.round((max / 180) * 100));
  return (
    <div>
      <div className="text-sm font-semibold tabular-nums" style={{ color: UI.ink }}>{min ?? 0}–{max}{suffix}</div>
      <div className="mt-1 h-[5px] overflow-hidden rounded-sm" style={{ background: UI.fill }}>
        <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: UI.acc }} />
      </div>
    </div>
  );
}

export default async function MovementsPage() {
  const regions = await getMovementsGroupedByRegion();

  let total = 0, withRom = 0;
  for (const r of regions) for (const j of r.joints) for (const m of j.movements) { total++; if ((m as any).aromMax != null) withRom++; }

  const header = ["Movement", "Joint", "Plane", "Range", "Muscles", "Exercises", "Status", "Confidence"];

  return (
    <div>
      <PageHeader title="Movements" subtitle={`${total} movements · ${withRom} with measured range · grouped by region`} />

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* column headings */}
          <div className="grid items-end gap-3 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: COLS, color: "#a3a3a3" }}>
            {header.map((h, i) => (
              <div key={h} className={i === 4 || i === 5 ? "text-right" : ""}>{h}</div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border" style={{ borderColor: UI.line }}>
            {regions.map((region) => {
              const movements = region.joints
                .flatMap((j) => j.movements.map((m) => ({ ...m, jointName: j.name })))
                .sort((a, b) => a.name.localeCompare(b.name));
              if (movements.length === 0) return null;

              return (
                <div key={region.slug}>
                  <div className="flex items-baseline gap-2.5 border-t px-3 py-1.5" style={{ borderColor: UI.line, background: "#f7f7f7" }}>
                    <h2 className="text-xs font-bold tracking-tight" style={{ color: UI.ink }}>{region.name}</h2>
                    <span className="text-[11px]" style={{ color: UI.sub }}>{movements.length} movements</span>
                  </div>

                  {movements.map((m) => (
                    <Link
                      key={m.slug}
                      href={`/movements/${m.slug}`}
                      className="group grid items-center gap-3 border-t px-3 py-2.5 transition-colors hover:bg-[#ededed]"
                      style={{ gridTemplateColumns: COLS, borderColor: UI.line }}
                    >
                      <span className="truncate text-sm font-semibold group-hover:underline" style={{ color: UI.ink }}>{m.name}</span>
                      <span className="truncate text-xs" style={{ color: UI.sub }}>{m.jointName}</span>
                      <span>
                        {m.plane && (
                          <span className="rounded-[3px] border px-1.5 py-px text-[10px] uppercase tracking-wide" style={{ borderColor: UI.line, color: UI.sub }}>
                            {m.plane}
                          </span>
                        )}
                      </span>
                      <RomCell min={(m as any).aromMin} max={(m as any).aromMax} unit={(m as any).romUnit} />
                      <span className="text-right text-sm tabular-nums" style={{ color: UI.ink }}>{m._count.muscles}</span>
                      <span className="text-right text-sm tabular-nums" style={{ color: UI.ink }}>{m._count.exercises}</span>
                      <span><StatusBadge status={m.status} /></span>
                      <span><ConfidenceBadge confidence={m.confidence} /></span>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
