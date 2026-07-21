import { notFound } from "next/navigation";
import { getSource } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge } from "@/components/badges";
import { PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui-helpers";

export default async function SourceDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const source = await getSource(params.slug);
  if (!source) notFound();

  const hasFulltext = !!source.fulltextUrl;
  const hasPdf = !!source.pdfUrl;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={source.title}
        subtitle={[source.authors, source.year ? `(${source.year})` : null, source.journal].filter(Boolean).join(" ")}
        badges={
          <>
            <StatusBadge status={source.status} />
            <ConfidenceBadge confidence={source.confidence} />
            {source.sourceType && (
              <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {source.sourceType}
              </span>
            )}
            {hasFulltext && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                📄 Free Fulltext
              </span>
            )}
          </>
        }
      />

      {/* Access links — prominent */}
      {(hasFulltext || hasPdf || source.doi) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {hasPdf && (
            <a
              href={source.pdfUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
            >
              📕 Download PDF
            </a>
          )}
          {hasFulltext && (
            <a
              href={source.fulltextUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-colors"
            >
              📄 Read Fulltext
            </a>
          )}
          {source.doi && (
            <a
              href={`https://doi.org/${source.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              🔗 DOI: {source.doi}
            </a>
          )}
        </div>
      )}

      {source.description && (
        <Card className="mb-6">
          <p className="text-sm text-gray-700">{source.description}</p>
        </Card>
      )}

      {/* Identifiers */}
      {(source.doi || source.pmid || source.pmcid) && (
        <Card className="mb-6">
          <SectionTitle>Identifiers</SectionTitle>
          <div className="grid gap-2 text-sm">
            {source.doi && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-500 w-16">DOI</span>
                <a href={`https://doi.org/${source.doi}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  {source.doi}
                </a>
              </div>
            )}
            {source.pmid && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-500 w-16">PMID</span>
                <a href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  {source.pmid}
                </a>
              </div>
            )}
            {source.pmcid && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-500 w-16">PMC</span>
                <a href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${source.pmcid}/`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  {source.pmcid}
                </a>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Linked Entities ({source.entities.length})</SectionTitle>
        {source.entities.length === 0 ? (
          <EmptyState message="No entities linked to this source." />
        ) : (
          <div className="space-y-2">
            {source.entities.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3 text-sm">
                <span className="text-gray-700">{e.entityType}</span>
                {e.notes && <span className="text-gray-500">{e.notes}</span>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export { allSourceSlugs as generateStaticParams } from "@/lib/queries";
