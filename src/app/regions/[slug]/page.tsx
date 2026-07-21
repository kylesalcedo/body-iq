import { notFound } from "next/navigation";
import { getRegion } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { EntityLink, PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui-helpers";

export default async function RegionDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const region = await getRegion(params.slug);
  if (!region) notFound();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={region.name}
        subtitle={region.description || undefined}
        badges={
          <>
            <StatusBadge status={region.status} />
            <ConfidenceBadge confidence={region.confidence} />
          </>
        }
      />

      {region.notes && (
        <Card className="mb-6">
          <SectionTitle>Notes</SectionTitle>
          <p className="text-sm text-gray-700">{region.notes}</p>
        </Card>
      )}

      <Card className="mb-6">
        <SectionTitle>Joints ({region.joints.length})</SectionTitle>
        {region.joints.length === 0 ? (
          <EmptyState message="No joints linked to this region." />
        ) : (
          <div className="space-y-3">
            {region.joints.map((j) => (
              <div key={j.slug} className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3">
                <div>
                  <EntityLink href={`/joints/${j.slug}`}>
                    <span className="font-medium">{j.name}</span>
                  </EntityLink>
                  {j.jointType && (
                    <span className="ml-2 text-xs text-gray-500">({j.jointType})</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {j._count.movements} movement{j._count.movements !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {region.sources.length > 0 && (
        <Card>
          <SectionTitle>Sources</SectionTitle>
          <ul className="space-y-2">
            {region.sources.map((s) => (
              <li key={s.id} className="text-sm">
                <EntityLink href={`/sources/${s.source.slug}`}>
                  {s.source.title}
                </EntityLink>
                {s.notes && <span className="text-gray-500"> — {s.notes}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export { allRegionSlugs as generateStaticParams } from "@/lib/queries";
