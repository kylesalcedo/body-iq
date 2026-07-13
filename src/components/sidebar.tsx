"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/search";

const navItems = [
  { label: "Exercise Finder", href: "/finder", icon: "🔍" },
  { label: "Workout Planner", href: "/planner", icon: "🗓️" },
  { label: "Gait Cycle", href: "/gait", icon: "🚶" },
  { label: "Hand Assessment", href: "/hand-assessment", icon: "✋" },
  { label: "Regions", href: "/regions", icon: "🗺️" },
  { label: "Joints", href: "/joints", icon: "🔗" },
  { label: "Movements", href: "/movements", icon: "↔️" },
  { label: "Muscles", href: "/muscles", icon: "💪" },
  { label: "Functional Tasks", href: "/tasks", icon: "🎯" },
  { label: "Exercises", href: "/exercises", icon: "🏋️" },
  { label: "Sources", href: "/sources", icon: "📚" },
  { label: "API Reference", href: "/api-docs", icon: "⚡" },
  { label: "Data Model", href: "/schema", icon: "🗂️" },
  { label: "Validation Queue", href: "/validation", icon: "✅" },
];

const STORAGE_KEY = "bodyiq-sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Restore persisted state on mount; sync a class on <body> so the main
  // content margin (set in a layout-level effect) tracks the sidebar width.
  useEffect(() => {
    const saved = typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "1";
    setCollapsed(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 border-r border-gray-200 bg-white flex flex-col transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-3">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <span className="text-xl shrink-0">🦴</span>
          {!collapsed && (
            <>
              <span className="font-bold text-gray-900 whitespace-nowrap">Body IQ</span>
              <span className="text-xs text-gray-500 whitespace-nowrap">Explorer</span>
            </>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d={collapsed ? "M6 3l5 5-5 5" : "M10 3l-5 5 5 5"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Search — hidden when collapsed */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-gray-100">
          <SearchBar />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-0" : "gap-3 px-3",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-400">Movement Knowledge Engine</p>
        </div>
      )}
    </aside>
  );
}
