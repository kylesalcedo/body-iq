import { getFunctionalTasks } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, ListContainer, EntityRow, MetaNum } from "@/components/ui-helpers";

export default async function TasksPage() {
  const tasks = await getFunctionalTasks();

  return (
    <div>
      <PageHeader title="Functional Tasks" subtitle={`${tasks.length} everyday activities mapped to the movements they require`} />
      <ListContainer>
        {tasks.map((t, i) => (
          <EntityRow
            key={t.slug}
            first={i === 0}
            href={`/tasks/${t.slug}`}
            title={t.name}
            sub={t.description ? <span className="line-clamp-1">{t.description}</span> : undefined}
            badges={<><StatusBadge status={t.status} /><ConfidenceBadge confidence={t.confidence} /></>}
            meta={<>{t.category && <span>{t.category} · </span>}<MetaNum>{t._count.movements}</MetaNum> movements · <MetaNum>{t._count.exercises}</MetaNum> exercises</>}
          />
        ))}
      </ListContainer>
    </div>
  );
}
