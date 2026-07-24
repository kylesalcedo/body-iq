import { getJoints } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, EntityCard, CardGrid, MetaNum } from "@/components/ui-helpers";

export default async function JointsPage() {
  const joints = await getJoints();

  return (
    <div>
      <PageHeader title="Joints" subtitle={`${joints.length} joints across all regions`} />
      <CardGrid>
        {joints.map((j) => (
          <EntityCard
            key={j.slug}
            href={`/joints/${j.slug}`}
            title={j.name}
            region={<>{j.region.name}{j.jointType && <span> · {j.jointType}</span>}</>}
            badges={<><StatusBadge status={j.status} /><ConfidenceBadge confidence={j.confidence} /></>}
            meta={<><MetaNum>{j._count.movements}</MetaNum> movements</>}
          />
        ))}
      </CardGrid>
    </div>
  );
}
