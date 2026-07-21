"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FilterOption {
  slug: string;
  name: string;
  category?: string | null;
  region?: { slug: string; name: string };
  joint?: { slug: string; name: string; region?: { slug: string } };
}

interface Filters {
  regions: FilterOption[];
  joints: FilterOption[];
  movements: FilterOption[];
  muscles: FilterOption[];
  tasks: FilterOption[];
  roles: string[];
  statuses: string[];
}

interface ExerciseResult {
  slug: string;
  name: string;
  description: string;
  status: string;
  confidence: number;
  notes: string | null;
  muscles: { role: string; notes: string | null; muscle: { slug: string; name: string } }[];
  movements: { movement: { slug: string; name: string; joint: { slug: string; name: string; region: { slug: string; name: string } } } }[];
  functionalTasks: { functionalTask: { slug: string; name: string; category: string | null } }[];
  cues: { text: string; cueType: string | null }[];
  regressions: { name: string; description: string }[];
  progressions: { name: string; description: string }[];
}

// ─── Filter Pill ─────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
        active
          ? "bg-indigo-100 text-indigo-800 border-indigo-300"
          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Collapsible Filter Section ──────────────────────────────────────────────

function FilterSection({
  title,
  children,
  count,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  count: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 pb-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left py-1.5"
      >
        <span className="text-sm font-medium text-gray-700">
          {title}
          {count > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 w-5 h-5 text-xs">
              {count}
            </span>
          )}
        </span>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="flex flex-wrap gap-1.5 mt-2">{children}</div>}
    </div>
  );
}

// ─── Role Badge (inline) ────────────────────────────────────────────────────

const roleColors: Record<string, string> = {
  primary: "bg-indigo-50 text-indigo-700 border-indigo-200",
  secondary: "bg-purple-50 text-purple-700 border-purple-200",
  stabilizer: "bg-teal-50 text-teal-700 border-teal-200",
  synergist: "bg-sky-50 text-sky-700 border-sky-200",
  common_association: "bg-gray-50 text-gray-600 border-gray-200",
};

const roleLabels: Record<string, string> = {
  primary: "Primary",
  secondary: "Secondary",
  stabilizer: "Stabilizer",
  synergist: "Synergist",
  common_association: "Assoc.",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${roleColors[role] || ""}`}>
      {roleLabels[role] || role}
    </span>
  );
}

// ─── Status Badge (inline) ──────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  needs_review: "bg-amber-50 text-amber-700",
  reviewed: "bg-blue-50 text-blue-700",
  verified: "bg-green-50 text-green-700",
  disputed: "bg-red-50 text-red-700",
};

// ─── Exercise Card ──────────────────────────────────────────────────────────

function ExerciseCard({ exercise, expanded, onToggle }: { exercise: ExerciseResult; expanded: boolean; onToggle: () => void }) {
  const regions = Array.from(new Set(exercise.movements.map((m) => m.movement.joint.region.name)));

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header — always visible */}
      <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/exercises/${exercise.slug}`}
                className="text-base font-semibold text-gray-900 hover:text-indigo-600"
                onClick={(e) => e.stopPropagation()}
              >
                {exercise.name}
              </Link>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[exercise.status] || ""}`}>
                {exercise.status}
              </span>
              <span className="text-[10px] text-gray-400">
                {Math.round(exercise.confidence * 100)}%
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{exercise.description}</p>
            {/* Compact muscle roles row */}
            <div className="mt-2 flex flex-wrap gap-1">
              {exercise.muscles.map((m) => (
                <span key={m.muscle.slug} className="inline-flex items-center gap-1 text-xs text-gray-600">
                  <RoleBadge role={m.role} />
                  <span>{m.muscle.name}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {regions.map((r) => (
              <span key={r} className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{r}</span>
            ))}
            <span className="text-gray-400 text-sm mt-1">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/50 space-y-4">
          {/* Movements */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Target Movements</h4>
            <div className="flex flex-wrap gap-1.5">
              {exercise.movements.map((em) => (
                <Link
                  key={em.movement.slug}
                  href={`/movements/${em.movement.slug}`}
                  className="text-xs bg-white border border-gray-200 rounded px-2 py-1 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  {em.movement.name} <span className="text-gray-400">({em.movement.joint.name})</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Functional Tasks */}
          {exercise.functionalTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Functional Relevance</h4>
              <div className="flex flex-wrap gap-1.5">
                {exercise.functionalTasks.map((ft) => (
                  <Link
                    key={ft.functionalTask.slug}
                    href={`/tasks/${ft.functionalTask.slug}`}
                    className="text-xs bg-white border border-gray-200 rounded px-2 py-1 hover:border-indigo-300 transition-colors"
                  >
                    {ft.functionalTask.name}
                    {ft.functionalTask.category && <span className="text-gray-400 ml-1">({ft.functionalTask.category})</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Cues */}
          {exercise.cues.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cues</h4>
              <ol className="list-decimal list-inside space-y-0.5">
                {exercise.cues.map((c, i) => (
                  <li key={i} className="text-sm text-gray-700">{c.text}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Regressions & Progressions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exercise.regressions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Regressions ↓</h4>
                {exercise.regressions.map((r, i) => (
                  <div key={i} className="text-sm mb-1">
                    <span className="font-medium text-gray-800">{r.name}</span>
                    <span className="text-gray-500"> — {r.description}</span>
                  </div>
                ))}
              </div>
            )}
            {exercise.progressions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Progressions ↑</h4>
                {exercise.progressions.map((p, i) => (
                  <div key={i} className="text-sm mb-1">
                    <span className="font-medium text-gray-800">{p.name}</span>
                    <span className="text-gray-500"> — {p.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {exercise.notes && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded p-2">
              <strong>Note:</strong> {exercise.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ExerciseFinder({
  filters,
  exercises: allExercises,
}: {
  filters: Filters;
  exercises: ExerciseResult[];
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Selected filters
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [selectedJoints, setSelectedJoints] = useState<Set<string>>(new Set());
  const [selectedMovements, setSelectedMovements] = useState<Set<string>>(new Set());
  const [selectedMuscles, setSelectedMuscles] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Client-side filtering (AND logic) — replaces the /api/exercises call so the
  // finder works with no backend, e.g. the static GitHub Pages demo.
  const q = searchQuery.trim().toLowerCase();
  const exercises = useMemo(
    () =>
      allExercises.filter((e) => {
        if (
          q.length >= 2 &&
          !(e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
        )
          return false;
        if (selectedStatuses.size && !selectedStatuses.has(e.status)) return false;
        if (
          selectedRegions.size &&
          !e.movements.some((m) => selectedRegions.has(m.movement.joint.region.slug))
        )
          return false;
        if (
          selectedJoints.size &&
          !e.movements.some((m) => selectedJoints.has(m.movement.joint.slug))
        )
          return false;
        if (
          selectedMovements.size &&
          !e.movements.some((m) => selectedMovements.has(m.movement.slug))
        )
          return false;
        if (selectedMuscles.size) {
          if (
            !e.muscles.some(
              (mu) =>
                selectedMuscles.has(mu.muscle.slug) &&
                (selectedRoles.size === 0 || selectedRoles.has(mu.role))
            )
          )
            return false;
        } else if (selectedRoles.size) {
          if (!e.muscles.some((mu) => selectedRoles.has(mu.role))) return false;
        }
        if (
          selectedTasks.size &&
          !e.functionalTasks.some((ft) => selectedTasks.has(ft.functionalTask.slug))
        )
          return false;
        return true;
      }),
    [
      allExercises,
      q,
      selectedStatuses,
      selectedRegions,
      selectedJoints,
      selectedMovements,
      selectedMuscles,
      selectedRoles,
      selectedTasks,
    ]
  );

  // Toggle helpers
  function toggle(set: Set<string>, setFn: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value); else next.add(value);
    setFn(next);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const activeFilterCount =
    selectedRegions.size + selectedJoints.size + selectedMovements.size +
    selectedMuscles.size + selectedTasks.size + selectedRoles.size +
    selectedStatuses.size + (searchQuery.trim().length >= 2 ? 1 : 0);

  function clearAll() {
    setSelectedRegions(new Set());
    setSelectedJoints(new Set());
    setSelectedMovements(new Set());
    setSelectedMuscles(new Set());
    setSelectedTasks(new Set());
    setSelectedRoles(new Set());
    setSelectedStatuses(new Set());
    setSearchQuery("");
  }

  // Cascade: filter joints/movements based on selected regions
  const visibleJoints = filters?.joints.filter(
    (j) => selectedRegions.size === 0 || selectedRegions.has(j.region?.slug || "")
  ) || [];

  const visibleMovements = filters?.movements.filter((m) => {
    if (selectedJoints.size > 0) return selectedJoints.has(m.joint?.slug || "");
    if (selectedRegions.size > 0) return selectedRegions.has(m.joint?.region?.slug || "");
    return true;
  }) || [];

  // JSON export
  function exportJSON() {
    const data = exercises.map((e) => ({
      slug: e.slug,
      name: e.name,
      description: e.description,
      status: e.status,
      confidence: e.confidence,
      muscles: e.muscles.map((m) => ({ name: m.muscle.name, role: m.role })),
      movements: e.movements.map((m) => m.movement.name),
      functionalTasks: e.functionalTasks.map((ft) => ft.functionalTask.name),
      cues: e.cues.map((c) => c.text),
      regressions: e.regressions.map((r) => ({ name: r.name, description: r.description })),
      progressions: e.progressions.map((p) => ({ name: p.name, description: p.description })),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exercises-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-6">
      {/* Filter Panel */}
      <div className="w-72 shrink-0">
        <div className="sticky top-6 rounded-lg border border-gray-200 bg-white shadow-sm p-4 space-y-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Filters</h2>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs text-indigo-600 hover:text-indigo-800">
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {/* Region */}
          <FilterSection title="Region" count={selectedRegions.size} defaultOpen={true}>
            {filters.regions.map((r) => (
              <FilterPill
                key={r.slug}
                label={r.name}
                active={selectedRegions.has(r.slug)}
                onClick={() => toggle(selectedRegions, setSelectedRegions, r.slug)}
              />
            ))}
          </FilterSection>

          {/* Joint (cascaded) */}
          <FilterSection title="Joint" count={selectedJoints.size}>
            {visibleJoints.map((j) => (
              <FilterPill
                key={j.slug}
                label={j.name}
                active={selectedJoints.has(j.slug)}
                onClick={() => toggle(selectedJoints, setSelectedJoints, j.slug)}
              />
            ))}
          </FilterSection>

          {/* Movement (cascaded) */}
          <FilterSection title="Movement" count={selectedMovements.size}>
            {visibleMovements.map((m) => (
              <FilterPill
                key={m.slug}
                label={m.name}
                active={selectedMovements.has(m.slug)}
                onClick={() => toggle(selectedMovements, setSelectedMovements, m.slug)}
              />
            ))}
          </FilterSection>

          {/* Muscle */}
          <FilterSection title="Muscle" count={selectedMuscles.size}>
            {filters.muscles.map((m) => (
              <FilterPill
                key={m.slug}
                label={m.name}
                active={selectedMuscles.has(m.slug)}
                onClick={() => toggle(selectedMuscles, setSelectedMuscles, m.slug)}
              />
            ))}
          </FilterSection>

          {/* Functional Task */}
          <FilterSection title="Functional Task" count={selectedTasks.size}>
            {filters.tasks.map((t) => (
              <FilterPill
                key={t.slug}
                label={t.name}
                active={selectedTasks.has(t.slug)}
                onClick={() => toggle(selectedTasks, setSelectedTasks, t.slug)}
              />
            ))}
          </FilterSection>

          {/* Role */}
          <FilterSection title="Muscle Role" count={selectedRoles.size}>
            {filters.roles.map((r) => (
              <FilterPill
                key={r}
                label={roleLabels[r] || r}
                active={selectedRoles.has(r)}
                onClick={() => toggle(selectedRoles, setSelectedRoles, r)}
              />
            ))}
          </FilterSection>

          {/* Status */}
          <FilterSection title="Status" count={selectedStatuses.size}>
            {filters.statuses.map((s) => (
              <FilterPill
                key={s}
                label={s.replace("_", " ")}
                active={selectedStatuses.has(s)}
                onClick={() => toggle(selectedStatuses, setSelectedStatuses, s)}
              />
            ))}
          </FilterSection>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Exercise Finder</h1>
            <span className="text-sm text-gray-500">
              {`${exercises.length} exercise${exercises.length !== 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (expandedIds.size === exercises.length) {
                  setExpandedIds(new Set());
                } else {
                  setExpandedIds(new Set(exercises.map((e) => e.slug)));
                }
              }}
              className="text-xs text-gray-600 border border-gray-200 rounded px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
            >
              {expandedIds.size === exercises.length ? "Collapse all" : "Expand all"}
            </button>
            {exercises.length > 0 && (
              <button
                onClick={exportJSON}
                className="text-xs text-indigo-600 border border-indigo-200 rounded px-2.5 py-1.5 hover:bg-indigo-50 transition-colors"
              >
                Export JSON ({exercises.length})
              </button>
            )}
          </div>
        </div>

        {exercises.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No exercises match your filters</p>
            <p className="mt-1 text-sm">Try adjusting or clearing your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((e) => (
              <ExerciseCard
                key={e.slug}
                exercise={e}
                expanded={expandedIds.has(e.slug)}
                onToggle={() => toggleExpanded(e.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
