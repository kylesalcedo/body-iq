import { getMuscles } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, UI } from "@/components/ui-helpers";
import Link from "next/link";

// Muscle | Origin | Insertion | Movements | Exercises | Status.
const COLS = "minmax(130px,1.3fr) minmax(160px,2.4fr) minmax(160px,2.4fr) 92px 92px 140px";

export default async function MusclesPage() {
  const muscles = await getMuscles();
  const header = ["Muscle", "Origin", "Insertion", "Movements", "Exercises", "Status"];

  return (
    <div>
      <PageHeader title="Muscles" subtitle={`${muscles.length} muscles · origin, insertion, and what they drive`} />

      <div className="overflow-x-auto">
        <div className="min-w-[840px]">
          <div className="grid items-end gap-3 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: COLS, color: "#a3a3a3" }}>
            {header.map((h, i) => (
              <div key={h} className={i === 3 || i === 4 ? "text-right" : ""}>{h}</div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border" style={{ borderColor: UI.line }}>
            {muscles.map((m, i) => (
              <Link
                key={m.slug}
                href={`/muscles/${m.slug}`}
                className="group grid items-start gap-3 px-3 py-3 transition-colors hover:bg-[#ededed]"
                style={{ gridTemplateColumns: COLS, borderTop: i === 0 ? undefined : `1px solid ${UI.line}` }}
              >
                <span className="text-sm font-semibold group-hover:underline" style={{ color: UI.ink }}>{m.name}</span>
                <span className="line-clamp-3 text-xs leading-snug" style={{ color: UI.sub }}>{m.origin || "—"}</span>
                <span className="line-clamp-3 text-xs leading-snug" style={{ color: UI.sub }}>{m.insertion || "—"}</span>
                <span className="text-right text-sm tabular-nums" style={{ color: UI.ink }}>{m._count.movements}</span>
                <span className="text-right text-sm tabular-nums" style={{ color: UI.ink }}>{m._count.exercises}</span>
                <span className="flex gap-1.5">
                  <StatusBadge status={m.status} />
                  <ConfidenceBadge confidence={m.confidence} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
