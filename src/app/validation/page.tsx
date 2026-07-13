import { getValidationQueue, getExerciseWorklist } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { EntityLink, PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui-helpers";

const entityPaths: Record<string, string> = {
  region: "/regions", joint: "/joints", movement: "/movements",
  muscle: "/muscles", task: "/tasks", exercise: "/exercises",
};
const entityLabels: Record<string, string> = {
  region: "Region", joint: "Joint", movement: "Movement",
  muscle: "Muscle", task: "Task", exercise: "Exercise",
};

function scoreColor(score: number | null): string {
  if (score == null) return "bg-gray-100 text-gray-500 border-gray-200";
  if (score >= 85) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (score >= 70) return "bg-blue-100 text-blue-800 border-blue-200";
  if (score >= 60) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

const dimLabels: Record<string, string> = {
  evidence: "Evidence", coherence: "Coherence", completeness: "Completeness", rigor: "Review rigor",
};

function WorklistRow({ item }: { item: any }) {
  const gap =
    item.noMuscles ? "no muscles linked"
    : item.noMovements ? "no movements linked"
    : item.weakestNote || (item.weakestDim ? `weakest: ${dimLabels[item.weakestDim] ?? item.weakestDim}` : "—");
  return (
    <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-white px-3 py-2">
      <span className={`inline-flex w-12 shrink-0 items-center justify-center rounded-md border py-1 text-sm font-bold tabular-nums ${scoreColor(item.score)}`}>
        {item.score ?? "—"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <EntityLink href={`/exercises/${item.slug}`} className="truncate font-medium">{item.name}</EntityLink>
          {item.provenance === "claude-researched" && (
            <span className="shrink-0 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">claude-researched</span>
          )}
        </div>
        <div className="truncate text-xs text-gray-500">Top gap: {gap}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {item.highFlags > 0 && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">{item.highFlags} high</span>}
        {item.medFlags > 0 && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">{item.medFlags} med</span>}
        <StatusBadge status={item.status} />
      </div>
    </div>
  );
}

function QueueItem({ item }: { item: any }) {
  const path = entityPaths[item.entityType];
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center gap-3">
        <span className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-500">{entityLabels[item.entityType]}</span>
        <EntityLink href={`${path}/${item.slug}`}>{item.name}</EntityLink>
      </div>
      <div className="flex gap-2">
        <StatusBadge status={item.status} />
        <ConfidenceBadge confidence={item.confidence} />
      </div>
    </div>
  );
}

export default async function ValidationPage() {
  const [queue, worklist] = await Promise.all([getValidationQueue(), getExerciseWorklist()]);

  const needsWork = worklist.filter((w) => (w.score ?? 0) < 70 || w.highFlags > 0 || w.medFlags > 0 || w.noMuscles);
  const flagged = worklist.filter((w) => w.highFlags > 0 || w.medFlags > 0).length;
  const mean = Math.round(worklist.reduce((s, w) => s + (w.score ?? 0), 0) / (worklist.length || 1));

  return (
    <div>
      <PageHeader
        title="Validation Queue"
        subtitle={`${worklist.length} exercises scored · mean ${mean}/100 · ${flagged} with audit flags · ${needsWork.length} need attention`}
      />

      {/* Score-ranked exercise worklist */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <SectionTitle>Exercise Worklist — lowest scores first</SectionTitle>
          <span className="text-xs text-gray-400">ranked by quality score</span>
        </div>
        <p className="mb-3 text-xs text-gray-500">
          The fastest wins are at the top. Each row shows the weakest dimension and any unresolved audit flags — open the exercise to fix it, then re-run <span className="font-mono">pnpm score --promote</span>.
        </p>
        <div className="max-h-[32rem] space-y-1.5 overflow-y-auto">
          {needsWork.length === 0 ? (
            <EmptyState message="Every exercise scores 70+ with no open flags. 🎉" />
          ) : (
            needsWork.map((item) => <WorklistRow key={item.slug} item={item} />)
          )}
        </div>
      </Card>

      {/* Cross-entity status queues */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <SectionTitle>Draft ({queue.draft.length})</SectionTitle>
          <p className="mb-3 text-xs text-gray-500">All entity types not yet reviewed.</p>
          {queue.draft.length === 0 ? <EmptyState message="No draft items." /> : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {queue.draft.map((item: any) => <QueueItem key={`${item.entityType}-${item.slug}`} item={item} />)}
            </div>
          )}
        </Card>
        <Card>
          <SectionTitle>Low Confidence ({queue.lowConfidence.length})</SectionTitle>
          <p className="mb-3 text-xs text-gray-500">Confidence below 60%.</p>
          {queue.lowConfidence.length === 0 ? <EmptyState message="None." /> : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {queue.lowConfidence.map((item: any) => <QueueItem key={`${item.entityType}-${item.slug}`} item={item} />)}
            </div>
          )}
        </Card>
        <Card>
          <SectionTitle>Needs Review ({queue.needsReview.length})</SectionTitle>
          <p className="mb-3 text-xs text-gray-500">Explicitly flagged for review.</p>
          {queue.needsReview.length === 0 ? <EmptyState message="None flagged." /> : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {queue.needsReview.map((item: any) => <QueueItem key={`${item.entityType}-${item.slug}`} item={item} />)}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
