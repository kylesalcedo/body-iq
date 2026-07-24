import { getFunctionalTasks } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, EntityCard, CardGrid, MetaNum } from "@/components/ui-helpers";

export default async function TasksPage() {
  const tasks = await getFunctionalTasks();

  return (
    <div>
      <PageHeader title="Functional Tasks" subtitle={`${tasks.length} everyday activities mapped to the movements they require`} />
      <CardGrid>
        {tasks.map((t) => (
          <EntityCard
            key={t.slug}
            href={`/tasks/${t.slug}`}
            title={t.name}
            description={t.description}
            badges={<><StatusBadge status={t.status} /><ConfidenceBadge confidence={t.confidence} /></>}
            meta={<>{t.category && <span>{t.category} · </span>}<MetaNum>{t._count.movements}</MetaNum> movements · <MetaNum>{t._count.exercises}</MetaNum> exercises</>}
          />
        ))}
      </CardGrid>
    </div>
  );
}
