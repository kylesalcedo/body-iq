"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { UI } from "@/components/ui-helpers";

type Region = { slug: string; name: string; sortOrder: number };
type Muscle = {
  slug: string;
  name: string;
  origin: string | null;
  insertion: string | null;
  status: string;
  confidence: number;
  region: Region | null;
  _count: { movements: number; exercises: number };
};

const COLS = "minmax(130px,1.3fr) minmax(160px,2.4fr) minmax(160px,2.4fr) 92px 92px 104px 64px";

function Row({ m, first }: { m: Muscle; first: boolean }) {
  return (
    <Link
      href={`/muscles/${m.slug}`}
      className="group grid items-start gap-3 px-3 py-3 transition-colors hover:bg-[#ededed]"
      style={{ gridTemplateColumns: COLS, borderTop: first ? undefined : `1px solid ${UI.line}` }}
    >
      <span className="text-sm font-semibold group-hover:underline" style={{ color: UI.ink }}>{m.name}</span>
      <span className="line-clamp-3 text-xs leading-snug" style={{ color: UI.sub }}>{m.origin || "—"}</span>
      <span className="line-clamp-3 text-xs leading-snug" style={{ color: UI.sub }}>{m.insertion || "—"}</span>
      <span className="text-right text-sm tabular-nums" style={{ color: UI.ink }}>{m._count.movements}</span>
      <span className="text-right text-sm tabular-nums" style={{ color: UI.ink }}>{m._count.exercises}</span>
      <span><StatusBadge status={m.status} /></span>
      <span><ConfidenceBadge confidence={m.confidence} /></span>
    </Link>
  );
}

export function MuscleTable({ muscles }: { muscles: Muscle[] }) {
  const [mode, setMode] = useState<"az" | "region">("az");

  const groups = useMemo(() => {
    const map = new Map<string, { region: Region | null; items: Muscle[] }>();
    for (const m of muscles) {
      const key = m.region?.slug ?? "__none";
      if (!map.has(key)) map.set(key, { region: m.region, items: [] });
      map.get(key)!.items.push(m);
    }
    return [...map.values()].sort((a, b) => {
      if (!a.region) return 1;
      if (!b.region) return -1;
      return a.region.sortOrder - b.region.sortOrder;
    });
  }, [muscles]);

  const header = ["Muscle", "Origin", "Insertion", "Movements", "Exercises", "Status", "Confidence"];

  return (
    <div>
      {/* arrangement toggle */}
      <div className="mb-3 inline-flex rounded-md border p-0.5" style={{ borderColor: UI.line, background: "#f0f0f0" }}>
        {(["az", "region"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setMode(v)}
            aria-pressed={mode === v}
            className="rounded px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            style={mode === v ? { background: "#fff", color: UI.ink, boxShadow: "0 1px 2px rgba(0,0,0,.12)" } : { color: UI.sub }}
          >
            {v === "az" ? "A–Z" : "By region"}
          </button>
        ))}
      </div>

      {/* region quick-jump */}
      {mode === "region" && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {groups.map((g) => (
            <a
              key={g.region?.slug ?? "none"}
              href={`#region-${g.region?.slug ?? "none"}`}
              className="rounded-md border px-2 py-1 text-xs transition-colors hover:bg-[#ededed]"
              style={{ borderColor: UI.line, color: UI.sub }}
            >
              {g.region?.name ?? "Other"} <span className="tabular-nums" style={{ color: "#a3a3a3" }}>{g.items.length}</span>
            </a>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid items-end gap-3 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: COLS, color: "#a3a3a3" }}>
            {header.map((h, i) => (
              <div key={h} className={i === 3 || i === 4 ? "text-right" : ""}>{h}</div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border" style={{ borderColor: UI.line }}>
            {mode === "az"
              ? muscles.map((m, i) => <Row key={m.slug} m={m} first={i === 0} />)
              : groups.map((g, gi) => (
                  <div key={g.region?.slug ?? "none"} id={`region-${g.region?.slug ?? "none"}`} className="scroll-mt-3">
                    <div className="flex items-baseline gap-2.5 px-3 py-1.5" style={{ background: "#f7f7f7", borderTop: gi === 0 ? undefined : `1px solid ${UI.line}` }}>
                      <h2 className="text-xs font-bold tracking-tight" style={{ color: UI.ink }}>{g.region?.name ?? "Other / multi-region"}</h2>
                      <span className="text-[11px]" style={{ color: UI.sub }}>{g.items.length} muscle{g.items.length !== 1 ? "s" : ""}</span>
                    </div>
                    {g.items.map((m) => <Row key={m.slug} m={m} first={false} />)}
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
