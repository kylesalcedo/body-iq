import Link from "next/link";
import { getCoverageData, type MuscleCoverage } from "@/lib/queries";
import { EntityLink, PageHeader } from "@/components/ui-helpers";
import { GapPromptActions } from "@/components/gap-prompt-actions";

export const metadata = {
  title: "Coverage Heatmap · Body IQ",
};

const ROLE_LABELS: Record<string, string> = {
  primary: "Primary",
  secondary: "Secondary",
  stabilizer: "Stabilizer",
  synergist: "Synergist",
  common_association: "Common",
};

/**
 * Sequential single-hue (indigo) ramp with an explicit, distinct zero state.
 * Follows the dataviz skill: magnitude → one hue light→dark; zero is not step 0
 * of the ramp but its own callout state.
 */
function cellClasses(value: number, max: number): string {
  if (value === 0) {
    return "bg-gray-50 text-gray-300 border border-dashed border-gray-300";
  }
  const step = Math.min(4, Math.max(1, Math.ceil((value / max) * 4)));
  return [
    "",
    "bg-indigo-100 text-indigo-900",
    "bg-indigo-300 text-indigo-900",
    "bg-indigo-500 text-white",
    "bg-indigo-700 text-white",
  ][step];
}

function Cell({ value, max, title }: { value: number; max: number; title: string }) {
  return (
    <td className="p-0.5">
      <div
        title={title}
        className={`flex h-8 min-w-[3rem] items-center justify-center rounded text-xs font-semibold ${cellClasses(
          value,
          max
        )}`}
      >
        {value === 0 ? "·" : value}
      </div>
    </td>
  );
}

function Legend({ label, max }: { label: string; max: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
      <span>{label}</span>
      <span className="flex items-center gap-1">
        <span className="flex h-5 w-6 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-gray-300">
          ·
        </span>
        none
      </span>
      <span className="flex items-center gap-1.5">
        fewer
        <span className="flex gap-0.5">
          <span className="h-5 w-6 rounded bg-indigo-100" />
          <span className="h-5 w-6 rounded bg-indigo-300" />
          <span className="h-5 w-6 rounded bg-indigo-500" />
          <span className="h-5 w-6 rounded bg-indigo-700" />
        </span>
        more (max {max})
      </span>
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: "ok" | "gap" }) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        tone === "gap" && value > 0
          ? "border-amber-300 bg-amber-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  );
}

export default async function CoveragePage() {
  const data = await getCoverageData();

  // Muscle grid: most-covered first, so the long tail of thin coverage sinks
  // to the bottom and the zero-coverage callout carries the true gaps.
  const musclesByTotal: MuscleCoverage[] = [...data.muscles].sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name)
  );

  // Group movements by region for the movement heatmap.
  const movementsByRegion = new Map<string, typeof data.movements>();
  for (const m of data.movements) {
    if (!movementsByRegion.has(m.regionName)) movementsByRegion.set(m.regionName, []);
    movementsByRegion.get(m.regionName)!.push(m);
  }

  const coveredMuscles = data.muscles.length - data.uncoveredMuscles.length;
  const coveredMovements = data.movements.length - data.uncoveredMovements.length;

  // Thin-coverage gaps (the "least exercises/info" cells) for authoring prompts:
  // muscles that exist in the graph but are never a *primary* mover, and
  // movements with only 1–2 exercises. Zero-coverage entities are shown
  // separately above, so exclude them here.
  const rarelyPrimaryMuscles = data.muscles
    .filter((m) => m.total > 0 && (m.roleCounts.primary ?? 0) === 0)
    .sort((a, b) => a.total - b.total || a.name.localeCompare(b.name))
    .slice(0, 24);
  const thinMovements = data.movements
    .filter((m) => m.exerciseCount > 0 && m.exerciseCount <= 2)
    .sort((a, b) => a.exerciseCount - b.exerciseCount)
    .slice(0, 24);

  return (
    <div>
      <PageHeader
        title="Coverage Heatmap"
        subtitle="Where exercise coverage is strong, thin, or missing — the visual counterpart to the gap-finder. Darker = more exercises; a dashed cell means none."
      />

      {/* Summary tiles */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Muscles with ≥1 exercise" value={coveredMuscles} tone="ok" />
        <StatTile label="Muscles with no exercise" value={data.uncoveredMuscles.length} tone="gap" />
        <StatTile label="Movements with ≥1 exercise" value={coveredMovements} tone="ok" />
        <StatTile label="Movements with no exercise" value={data.uncoveredMovements.length} tone="gap" />
      </div>

      {/* Gap callouts — each entity has a copy-prompt affordance so you can go
          straight from "this is a gap" to an authoring prompt for it. */}
      {(data.uncoveredMuscles.length > 0 ||
        data.uncoveredMovements.length > 0 ||
        rarelyPrimaryMuscles.length > 0 ||
        thinMovements.length > 0) && (
        <div className="mb-8 space-y-5 rounded-lg border border-amber-200 bg-amber-50/60 p-5">
          <div>
            <h2 className="text-sm font-semibold text-amber-900">Coverage gaps → authoring prompts</h2>
            <p className="mt-1 text-xs text-amber-700">
              Copy an evidence-based authoring prompt for any gap below (⧉), or a
              batch prompt for a whole group. Paste into your evidence tool, then
              seed the results.
            </p>
          </div>

          {data.uncoveredMuscles.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-700">
                Muscles with no linked exercise ({data.uncoveredMuscles.length})
              </p>
              <GapPromptActions
                kind="muscle"
                items={data.uncoveredMuscles.map((m) => ({ slug: m.slug, name: m.name, count: 0 }))}
              />
            </div>
          )}

          {rarelyPrimaryMuscles.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-700">
                Muscles never trained as a primary mover ({rarelyPrimaryMuscles.length})
              </p>
              <GapPromptActions
                kind="muscle"
                items={rarelyPrimaryMuscles.map((m) => ({
                  slug: m.slug,
                  name: m.name,
                  count: m.roleCounts.primary ?? 0,
                }))}
              />
            </div>
          )}

          {data.uncoveredMovements.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-700">
                Movements with no linked exercise ({data.uncoveredMovements.length})
              </p>
              <GapPromptActions
                kind="movement"
                items={data.uncoveredMovements.map((m) => ({
                  slug: m.slug,
                  name: m.name,
                  regionName: m.regionName,
                  count: 0,
                }))}
              />
            </div>
          )}

          {thinMovements.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-700">
                Movements with only 1–2 exercises ({thinMovements.length})
              </p>
              <GapPromptActions
                kind="movement"
                items={thinMovements.map((m) => ({
                  slug: m.slug,
                  name: m.name,
                  regionName: m.regionName,
                  count: m.exerciseCount,
                }))}
              />
            </div>
          )}
        </div>
      )}

      {/* Muscle × role heatmap */}
      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Muscles × role</h2>
          <Legend label="Exercises training each muscle in a given role" max={data.maxMuscleRole} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="sticky left-0 bg-white px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  Muscle
                </th>
                {data.roles.map((role) => (
                  <th
                    key={role}
                    className="px-1 py-2 text-center text-xs font-medium uppercase tracking-wide text-gray-400"
                  >
                    {ROLE_LABELS[role] ?? role}
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {musclesByTotal.map((m) => (
                <tr key={m.slug} className="border-b border-gray-50 last:border-0">
                  <td className="sticky left-0 bg-white px-3 py-1 whitespace-nowrap">
                    <EntityLink href={`/muscles/${m.slug}`} className="no-underline">
                      {m.name}
                    </EntityLink>
                  </td>
                  {data.roles.map((role) => (
                    <Cell
                      key={role}
                      value={m.roleCounts[role] ?? 0}
                      max={data.maxMuscleRole}
                      title={`${m.name} — ${ROLE_LABELS[role] ?? role}: ${m.roleCounts[role] ?? 0} exercise(s)`}
                    />
                  ))}
                  <td className="px-3 py-1 text-center text-xs font-semibold text-gray-700">
                    {m.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Movement heatmap */}
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Movements</h2>
          <Legend label="Exercises linked to each movement" max={data.maxMovement} />
        </div>
        <div className="space-y-5">
          {Array.from(movementsByRegion.entries()).map(([regionName, movements]) => (
            <div key={regionName}>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{regionName}</h3>
              <div className="flex flex-wrap gap-2">
                {movements.map((m) => (
                  <EntityLink
                    key={m.slug}
                    href={`/movements/${m.slug}`}
                    className="no-underline"
                  >
                    <span
                      title={`${m.name}: ${m.exerciseCount} exercise(s)`}
                      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${cellClasses(
                        m.exerciseCount,
                        data.maxMovement
                      )}`}
                    >
                      {m.name}
                      <span className="rounded bg-white/25 px-1 tabular-nums">
                        {m.exerciseCount}
                      </span>
                    </span>
                  </EntityLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
