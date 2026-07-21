"use client";

import { useState } from "react";
import Link from "next/link";
import {
  muscleGapPrompt,
  movementGapPrompt,
  movementGapBatchPrompt,
} from "@/lib/gap-prompts";

export type GapItem = {
  slug: string;
  name: string;
  regionName?: string; // movements only
  count: number; // exercises (movements) or as-primary (muscles)
};

function itemHref(kind: "muscle" | "movement", slug: string) {
  return kind === "muscle" ? `/muscles/${slug}` : `/movements/${slug}`;
}

function singlePrompt(kind: "muscle" | "movement", item: GapItem): string {
  return kind === "muscle"
    ? muscleGapPrompt([{ name: item.name, asPrimary: item.count }])
    : movementGapPrompt({ region: item.regionName ?? "", movement: item.name });
}

function batchPrompt(kind: "muscle" | "movement", items: GapItem[]): string {
  return kind === "muscle"
    ? muscleGapPrompt(items.map((i) => ({ name: i.name, asPrimary: i.count })))
    : movementGapBatchPrompt(
        items.map((i) => ({ region: i.regionName ?? "", movement: i.name }))
      );
}

export function GapPromptActions({
  kind,
  items,
}: {
  kind: "muscle" | "movement";
  items: GapItem[];
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    } catch {
      setCopied("error");
    }
  }

  if (items.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => copy(batchPrompt(kind, items), "__all__")}
        className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
      >
        {copied === "__all__" ? "Copied ✓" : `⧉ Copy authoring prompt for all ${items.length}`}
      </button>

      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item.slug}
            className="inline-flex items-center overflow-hidden rounded-full border border-amber-300 bg-white text-xs"
          >
            <Link
              href={itemHref(kind, item.slug)}
              className="px-2.5 py-0.5 text-amber-800 no-underline hover:bg-amber-100"
            >
              {item.name}
              {item.count > 0 && <span className="ml-1 text-amber-400">·{item.count}</span>}
            </Link>
            <button
              type="button"
              title={`Copy authoring prompt for ${item.name}`}
              onClick={() => copy(singlePrompt(kind, item), item.slug)}
              className="border-l border-amber-200 px-1.5 py-0.5 text-amber-500 transition-colors hover:bg-amber-100 hover:text-amber-700"
            >
              {copied === item.slug ? "✓" : "⧉"}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
