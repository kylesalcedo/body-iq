import { getExercisesGroupedByRegion } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, MetaNum, UI } from "@/components/ui-helpers";
import Link from "next/link";

export default async function ExercisesPage() {
  const regions = await getExercisesGroupedByRegion();

  const uniqueExercises = new Set(regions.flatMap((r) => r.exercises.map((e) => e.id))).size;
  const regionCount = regions.filter((r) => r.exercises.length > 0 && r.slug !== "unassigned").length;

  return (
    <div>
      <PageHeader title="Exercises" subtitle={`${uniqueExercises} exercises across ${regionCount} regions`} />

      <div className="space-y-6">
        {regions.map((region) => {
          if (region.exercises.length === 0) return null;

          return (
            <section key={region.slug}>
              <div className="mb-2 flex items-baseline gap-2.5">
                <h2 className="text-sm font-bold tracking-tight" style={{ color: region.slug === "unassigned" ? UI.sub : UI.ink }}>{region.name}</h2>
                <span className="font-mono text-[11px]" style={{ color: UI.sub }}>{region.exercises.length} exercises</span>
              </div>

              <div className="overflow-hidden rounded-lg border" style={{ borderColor: UI.line }}>
                {region.exercises.map((e, i) => (
                  <Link
                    key={e.slug}
                    href={`/exercises/${e.slug}`}
                    className="flex items-start gap-4 px-4 py-3 transition-colors hover:bg-[#ededed]"
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${UI.line}` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold" style={{ color: UI.ink }}>{e.name}</div>
                      <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: UI.sub }}>{e.description}</p>
                      <p className="mt-1 font-mono text-[10.5px]" style={{ color: UI.sub }}>
                        <MetaNum>{e._count.muscles}</MetaNum> muscles · <MetaNum>{e._count.movements}</MetaNum> movements · <MetaNum>{e._count.cues}</MetaNum> cues
                        {e._count.sources > 0 && <> · <MetaNum>{e._count.sources}</MetaNum> sources</>}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-1.5">
                      <StatusBadge status={e.status} />
                      <ConfidenceBadge confidence={e.confidence} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
