import { notFound } from "next/navigation";
import { getMovement } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge, RoleBadge } from "@/components/badges";
import { EntityLink, PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui-helpers";

export default async function MovementDetailPage({ params }: { params: { slug: string } }) {
  const movement = await getMovement(params.slug);
  if (!movement) notFound();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={movement.name}
        subtitle={`${movement.joint.name} • ${movement.joint.region.name}${movement.plane ? ` • ${movement.plane} plane` : ""}`}
        badges={
          <>
            <StatusBadge status={movement.status} />
            <ConfidenceBadge confidence={movement.confidence} />
          </>
        }
      />

      {movement.description && (
        <Card className="mb-6">
          <p className="text-sm text-gray-700">{movement.description}</p>
          {movement.axis && (
            <p className="mt-2 text-xs text-gray-500">Axis: {movement.axis}</p>
          )}
        </Card>
      )}

      {movement.notes && (
        <Card className="mb-6 border-l-4 border-l-amber-400 bg-amber-50/50">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Clinical context
          </div>
          <p className="mt-1 text-sm leading-relaxed text-gray-700">{movement.notes}</p>
        </Card>
      )}

      {/* Range of Motion */}
      <RomCard movement={movement} />

      {/* Muscles with role weights */}
      <Card className="mb-6">
        <SectionTitle>Muscles ({movement.muscles.length})</SectionTitle>
        {movement.muscles.length === 0 ? (
          <EmptyState message="No muscles linked to this movement." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Muscle</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Role</th>
                  <th className="text-left py-2 font-medium text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {movement.muscles.map((mm) => (
                  <tr key={mm.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">
                      <EntityLink href={`/muscles/${mm.muscle.slug}`}>
                        {mm.muscle.name}
                      </EntityLink>
                    </td>
                    <td className="py-2 pr-4">
                      <RoleBadge role={mm.role} />
                    </td>
                    <td className="py-2 text-gray-500">{mm.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Functional Tasks */}
      {movement.functionalTasks.length > 0 && (
        <Card className="mb-6">
          <SectionTitle>Functional Tasks ({movement.functionalTasks.length})</SectionTitle>
          <div className="space-y-2">
            {movement.functionalTasks.map((mft) => (
              <div key={mft.id} className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3">
                <EntityLink href={`/tasks/${mft.functionalTask.slug}`}>
                  {mft.functionalTask.name}
                </EntityLink>
                {mft.relevance && (
                  <span className="text-xs text-gray-500">{mft.relevance}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Exercises */}
      {movement.exercises.length > 0 && (
        <Card className="mb-6">
          <SectionTitle>Exercises ({movement.exercises.length})</SectionTitle>
          <div className="space-y-2">
            {movement.exercises.map((em) => (
              <div key={em.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <EntityLink href={`/exercises/${em.exercise.slug}`}>
                  {em.exercise.name}
                </EntityLink>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sources */}
      {movement.sources.length > 0 && (
        <Card>
          <SectionTitle>Sources</SectionTitle>
          <ul className="space-y-2">
            {movement.sources.map((s) => (
              <li key={s.id} className="text-sm">
                <EntityLink href={`/sources/${s.source.slug}`}>{s.source.title}</EntityLink>
                {s.notes && <span className="text-gray-500"> — {s.notes}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ─── ROM display ─────────────────────────────────────────────────────────────

function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
  unit: string | null | undefined,
): string | null {
  if (min == null && max == null) return null;
  const u = unit === "degrees" || !unit ? "°" : ` ${unit}`;
  if (min != null && max != null) {
    if (min === max) return `${max}${u}`;
    return `${min}–${max}${u}`;
  }
  return `${max ?? min}${u}`;
}

function RomCard({ movement }: { movement: any }) {
  const arom = formatRange(movement.aromMin, movement.aromMax, movement.romUnit);
  const prom = formatRange(movement.promMin, movement.promMax, movement.romUnit);
  const hasNumeric = arom != null || prom != null;
  const hasNotes = !!movement.romNotes;

  // Only render if we have something to show
  if (!hasNumeric && !hasNotes) return null;

  return (
    <Card className="mb-6 border-l-4 border-l-indigo-400">
      <SectionTitle>Normal Range of Motion</SectionTitle>

      {hasNumeric && (
        <div className="mb-3 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              AROM
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {arom ?? <span className="text-lg text-gray-300">—</span>}
            </div>
            <div className="mt-0.5 text-[10px] text-gray-400">Active range</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              PROM
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {prom ?? <span className="text-lg text-gray-300">—</span>}
            </div>
            <div className="mt-0.5 text-[10px] text-gray-400">Passive range</div>
          </div>
        </div>
      )}

      {movement.romNotes && (
        <p className="text-xs italic leading-relaxed text-gray-600">
          {movement.romNotes}
        </p>
      )}

      {movement.romSource && (
        <p className="mt-2 text-[10px] text-gray-400">
          Source: {movement.romSource}
        </p>
      )}
    </Card>
  );
}

export { allMovementSlugs as generateStaticParams } from "@/lib/queries";
