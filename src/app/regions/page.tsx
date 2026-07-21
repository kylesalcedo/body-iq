import { getRegions } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { EntityLink, PageHeader } from "@/components/ui-helpers";

export default async function RegionsPage() {
  const regions = await getRegions();

  return (
    <div>
      <PageHeader title="Regions" subtitle={`${regions.length} anatomical regions`} />

      <div className="grid gap-4">
        {regions.map((r) => (
          <div key={r.slug} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  <EntityLink href={`/regions/${r.slug}`} className="text-gray-900 hover:text-indigo-700 no-underline">{r.name}</EntityLink>
                </h2>
                {r.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{r.description}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  {r._count.joints} joint{r._count.joints !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={r.status} />
                <ConfidenceBadge confidence={r.confidence} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
