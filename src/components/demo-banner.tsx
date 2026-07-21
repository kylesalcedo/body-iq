"use client";

import { useState } from "react";

const REPO_URL = "https://github.com/kylesalcedo/body-iq";

/**
 * A notice shown ONLY in the static GitHub Pages demo (NEXT_PUBLIC_STATIC=1,
 * inlined at build time). In the full app the env var is empty and this
 * renders nothing. Explains how the static snapshot differs from the live app.
 */
export function DemoBanner() {
  const isStatic = process.env.NEXT_PUBLIC_STATIC === "1";
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem("demoBannerDismissed") === "1"
  );

  if (!isStatic || dismissed) return null;

  return (
    <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">📖 Static demo — read-only snapshot</p>
          <p className="mt-1 text-indigo-800/90">
            You&rsquo;re browsing a static build of the Body IQ knowledge graph, so
            everything loads with no backend. A few things that need the live
            server are turned off here:
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-indigo-800/90">
            <li>
              <strong>Global search</strong> (sidebar) is disabled — it queries the API.
            </li>
            <li>
              The <strong>JSON API</strong> and the <strong>API &ldquo;Try it&rdquo; playground</strong> aren&rsquo;t included.
            </li>
            <li>
              The data is a <strong>snapshot</strong> — it refreshes only when the demo is rebuilt, not live from the database.
            </li>
          </ul>
          <p className="mt-1.5 text-indigo-800/90">
            Everything else — the body map, progression ladders, coverage heatmap,
            exercise finder, and all anatomy/exercise/source pages — works fully.
            The full app (live search + API + database) runs from the{" "}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:text-indigo-700"
            >
              source on GitHub
            </a>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem("demoBannerDismissed", "1");
            } catch {
              /* ignore */
            }
          }}
          className="flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700"
          aria-label="Dismiss demo notice"
        >
          Dismiss ✕
        </button>
      </div>
    </div>
  );
}
