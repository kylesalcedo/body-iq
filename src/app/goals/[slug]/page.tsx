import { notFound } from "next/navigation";
import { getGoal } from "@/lib/queries";
import { EntityLink, PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui-helpers";

export { allGoalSlugs as generateStaticParams } from "@/lib/queries";

const TYPE_COLOR: Record<string, string> = {
  rehab: "bg-rose-100 text-rose-800", performance: "bg-amber-100 text-amber-800",
  prevention: "bg-sky-100 text-sky-800", mobility: "bg-teal-100 text-teal-800",
};

export default async function GoalDetailPage({ params }: { params: { slug: string } }) {
  const goal = await getGoal(params.slug);
  if (!goal) notFound();

  const rank = (r: string | null) => (r === "essential" ? 0 : 1);
  const rows = [...goal.exercises].sort(
    (a, b) => rank(a.relevance) - rank(b.relevance) || (b.exercise.qualityScore ?? 0) - (a.exercise.qualityScore ?? 0)
  );
  const essential = rows.filter((r) => r.relevance === "essential");
  const supportive = rows.filter((r) => r.relevance !== "essential");

  const Row = ({ eg }: { eg: (typeof rows)[number] }) => (
    <div className="flex items-start gap-3 rounded-md border border-gray-100 bg-white px-3 py-2">
      <div className="min-w-0 flex-1">
        <EntityLink href={`/exercises/${eg.exercise.slug}`} className="font-medium">{eg.exercise.name}</EntityLink>
        <div className="text-xs text-gray-400">
          {eg.exercise.category}
          {eg.exercise.difficulty ? ` · ${eg.exercise.difficulty}` : ""}
          {eg.exercise.qualityScore != null ? ` · score ${eg.exercise.qualityScore}` : ""}
        </div>
        {eg.caution && <p className="mt-1 text-xs text-amber-700">⚠ {eg.caution}</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={goal.name}
        subtitle={goal.description || undefined}
        badges={
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[goal.goalType] || "bg-gray-100 text-gray-700"}`}>
            {goal.goalType}
          </span>
        }
      />

      <Card className="mb-6">
        <SectionTitle>Cornerstone Exercises ({essential.length})</SectionTitle>
        <p className="mb-3 text-xs text-gray-500">First-line exercises for this goal.</p>
        {essential.length === 0 ? <EmptyState message="No cornerstone exercises tagged yet." /> : (
          <div className="space-y-2">{essential.map((eg) => <Row key={eg.exercise.slug} eg={eg} />)}</div>
        )}
      </Card>

      {supportive.length > 0 && (
        <Card>
          <SectionTitle>Supporting Exercises ({supportive.length})</SectionTitle>
          <p className="mb-3 text-xs text-gray-500">These contribute to the goal.</p>
          <div className="space-y-2">{supportive.map((eg) => <Row key={eg.exercise.slug} eg={eg} />)}</div>
        </Card>
      )}
    </div>
  );
}
