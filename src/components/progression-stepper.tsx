"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProgressionLadder } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";

type Step = {
  kind: "regression" | "base" | "progression";
  name: string;
  description: string;
  matchedSlug: string | null;
};

/** Flatten a ladder into an ordered easiest→hardest sequence. */
function toSteps(l: ProgressionLadder): Step[] {
  return [
    ...l.regressions.map((r) => ({ kind: "regression" as const, ...r })),
    {
      kind: "base" as const,
      name: l.name,
      description: l.description,
      matchedSlug: l.slug,
    },
    ...l.progressions.map((p) => ({ kind: "progression" as const, ...p })),
  ];
}

const KIND_META: Record<Step["kind"], { label: string; dot: string; chip: string }> = {
  regression: {
    label: "Easier variation",
    dot: "bg-sky-400",
    chip: "bg-sky-50 text-sky-700 border-sky-200",
  },
  base: {
    label: "Base exercise",
    dot: "bg-indigo-500",
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  progression: {
    label: "Harder progression",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export function ProgressionStepper({ ladders }: { ladders: ProgressionLadder[] }) {
  // Group ladders by region for the picker's optgroups (preserve query order).
  const groups = useMemo(() => {
    const m = new Map<string, ProgressionLadder[]>();
    for (const l of ladders) {
      if (!m.has(l.regionName)) m.set(l.regionName, []);
      m.get(l.regionName)!.push(l);
    }
    return Array.from(m.entries());
  }, [ladders]);

  const [selectedSlug, setSelectedSlug] = useState(ladders[0]?.slug ?? "");
  const ladder = ladders.find((l) => l.slug === selectedSlug) ?? ladders[0];

  const steps = useMemo(() => (ladder ? toSteps(ladder) : []), [ladder]);
  const baseIndex = ladder ? ladder.regressions.length : 0;
  const [focus, setFocus] = useState(baseIndex);

  // When the ladder changes, snap focus back to its base exercise.
  const [lastSlug, setLastSlug] = useState(selectedSlug);
  if (lastSlug !== selectedSlug) {
    setLastSlug(selectedSlug);
    setFocus(baseIndex);
  }

  if (!ladder) return null;

  const current = steps[focus];
  const meta = KIND_META[current.kind];
  const atEasiest = focus === 0;
  const atHardest = focus === steps.length - 1;

  return (
    <div>
      {/* Picker */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="ladder-picker" className="text-sm font-medium text-gray-700">
          Exercise
        </label>
        <select
          id="ladder-picker"
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className="max-w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {groups.map(([region, items]) => (
            <optgroup key={region} label={region}>
              {items.map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <span className="text-xs text-gray-400">
          {ladders.length} ladders · click a dot to jump, or use the buttons below
        </span>
      </div>

      {/* Track */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex min-w-min items-center gap-1">
          {steps.map((s, i) => {
            const m = KIND_META[s.kind];
            const isFocus = i === focus;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setFocus(i)}
                title={s.name}
                className={`group flex flex-col items-center gap-1.5 rounded-md px-2 py-1 transition-colors ${
                  isFocus ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`h-3 w-3 rounded-full ${m.dot} ${
                    isFocus ? "ring-2 ring-offset-2 ring-gray-400" : ""
                  }`}
                />
                <span
                  className={`max-w-[7rem] truncate text-[11px] ${
                    isFocus ? "font-semibold text-gray-900" : "text-gray-500"
                  }`}
                >
                  {s.kind === "base" ? s.name : s.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Focused step detail */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.chip}`}
          >
            <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
            {meta.label}
            <span className="text-gray-400">
              · step {focus + 1} of {steps.length}
            </span>
          </span>
          {current.kind === "base" && (
            <div className="flex flex-wrap gap-2">
              {ladder.difficulty && (
                <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs uppercase tracking-wide text-gray-500">
                  {ladder.difficulty}
                </span>
              )}
              <StatusBadge status={ladder.status} />
              <ConfidenceBadge confidence={ladder.confidence} />
            </div>
          )}
        </div>

        <h2 className="mt-4 text-xl font-bold text-gray-900">
          {current.matchedSlug ? (
            <Link
              href={`/exercises/${current.matchedSlug}`}
              className="hover:text-indigo-700 hover:underline"
            >
              {current.name}
            </Link>
          ) : (
            current.name
          )}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{current.description}</p>

        {current.matchedSlug && current.kind !== "base" && (
          <Link
            href={`/exercises/${current.matchedSlug}`}
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            This variation has its own entry — open it →
          </Link>
        )}

        {/* Prev / next */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setFocus((f) => Math.max(0, f - 1))}
            disabled={atEasiest}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹ Regress (easier)
          </button>
          <button
            type="button"
            onClick={() => setFocus((f) => Math.min(steps.length - 1, f + 1))}
            disabled={atHardest}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Progress (harder) ›
          </button>
        </div>
      </div>
    </div>
  );
}
