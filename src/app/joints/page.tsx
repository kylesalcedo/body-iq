import { getJoints } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, ListContainer, EntityRow, MetaNum } from "@/components/ui-helpers";

export default async function JointsPage() {
  const joints = await getJoints();

  return (
    <div>
      <PageHeader title="Joints" subtitle={`${joints.length} joints across all regions`} />
      <ListContainer>
        {joints.map((j, i) => (
          <EntityRow
            key={j.slug}
            first={i === 0}
            href={`/joints/${j.slug}`}
            title={j.name}
            sub={<>{j.region.name}{j.jointType && <span> · {j.jointType}</span>}</>}
            badges={<><StatusBadge status={j.status} /><ConfidenceBadge confidence={j.confidence} /></>}
            meta={<><MetaNum>{j._count.movements}</MetaNum> movements</>}
          />
        ))}
      </ListContainer>
    </div>
  );
}
