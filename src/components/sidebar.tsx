"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/search";

type NavItem = { label: string; href: string };
type NavGroup = { label: string; icon: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Explore",
    icon: "/icons/explore.png",
    items: [
      { label: "Body Map", href: "/body-map" },
      { label: "Progression Ladders", href: "/progressions" },
      { label: "Exercise Finder", href: "/finder" },
      { label: "Workout Planner", href: "/planner" },
      { label: "Goals", href: "/goals" },
    ],
  },
  {
    label: "Anatomy",
    icon: "/icons/anatomy.png",
    items: [
      { label: "Regions", href: "/regions" },
      { label: "Joints", href: "/joints" },
      { label: "Movements", href: "/movements" },
      { label: "Muscles", href: "/muscles" },
      { label: "Functional Tasks", href: "/tasks" },
      { label: "Exercises", href: "/exercises" },
    ],
  },
  {
    label: "Clinical Tools",
    icon: "/icons/clinical.png",
    items: [
      { label: "Gait Cycle", href: "/gait" },
      { label: "Hand Assessment", href: "/hand-assessment" },
    ],
  },
  {
    label: "Evidence",
    icon: "/icons/evidence.png",
    items: [{ label: "Sources", href: "/sources" }],
  },
  {
    label: "Build & Admin",
    icon: "/icons/admin.png",
    items: [
      { label: "Coverage Heatmap", href: "/coverage" },
      { label: "Validation Queue", href: "/validation" },
      { label: "API Reference", href: "/api-docs" },
      { label: "Data Model", href: "/schema" },
    ],
  },
];

// Raw <img src> is not rewritten by Next's basePath (only <Link>/routing is),
// so prefix asset URLs manually for the GitHub Pages static build.
const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();

  // Collapse "Build & Admin" by default (contributor/admin surface); keep the
  // rest open. A group containing the active route always renders expanded.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    "Build & Admin": true,
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-200 bg-white flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src={`${BP}/icons/brand.png`}
            alt="Body IQ"
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-gray-900">Body IQ</span>
            <span className="text-[11px] text-gray-400">Movement Knowledge Engine</span>
          </span>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-gray-100">
        <SearchBar />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-3">
          {navGroups.map((group) => {
            const hasActive = group.items.some((i) => isItemActive(pathname, i.href));
            const isCollapsed = collapsed[group.label] && !hasActive;

            return (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((c) => ({ ...c, [group.label]: !c[group.label] }))
                  }
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-gray-50"
                >
                  <img
                    src={`${BP}${group.icon}`}
                    alt=""
                    aria-hidden="true"
                    className="h-6 w-6 flex-shrink-0 rounded object-contain"
                  />
                  <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {group.label}
                  </span>
                  <span
                    className={cn(
                      "text-gray-300 transition-transform",
                      isCollapsed ? "" : "rotate-90"
                    )}
                  >
                    ▸
                  </span>
                </button>

                {!isCollapsed && (
                  <ul className="mt-1 space-y-0.5 pl-2">
                    {group.items.map((item) => {
                      const isActive = isItemActive(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2 rounded-md border-l-2 py-2 pl-3 pr-3 text-sm font-medium transition-colors",
                              isActive
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-400">Evidence-based movement knowledge</p>
      </div>
    </aside>
  );
}
