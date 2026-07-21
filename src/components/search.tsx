"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface SearchResult {
  slug: string;
  name: string;
  entityType: string;
}

const entityPaths: Record<string, string> = {
  region: "/regions",
  joint: "/joints",
  movement: "/movements",
  muscle: "/muscles",
  task: "/tasks",
  exercise: "/exercises",
};

const entityLabels: Record<string, string> = {
  region: "Region",
  joint: "Joint",
  movement: "Movement",
  muscle: "Muscle",
  task: "Functional Task",
  exercise: "Exercise",
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Debounced search. Clearing on a too-short query is correct here; the
    // functional updates no-op when state is already empty/closed.
    if (query.trim().length < 2) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setResults((r) => (r.length ? [] : r));
      setIsOpen((o) => (o ? false : o));
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        const all: SearchResult[] = [
          ...data.regions,
          ...data.joints,
          ...data.movements,
          ...data.muscles,
          ...data.tasks,
          ...data.exercises,
        ];
        setResults(all);
        setIsOpen(all.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  // The static GitHub Pages demo has no /api backend — live search would 404,
  // so render a disabled hint instead.
  if (process.env.NEXT_PUBLIC_STATIC === "1") {
    return (
      <input
        type="text"
        disabled
        placeholder="Search (full app only)"
        title="Live search runs against the API, which isn't part of the static demo."
        className="w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 placeholder:text-gray-400"
      />
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder="Search entities..."
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      {loading && (
        <div className="absolute right-3 top-2.5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
        </div>
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-80 overflow-auto">
          {results.map((r) => (
            <Link
              key={`${r.entityType}-${r.slug}`}
              href={`${entityPaths[r.entityType]}/${r.slug}`}
              className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
              onClick={() => {
                setIsOpen(false);
                setQuery("");
              }}
            >
              <span className="font-medium text-gray-900">{r.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {entityLabels[r.entityType]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
