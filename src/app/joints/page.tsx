import { getJoints } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { EntityLink, PageHeader } from "@/components/ui-helpers";

export default async function JointsPage() {
  const joints = await getJoints();

  return (
    <div>
      <PageHeader title="Joints" subtitle={`${joints.length} joints across all regions`} />

      <div className="grid gap-4">
        {joints.map((j) => (
          // Card is a plain div (not a link wrapper) so the joint-title link and
          // the region link are siblings — nesting <a> inside <a> breaks hydration.
          <div
            key={j.slug}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  <EntityLink href={`/joints/${j.slug}`} className="no-underline">
                    {j.name}
                  </EntityLink>
                </h2>
                <p className="text-sm text-gray-500">
                  <EntityLink href={`/regions/${j.region.slug}`}>{j.region.name}</EntityLink>
                  {j.jointType && <span className="ml-2 text-xs text-gray-400">• {j.jointType}</span>}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {j._count.movements} movement{j._count.movements !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={j.status} />
                <ConfidenceBadge confidence={j.confidence} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
