import { getGoals } from "@/lib/queries";
import { PageHeader, ListContainer, EntityRow, MetaNum, UI } from "@/components/ui-helpers";

export const metadata = { title: "Goals — Body IQ" };

const TYPE_META: Record<string, { label: string; blurb: string; dot: string }> = {
  rehab: { label: "Rehab & Conditions", blurb: "Recover from pain and injury", dot: "bg-rose-400" },
  performance: { label: "Performance", blurb: "Get stronger, faster, more powerful", dot: "bg-amber-400" },
  prevention: { label: "Injury Prevention", blurb: "Build resilience and reduce risk", dot: "bg-sky-400" },
  mobility: { label: "Mobility", blurb: "Move better with more range", dot: "bg-teal-400" },
};
const ORDER = ["rehab", "performance", "prevention", "mobility"];

export default async function GoalsPage() {
  const goals = await getGoals();
  const byType: Record<string, typeof goals> = {};
  for (const g of goals) (byType[g.goalType] ||= []).push(g);

  return (
    <div>
      <PageHeader title="Goals" subtitle={`${goals.length} goals · rehab, performance, prevention, mobility`} />
      <div className="space-y-6">
        {ORDER.filter((t) => byType[t]?.length).map((type) => {
          const meta = TYPE_META[type];
          return (
            <section key={type}>
              <div className="mb-2 flex items-center gap-2.5">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden />
                <h2 className="text-sm font-bold tracking-tight" style={{ color: UI.ink }}>{meta.label}</h2>
                <span className="text-xs" style={{ color: UI.sub }}>{meta.blurb}</span>
              </div>
              <ListContainer>
                {byType[type].map((g, i) => (
                  <EntityRow
                    key={g.slug}
                    first={i === 0}
                    href={`/goals/${g.slug}`}
                    title={g.name}
                    sub={g.description ? <span className="line-clamp-1">{g.description}</span> : undefined}
                    meta={<><MetaNum>{g._count.exercises}</MetaNum> exercises</>}
                  />
                ))}
              </ListContainer>
            </section>
          );
        })}
      </div>
    </div>
  );
}
