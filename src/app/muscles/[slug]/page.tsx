import { notFound } from "next/navigation";
import { getMuscle } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge, RoleBadge } from "@/components/badges";
import { EntityLink, PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui-helpers";

export default async function MuscleDetailPage({ params }: { params: { slug: string } }) {
  const muscle = await getMuscle(params.slug);
  if (!muscle) notFound();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={muscle.name}
        subtitle={muscle.description || undefined}
        badges={
          <>
            <StatusBadge status={muscle.status} />
            <ConfidenceBadge confidence={muscle.confidence} />
          </>
        }
      />

      {/* Anatomy */}
      <Card className="mb-6">
        <SectionTitle>Anatomy</SectionTitle>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</dt>
            <dd className="mt-1 text-sm text-gray-900">{muscle.origin}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Insertion</dt>
            <dd className="mt-1 text-sm text-gray-900">{muscle.insertion}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Action</dt>
            <dd className="mt-1 text-sm text-gray-900">{muscle.action}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Innervation</dt>
            <dd className="mt-1 text-sm text-gray-900">{muscle.innervation}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Supply</dt>
            <dd className="mt-1 text-sm text-gray-900">{muscle.bloodSupply}</dd>
          </div>
        </dl>
      </Card>

      {/* Movements */}
      <Card className="mb-6">
        <SectionTitle>Movements ({muscle.movements.length})</SectionTitle>
        {muscle.movements.length === 0 ? (
          <EmptyState message="No movements linked." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Movement</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Joint</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Role</th>
                  <th className="text-left py-2 font-medium text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {muscle.movements.map((mm) => (
                  <tr key={mm.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">
                      <EntityLink href={`/movements/${mm.movement.slug}`}>
                        {mm.movement.name}
                      </EntityLink>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">
                      <EntityLink href={`/joints/${mm.movement.joint.slug}`}>
                        {mm.movement.joint.name}
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

      {/* Exercises */}
      {muscle.exercises.length > 0 && (
        <Card className="mb-6">
          <SectionTitle>Exercises ({muscle.exercises.length})</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Exercise</th>
                  <th className="text-left py-2 font-medium text-gray-700">Role</th>
                </tr>
              </thead>
              <tbody>
                {muscle.exercises.map((em) => (
                  <tr key={em.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">
                      <EntityLink href={`/exercises/${em.exercise.slug}`}>
                        {em.exercise.name}
                      </EntityLink>
                    </td>
                    <td className="py-2">
                      <RoleBadge role={em.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Sources */}
      {muscle.sources.length > 0 && (
        <Card>
          <SectionTitle>Sources</SectionTitle>
          <ul className="space-y-2">
            {muscle.sources.map((s) => (
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

export { allMuscleSlugs as generateStaticParams } from "@/lib/queries";
