"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BodyMapRegion } from "@/lib/queries";

type Hotspot = { cx: number; cy: number; r: number };

/**
 * Anterior-view hotspot geometry per region slug. Bilateral regions get two
 * spots (left/right) that highlight together. Coordinates are in the SVG's
 * 300×640 viewBox. Purely presentational — counts come from the DB.
 */
const HOTSPOTS: Record<string, Hotspot[]> = {
  "cervical-spine": [{ cx: 150, cy: 96, r: 13 }],
  "thoracic-spine": [{ cx: 150, cy: 165, r: 20 }],
  "lumbar-spine": [{ cx: 150, cy: 240, r: 18 }],
  shoulder: [
    { cx: 111, cy: 132, r: 15 },
    { cx: 189, cy: 132, r: 15 },
  ],
  elbow: [
    { cx: 92, cy: 212, r: 13 },
    { cx: 208, cy: 212, r: 13 },
  ],
  wrist: [
    { cx: 80, cy: 285, r: 11 },
    { cx: 220, cy: 285, r: 11 },
  ],
  hand: [
    { cx: 74, cy: 320, r: 12 },
    { cx: 226, cy: 320, r: 12 },
  ],
  hip: [
    { cx: 128, cy: 302, r: 14 },
    { cx: 172, cy: 302, r: 14 },
  ],
  knee: [
    { cx: 126, cy: 430, r: 14 },
    { cx: 174, cy: 430, r: 14 },
  ],
  ankle: [
    { cx: 124, cy: 560, r: 12 },
    { cx: 176, cy: 560, r: 12 },
  ],
};

export function BodyMap({ regions }: { regions: BodyMapRegion[] }) {
  const router = useRouter();
  // Selection is sticky: hover/focus previews a region in the panel and stays.
  // No clear-on-leave, so moving the pointer across markers never flashes an
  // empty panel. Clicking a marker navigates to the region (same as the text).
  const [selected, setSelected] = useState<string | null>(null);

  const bySlug = new Map(regions.map((r) => [r.slug, r]));
  const activeRegion = selected ? bySlug.get(selected) ?? null : null;

  const totals = regions.reduce(
    (acc, r) => ({
      joints: acc.joints + r.jointCount,
      movements: acc.movements + r.movementCount,
      exercises: acc.exercises + r.exerciseCount,
    }),
    { joints: 0, movements: 0, exercises: 0 }
  );

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,340px)_1fr] md:items-start">
      {/* ── SVG figure ── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <svg
          viewBox="0 0 300 640"
          className="mx-auto h-auto w-full max-w-[320px]"
          role="img"
          aria-label="Interactive anatomical body map"
        >
          {/* Silhouette */}
          <g fill="#e5e7eb" stroke="#d1d5db" strokeWidth={1}>
            <circle cx={150} cy={58} r={30} />
            <rect x={138} y={84} width={24} height={20} rx={8} />
            {/* Torso */}
            <path d="M112 116 Q150 108 188 116 L182 300 Q150 312 118 300 Z" />
            {/* Arms */}
            <path d="M112 122 Q92 128 86 175 L74 320 Q80 328 92 322 L104 190 Q110 150 120 132 Z" />
            <path d="M188 122 Q208 128 214 175 L226 320 Q220 328 208 322 L196 190 Q190 150 180 132 Z" />
            {/* Legs */}
            <path d="M120 300 Q135 306 148 306 L146 580 Q138 590 126 582 L116 430 Z" />
            <path d="M180 300 Q165 306 152 306 L154 580 Q162 590 174 582 L184 430 Z" />
          </g>

          {/* Hotspots */}
          {regions.map((region) => {
            const spots = HOTSPOTS[region.slug];
            if (!spots) return null;
            const isActive = selected === region.slug;
            const hasContent = region.exerciseCount > 0;
            return (
              <g
                key={region.slug}
                className="cursor-pointer"
                tabIndex={0}
                role="link"
                aria-label={`Open ${region.name}`}
                onMouseEnter={() => setSelected(region.slug)}
                onFocus={() => setSelected(region.slug)}
                onClick={() => router.push(`/regions/${region.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/regions/${region.slug}`);
                  }
                }}
              >
                {/* radius is fixed regardless of state — only fill/stroke change,
                    so hovering never resizes the marker (no jitter). */}
                {spots.map((s, i) => (
                  <circle
                    key={i}
                    cx={s.cx}
                    cy={s.cy}
                    r={s.r}
                    fill={
                      isActive
                        ? "#6366f1"
                        : hasContent
                          ? "rgba(99,102,241,0.35)"
                          : "rgba(156,163,175,0.4)"
                    }
                    stroke={isActive ? "#4338ca" : "#818cf8"}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className="transition-colors"
                  />
                ))}
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-center text-xs text-gray-400">
          Hover a marker to preview · click to open the region
        </p>
      </div>

      {/* ── Detail panel + region list ── */}
      <div>
        <div className="mb-5 min-h-[92px] rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          {activeRegion ? (
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold text-gray-900">{activeRegion.name}</h2>
                <Link
                  href={`/regions/${activeRegion.slug}`}
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  Open region →
                </Link>
              </div>
              <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Joints</dt>
                  <dd className="font-semibold text-gray-900">{activeRegion.jointCount}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Movements</dt>
                  <dd className="font-semibold text-gray-900">{activeRegion.movementCount}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">
                    Exercise links
                  </dt>
                  <dd className="font-semibold text-gray-900">{activeRegion.exerciseCount}</dd>
                </div>
              </dl>
            </div>
          ) : (
            // Default: a useful whole-body summary rather than a placeholder line.
            <div>
              <h2 className="text-lg font-bold text-gray-900">The whole body</h2>
              <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Regions</dt>
                  <dd className="font-semibold text-gray-900">{regions.length}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Joints</dt>
                  <dd className="font-semibold text-gray-900">{totals.joints}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Movements</dt>
                  <dd className="font-semibold text-gray-900">{totals.movements}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">
                    Exercise links
                  </dt>
                  <dd className="font-semibold text-gray-900">{totals.exercises}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Full region list — keyboard/touch fallback for the SVG hotspots */}
        <div className="grid gap-2 sm:grid-cols-2">
          {regions.map((r) => (
            <Link
              key={r.slug}
              href={`/regions/${r.slug}`}
              onMouseEnter={() => setSelected(r.slug)}
              className={cnRow(selected === r.slug)}
            >
              <span className="font-medium text-gray-900">{r.name}</span>
              <span className="text-xs text-gray-400">
                {r.movementCount} mov · {r.exerciseCount} ex
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function cnRow(active: boolean) {
  return [
    "flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
    active
      ? "border-indigo-300 bg-indigo-50"
      : "border-gray-200 bg-white hover:bg-gray-50",
  ].join(" ");
}
