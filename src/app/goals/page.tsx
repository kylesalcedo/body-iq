import { getGoals } from "@/lib/queries";
import { EntityLink, PageHeader } from "@/components/ui-helpers";

export const metadata = { title: "Goals — Body IQ" };

const TYPE_META: Record<string, { label: string; blurb: string; color: string }> = {
  rehab: { label: "Rehab & Conditions", blurb: "Recover from pain and injury", color: "border-rose-200 bg-rose-50" },
  performance: { label: "Performance", blurb: "Get stronger, faster, more powerful", color: "border-amber-200 bg-amber-50" },
  prevention: { label: "Injury Prevention", blurb: "Build resilience and reduce risk", color: "border-sky-200 bg-sky-50" },
  mobility: { label: "Mobility", blurb: "Move better with more range", color: "border-teal-200 bg-teal-50" },
};
const ORDER = ["rehab", "performance", "prevention", "mobility"];

export default async function GoalsPage() {
  const goals = await getGoals();
  const byType: Record<string, typeof goals> = {};
  for (const g of goals) (byType[g.goalType] ||= []).push(g);

  return (
    <div className="max-w-4xl">
      <PageHeader title="Goals" subtitle="What do you want to work on? Find the exercises that get you there — rehab, performance, prevention, and mobility." />
      <div className="space-y-8">
        {ORDER.filter((t) => byType[t]?.length).map((type) => {
          const meta = TYPE_META[type];
          return (
            <div key={type}>
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-gray-900">{meta.label}</h2>
                <p className="text-sm text-gray-500">{meta.blurb}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {byType[type].map((g) => (
                  <div key={g.slug} className={`rounded-lg border ${meta.color} p-4 hover:shadow-sm transition-shadow`}>
                    <h3 className="text-base font-semibold">
                      <EntityLink href={`/goals/${g.slug}`} className="text-gray-900 hover:text-indigo-700 no-underline">{g.name}</EntityLink>
                    </h3>
                    {g.description && <p className="mt-1 text-sm text-gray-600 line-clamp-2">{g.description}</p>}
                    <p className="mt-2 text-xs text-gray-400">{g._count.exercises} exercise{g._count.exercises !== 1 ? "s" : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
