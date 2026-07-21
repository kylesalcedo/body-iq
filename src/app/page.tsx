import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic =
  process.env.STATIC_EXPORT === "1" ? "force-static" : "force-dynamic";

const menu = [
  {
    href: "/finder",
    icon: "🔍",
    label: "Exercise Finder",
    blurb: "Filter the full exercise library by muscle, movement, equipment, or difficulty.",
  },
  {
    href: "/planner",
    icon: "🗓️",
    label: "Workout Planner",
    blurb: "Region × movement grid — pick a cell to see every exercise that trains it.",
  },
  {
    href: "/gait",
    icon: "🚶",
    label: "Gait Cycle",
    blurb: "The 8 Rancho phases with kinematics, EMG, and phase-specific exercises.",
  },
  {
    href: "/hand-assessment",
    icon: "✋",
    label: "Hand Assessment",
    blurb: "Pinch/grip normatives, intrinsic outcome measures, clinical tests (WIP).",
  },
  {
    href: "/regions",
    icon: "🗺️",
    label: "Regions",
    blurb: "Body regions (cervical, shoulder, hip, etc.) grouping their joints.",
  },
  {
    href: "/joints",
    icon: "🔗",
    label: "Joints",
    blurb: "Every articulation with its type and the movements it performs.",
  },
  {
    href: "/movements",
    icon: "↔️",
    label: "Movements",
    blurb: "Joint motions with plane, axis, AROM/PROM, and prime movers.",
  },
  {
    href: "/muscles",
    icon: "💪",
    label: "Muscles",
    blurb: "Origin, insertion, innervation, blood supply, and actions.",
  },
  {
    href: "/tasks",
    icon: "🎯",
    label: "Functional Tasks",
    blurb: "ADLs and sport tasks mapped to the movements they require.",
  },
  {
    href: "/exercises",
    icon: "🏋️",
    label: "Exercises",
    blurb: "Full library with dosing, EMG %MVIC, cues, regressions, progressions.",
  },
  {
    href: "/sources",
    icon: "📚",
    label: "Sources",
    blurb: "Peer-reviewed citations backing every entity in the graph.",
  },
  {
    href: "/api-docs",
    icon: "⚡",
    label: "API Reference",
    blurb: "v1 JSON endpoints for external consumers, with Zod-validated contracts.",
  },
  {
    href: "/validation",
    icon: "✅",
    label: "Validation Queue",
    blurb: "Entities in draft or needs-review — clinician sign-off workflow.",
  },
];

export default async function Home() {
  const [regions, joints, movements, muscles, exercises, sources] = await Promise.all([
    prisma.region.count(),
    prisma.joint.count(),
    prisma.movement.count(),
    prisma.muscle.count(),
    prisma.exercise.count(),
    prisma.researchSource.count(),
  ]);

  const totals = [
    ["regions", regions],
    ["joints", joints],
    ["movements", movements],
    ["muscles", muscles],
    ["exercises", exercises],
    ["sources", sources],
  ] as const;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Body IQ</h1>
      <p className="mt-2 text-gray-600">
        A biomechanics knowledge graph — anatomy, movement, evidence-based exercise.
      </p>

      <p className="mt-4 text-sm text-gray-500">
        {totals.map(([label, n], i) => (
          <span key={label}>
            {i > 0 && <span className="mx-2 text-gray-300">·</span>}
            <span className="font-semibold text-gray-700">{n.toLocaleString()}</span>{" "}
            {label}
          </span>
        ))}
      </p>

      <ul className="mt-10 divide-y divide-gray-100 border-t border-b border-gray-100">
        {menu.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-start gap-4 py-3 transition-colors hover:bg-gray-50"
            >
              <span className="mt-0.5 w-6 shrink-0 text-center text-lg">{item.icon}</span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-gray-900 group-hover:text-indigo-700">
                  {item.label}
                </span>
                <span className="block text-sm text-gray-500">{item.blurb}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
