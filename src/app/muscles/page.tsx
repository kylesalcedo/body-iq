import { getMuscles } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, EntityCard, CardGrid, MetaNum } from "@/components/ui-helpers";

export default async function MusclesPage() {
  const muscles = await getMuscles();

  return (
    <div>
      <PageHeader title="Muscles" subtitle={`${muscles.length} muscles · origin / insertion / action / innervation`} />
      <CardGrid>
        {muscles.map((m) => (
          <EntityCard
            key={m.slug}
            href={`/muscles/${m.slug}`}
            title={m.name}
            description={m.description}
            badges={<><StatusBadge status={m.status} /><ConfidenceBadge confidence={m.confidence} /></>}
            meta={<><MetaNum>{m._count.movements}</MetaNum> movements · <MetaNum>{m._count.exercises}</MetaNum> exercises</>}
          />
        ))}
      </CardGrid>
    </div>
  );
}
