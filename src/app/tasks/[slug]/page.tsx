import { notFound } from "next/navigation";
import { getFunctionalTask } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { EntityLink, PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui-helpers";

export default async function TaskDetailPage({ params }: { params: { slug: string } }) {
  const task = await getFunctionalTask(params.slug);
  if (!task) notFound();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={task.name}
        subtitle={`${task.category || "Uncategorized"} task`}
        badges={
          <>
            <StatusBadge status={task.status} />
            <ConfidenceBadge confidence={task.confidence} />
          </>
        }
      />

      {task.description && (
        <Card className="mb-6">
          <p className="text-sm text-gray-700">{task.description}</p>
        </Card>
      )}

      <Card className="mb-6">
        <SectionTitle>Required Movements ({task.movements.length})</SectionTitle>
        {task.movements.length === 0 ? (
          <EmptyState message="No movements linked." />
        ) : (
          <div className="space-y-2">
            {task.movements.map((mft) => (
              <div key={mft.id} className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3">
                <EntityLink href={`/movements/${mft.movement.slug}`}>
                  {mft.movement.name}
                </EntityLink>
                {mft.relevance && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    mft.relevance === "essential"
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {mft.relevance}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {task.exercises.length > 0 && (
        <Card>
          <SectionTitle>Related Exercises ({task.exercises.length})</SectionTitle>
          <div className="space-y-2">
            {task.exercises.map((eft) => (
              <div key={eft.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <EntityLink href={`/exercises/${eft.exercise.slug}`}>
                  {eft.exercise.name}
                </EntityLink>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export { allTaskSlugs as generateStaticParams } from "@/lib/queries";
