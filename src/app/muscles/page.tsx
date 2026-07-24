import { getMuscles } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, ListContainer, EntityRow, MetaNum } from "@/components/ui-helpers";

export default async function MusclesPage() {
  const muscles = await getMuscles();

  return (
    <div>
      <PageHeader title="Muscles" subtitle={`${muscles.length} muscles · origin / insertion / action / innervation`} />
      <ListContainer>
        {muscles.map((m, i) => (
          <EntityRow
            key={m.slug}
            first={i === 0}
            href={`/muscles/${m.slug}`}
            title={m.name}
            sub={m.description ? <span className="line-clamp-1">{m.description}</span> : undefined}
            badges={<><StatusBadge status={m.status} /><ConfidenceBadge confidence={m.confidence} /></>}
            meta={<><MetaNum>{m._count.movements}</MetaNum> movements · <MetaNum>{m._count.exercises}</MetaNum> exercises</>}
          />
        ))}
      </ListContainer>
    </div>
  );
}
