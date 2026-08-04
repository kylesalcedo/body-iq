"use client";

import { useState } from "react";

type Endpoint = {
  method: "GET";
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  example: string;
  notes?: string;
};

const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/api/stats",
    description: "Database statistics for the knowledge graph",
    example: "/api/stats",
    notes: "Returns counts for all entity types and relationships.",
  },
  {
    method: "GET",
    path: "/api/search",
    description: "Search across all entity types",
    params: [
      { name: "q", type: "string", required: true, description: "Search query (min 2 chars)" },
    ],
    example: "/api/search?q=gluteus",
  },
  {
    method: "GET",
    path: "/api/exercises",
    description: "List and filter exercises",
    params: [
      { name: "q", type: "string", required: false, description: "Text search in name and description" },
      { name: "region", type: "string", required: false, description: "Filter by region slug(s), comma-separated" },
      { name: "joint", type: "string", required: false, description: "Filter by joint slug(s), comma-separated" },
      { name: "movement", type: "string", required: false, description: "Filter by movement slug(s), comma-separated" },
      { name: "muscle", type: "string", required: false, description: "Filter by muscle slug(s), comma-separated" },
      { name: "task", type: "string", required: false, description: "Filter by functional task slug(s), comma-separated" },
      { name: "role", type: "string", required: false, description: "Filter by muscle role: primary, secondary, stabilizer, synergist" },
      { name: "status", type: "string", required: false, description: "Filter by status: draft, reviewed, verified" },
      { name: "minConfidence", type: "number", required: false, description: "Minimum confidence score (0-1)" },
      { name: "maxConfidence", type: "number", required: false, description: "Maximum confidence score (0-1)" },
    ],
    example: "/api/exercises?region=shoulder&role=primary",
    notes: "All filters use AND logic. Returns full exercise objects with muscles, movements, cues, regressions, progressions, and sources.",
  },
  {
    method: "GET",
    path: "/api/exercises/:slug",
    description: "Get a single exercise with full detail",
    params: [
      { name: "slug", type: "string", required: true, description: "Exercise slug (URL path param)" },
    ],
    example: "/api/exercises/bird-dog",
    notes: "Returns complete exercise data including muscle anatomy details, movement planes/axes, cues, regressions, progressions, and research sources.",
  },
  {
    method: "GET",
    path: "/api/exercises/filters",
    description: "Available filter options for the exercise finder",
    example: "/api/exercises/filters",
    notes: "Returns all regions, joints, movements, muscles, and functional tasks with their slugs and names. Use these slugs as filter values in /api/exercises.",
  },
  {
    method: "GET",
    path: "/api/muscles",
    description: "List muscles with optional search",
    params: [
      { name: "q", type: "string", required: false, description: "Search by name, slug, or action" },
      { name: "limit", type: "number", required: false, description: "Max results (default 100, max 200)" },
      { name: "offset", type: "number", required: false, description: "Pagination offset" },
    ],
    example: "/api/muscles?q=rotator",
  },
  {
    method: "GET",
    path: "/api/sources",
    description: "List research sources with fulltext/PDF filtering",
    params: [
      { name: "filter", type: "string", required: false, description: "Filter: 'fulltext' (free fulltext available) or 'pdf' (PDF available)" },
      { name: "format", type: "string", required: false, description: "Set to 'rag' for minimal format (slug, title, authors, year, journal, doi, pmid, pmcid, fulltextUrl, pdfUrl)" },
    ],
    example: "/api/sources?filter=pdf&format=rag",
    notes: "Use filter=pdf&format=rag for RAG ingestion — returns 75 sources with direct PMC PDF links.",
  },
  {
    method: "GET",
    path: "/api/muscles/:slug",
    description: "A muscle with full attachments, the movements/exercises it drives (by role), codes, and sources",
    example: "/api/muscles/gluteus-maximus",
  },
  {
    method: "GET",
    path: "/api/movements",
    description: "List joint movements with ROM and prime movers",
    params: [
      { name: "region", type: "string", required: false, description: "Filter by region slug" },
      { name: "plane", type: "string", required: false, description: "Filter by plane (sagittal/frontal/transverse)" },
    ],
    example: "/api/movements?region=shoulder",
  },
  {
    method: "GET",
    path: "/api/movements/:slug",
    description: "A movement with ROM, muscles by role, and exercises",
    example: "/api/movements/knee-external-rotation",
  },
  {
    method: "GET",
    path: "/api/joints",
    description: "List joints, each with its SNOMED code",
    params: [{ name: "region", type: "string", required: false, description: "Filter by region slug" }],
    example: "/api/joints?region=knee",
  },
  {
    method: "GET",
    path: "/api/joints/:slug",
    description: "A joint with its region, movements (and ROM), and codes",
    example: "/api/joints/tibiofemoral",
  },
  {
    method: "GET",
    path: "/api/regions",
    description: "Anatomical regions with joint counts",
    example: "/api/regions",
  },
  {
    method: "GET",
    path: "/api/regions/:slug",
    description: "A region with its joints",
    example: "/api/regions/shoulder",
  },
  {
    method: "GET",
    path: "/api/goals",
    description: "Goals — rehab, performance, prevention, mobility",
    params: [{ name: "type", type: "string", required: false, description: "rehab | performance | prevention | mobility" }],
    example: "/api/goals?type=performance",
  },
  {
    method: "GET",
    path: "/api/goals/:slug",
    description: "A goal with its exercises, ranked essential-first",
    example: "/api/goals/improve-squat",
  },
  {
    method: "GET",
    path: "/api/tasks",
    description: "Functional (everyday / sport) tasks",
    example: "/api/tasks",
  },
  {
    method: "GET",
    path: "/api/tasks/:slug",
    description: "A functional task with the exercises that build it",
    example: "/api/tasks/bathing-hygiene",
  },
];

export function ApiExplorer() {
  const [activeEndpoint, setActiveEndpoint] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<number, { data: any; loading: boolean; error: string | null; time: number | null }>>({});

  async function tryEndpoint(index: number, url: string) {
    setResponses((prev) => ({ ...prev, [index]: { data: null, loading: true, error: null, time: null } }));
    const start = performance.now();
    try {
      const res = await fetch(url);
      const json = await res.json();
      const time = Math.round(performance.now() - start);
      setResponses((prev) => ({ ...prev, [index]: { data: json, loading: false, error: null, time } }));
    } catch (e) {
      setResponses((prev) => ({
        ...prev,
        [index]: { data: null, loading: false, error: (e as Error).message, time: null },
      }));
    }
  }

  return (
    <div className="space-y-4">
      {endpoints.map((ep, i) => {
        const isOpen = activeEndpoint === i;
        const resp = responses[i];

        return (
          <div key={i} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setActiveEndpoint(isOpen ? null : i)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800 font-mono">
                {ep.method}
              </span>
              <code className="text-sm font-semibold text-gray-900 font-mono">{ep.path}</code>
              <span className="ml-auto text-sm text-gray-500">{ep.description}</span>
              <svg
                className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Detail */}
            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                {/* Params */}
                {ep.params && ep.params.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Parameters</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="pb-2 pr-4 text-left font-medium text-gray-600">Name</th>
                            <th className="pb-2 pr-4 text-left font-medium text-gray-600">Type</th>
                            <th className="pb-2 pr-4 text-left font-medium text-gray-600">Required</th>
                            <th className="pb-2 text-left font-medium text-gray-600">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ep.params.map((p) => (
                            <tr key={p.name} className="border-b border-gray-50">
                              <td className="py-1.5 pr-4 font-mono text-indigo-600">{p.name}</td>
                              <td className="py-1.5 pr-4 text-gray-500">{p.type}</td>
                              <td className="py-1.5 pr-4">
                                {p.required ? (
                                  <span className="text-red-500 text-xs font-medium">required</span>
                                ) : (
                                  <span className="text-gray-400 text-xs">optional</span>
                                )}
                              </td>
                              <td className="py-1.5 text-gray-700">{p.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {ep.notes && (
                  <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                    💡 {ep.notes}
                  </p>
                )}

                {/* Try it */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Try it</h4>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-md bg-gray-900 px-3 py-2 text-sm text-green-400 font-mono">
                      {ep.example}
                    </code>
                    <button
                      onClick={() => tryEndpoint(i, ep.example)}
                      disabled={resp?.loading}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {resp?.loading ? "Loading..." : "Send →"}
                    </button>
                  </div>
                </div>

                {/* Response */}
                {resp && !resp.loading && (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Response</h4>
                      {resp.time !== null && (
                        <span className="text-xs text-gray-400">{resp.time}ms</span>
                      )}
                      {resp.data?.count !== undefined && (
                        <span className="text-xs text-indigo-500 font-medium">{resp.data.count} results</span>
                      )}
                    </div>
                    {resp.error ? (
                      <pre className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 overflow-auto max-h-96 font-mono">
                        {resp.error}
                      </pre>
                    ) : (
                      <pre className="rounded-md bg-gray-900 p-3 text-sm text-gray-300 overflow-auto max-h-96 font-mono">
                        {JSON.stringify(resp.data, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
