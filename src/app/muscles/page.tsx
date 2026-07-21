import { getMuscles } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { EntityLink, PageHeader } from "@/components/ui-helpers";

export default async function MusclesPage() {
  const muscles = await getMuscles();

  return (
    <div>
      <PageHeader title="Muscles" subtitle={`${muscles.length} muscles in the knowledge base`} />

      <div className="grid gap-4">
        {muscles.map((m) => (
          <div key={m.slug} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                  <h2 className="text-lg font-semibold">
                    <EntityLink href={`/muscles/${m.slug}`} className="text-gray-900 hover:text-indigo-700 no-underline">{m.name}</EntityLink>
                  </h2>
                  {m.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{m.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {m._count.movements} movement{m._count.movements !== 1 ? "s" : ""} •{" "}
                    {m._count.exercises} exercise{m._count.exercises !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={m.status} />
                  <ConfidenceBadge confidence={m.confidence} />
                </div>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
}
