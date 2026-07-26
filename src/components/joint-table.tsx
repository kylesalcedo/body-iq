"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { UI } from "@/components/ui-helpers";

type Region = { slug: string; name: string; sortOrder: number };
type Joint = {
  slug: string;
  name: string;
  jointType: string | null;
  status: string;
  confidence: number;
  region: Region;
  _count: { movements: number };
};

const COLS = "minmax(160px,2.2fr) minmax(130px,1.6fr) 104px 104px 64px";

function Row({ j, first, showRegion }: { j: Joint; first: boolean; showRegion: boolean }) {
  return (
    <Link
      href={`/joints/${j.slug}`}
      className="group grid items-center gap-3 px-3 py-2.5 transition-colors hover:bg-[#ededed]"
      style={{ gridTemplateColumns: COLS, borderTop: first ? undefined : `1px solid ${UI.line}` }}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold group-hover:underline" style={{ color: UI.ink }}>{j.name}</span>
        {showRegion && <span className="block text-xs" style={{ color: UI.sub }}>{j.region.name}</span>}
      </span>
      <span className="truncate text-xs" style={{ color: UI.sub }}>{j.jointType || "—"}</span>
      <span className="text-right text-sm tabular-nums" style={{ color: UI.ink }}>{j._count.movements}</span>
      <span><StatusBadge status={j.status} /></span>
      <span><ConfidenceBadge confidence={j.confidence} /></span>
    </Link>
  );
}

export function JointTable({ joints }: { joints: Joint[] }) {
  const [mode, setMode] = useState<"az" | "region">("az");

  const groups = useMemo(() => {
    const map = new Map<string, { region: Region; items: Joint[] }>();
    for (const j of joints) {
      if (!map.has(j.region.slug)) map.set(j.region.slug, { region: j.region, items: [] });
      map.get(j.region.slug)!.items.push(j);
    }
    return [...map.values()].sort((a, b) => a.region.sortOrder - b.region.sortOrder);
  }, [joints]);

  const header = ["Joint", "Joint type", "Movements", "Status", "Confidence"];

  return (
    <div>
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

      {mode === "region" && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {groups.map((g) => (
            <a
              key={g.region.slug}
              href={`#region-${g.region.slug}`}
              className="rounded-md border px-2 py-1 text-xs transition-colors hover:bg-[#ededed]"
              style={{ borderColor: UI.line, color: UI.sub }}
            >
              {g.region.name} <span className="tabular-nums" style={{ color: "#a3a3a3" }}>{g.items.length}</span>
            </a>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid items-end gap-3 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: COLS, color: "#a3a3a3" }}>
            {header.map((h, i) => (
              <div key={h} className={i === 2 ? "text-right" : ""}>{h}</div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border" style={{ borderColor: UI.line }}>
            {mode === "az"
              ? joints.map((j, i) => <Row key={j.slug} j={j} first={i === 0} showRegion />)
              : groups.map((g, gi) => (
                  <div key={g.region.slug} id={`region-${g.region.slug}`} className="scroll-mt-3">
                    <div className="flex items-baseline gap-2.5 px-3 py-1.5" style={{ background: "#f7f7f7", borderTop: gi === 0 ? undefined : `1px solid ${UI.line}` }}>
                      <h2 className="text-xs font-bold tracking-tight" style={{ color: UI.ink }}>{g.region.name}</h2>
                      <span className="text-[11px]" style={{ color: UI.sub }}>{g.items.length} joint{g.items.length !== 1 ? "s" : ""}</span>
                    </div>
                    {g.items.map((j) => <Row key={j.slug} j={j} first={false} showRegion={false} />)}
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
