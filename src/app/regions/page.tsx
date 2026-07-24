import { getRegions } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, EntityCard, CardGrid, MetaNum } from "@/components/ui-helpers";

export default async function RegionsPage() {
  const regions = await getRegions();

  return (
    <div>
      <PageHeader title="Regions" subtitle={`${regions.length} anatomical regions grouping their joints`} />
      <CardGrid>
        {regions.map((r) => (
          <EntityCard
            key={r.slug}
            href={`/regions/${r.slug}`}
            title={r.name}
            description={r.description}
            badges={<><StatusBadge status={r.status} /><ConfidenceBadge confidence={r.confidence} /></>}
            meta={<><MetaNum>{r._count.joints}</MetaNum> joints</>}
          />
        ))}
      </CardGrid>
    </div>
  );
}
