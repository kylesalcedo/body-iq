import { getProgressionLadders } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/ui-helpers";
import { ProgressionStepper } from "@/components/progression-stepper";

export const metadata = {
  title: "Progression Ladders · Body IQ",
};

export default async function ProgressionsPage() {
  const ladders = await getProgressionLadders();

  const linkedCount = ladders.reduce(
    (sum, l) =>
      sum +
      l.regressions.filter((s) => s.matchedSlug).length +
      l.progressions.filter((s) => s.matchedSlug).length,
    0
  );

  return (
    <div>
      <PageHeader
        title="Progression Ladders"
        subtitle="Pick an exercise, then step left to make it easier or right to make it harder"
      />

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs text-amber-800">
        Each ladder runs from the easiest <strong>regression</strong> through the
        base exercise to the hardest <strong>progression</strong>. Steps that
        link out are name-matched to a full exercise entry — {linkedCount} of them
        across all ladders.
      </div>

      {ladders.length === 0 ? (
        <EmptyState message="No exercises with recorded regressions or progressions yet." />
      ) : (
        <ProgressionStepper ladders={ladders} />
      )}
    </div>
  );
}
