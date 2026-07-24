import { getRegions } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, ListContainer, EntityRow, MetaNum } from "@/components/ui-helpers";

export default async function RegionsPage() {
  const regions = await getRegions();

  return (
    <div>
      <PageHeader title="Regions" subtitle={`${regions.length} anatomical regions grouping their joints`} />
      <ListContainer>
        {regions.map((r, i) => (
          <EntityRow
            key={r.slug}
            first={i === 0}
            href={`/regions/${r.slug}`}
            title={r.name}
            sub={r.description ? <span className="line-clamp-1">{r.description}</span> : undefined}
            badges={<><StatusBadge status={r.status} /><ConfidenceBadge confidence={r.confidence} /></>}
            meta={<><MetaNum>{r._count.joints}</MetaNum> joints</>}
          />
        ))}
      </ListContainer>
    </div>
  );
}
