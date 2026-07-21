import { notFound } from "next/navigation";
import { getJoint } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { EntityLink, PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui-helpers";

export default async function JointDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const joint = await getJoint(params.slug);
  if (!joint) notFound();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={joint.name}
        subtitle={`${joint.region.name} • ${joint.jointType || "Unknown type"}`}
        badges={
          <>
            <StatusBadge status={joint.status} />
            <ConfidenceBadge confidence={joint.confidence} />
          </>
        }
      />

      {joint.description && (
        <Card className="mb-6">
          <p className="text-sm text-gray-700">{joint.description}</p>
        </Card>
      )}

      <Card className="mb-6">
        <SectionTitle>Movements ({joint.movements.length})</SectionTitle>
        {joint.movements.length === 0 ? (
          <EmptyState message="No movements linked to this joint." />
        ) : (
          <div className="space-y-3">
            {joint.movements.map((m) => (
              <div key={m.slug} className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3">
                <div>
                  <EntityLink href={`/movements/${m.slug}`}>
                    <span className="font-medium">{m.name}</span>
                  </EntityLink>
                  {m.plane && (
                    <span className="ml-2 text-xs text-gray-500">{m.plane} plane</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {m._count.muscles} muscle{m._count.muscles !== 1 ? "s" : ""} •{" "}
                  {m._count.exercises} exercise{m._count.exercises !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="text-sm text-gray-500">
        Region: <EntityLink href={`/regions/${joint.region.slug}`}>{joint.region.name}</EntityLink>
      </div>
    </div>
  );
}

export { allJointSlugs as generateStaticParams } from "@/lib/queries";
