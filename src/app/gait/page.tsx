import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-static";

export default async function GaitPage() {
  const phases = await prisma.gaitPhase.findMany({
    orderBy: { order: "asc" },
    include: {
      exercises: {
        include: {
          exercise: {
            select: {
              id: true,
              slug: true,
              name: true,
              dosing: true,
              evidenceLevel: true,
              difficulty: true,
            },
          },
        },
      },
    },
  });

  const stance = phases.filter((p) => p.phaseGroup === "stance");
  const swing = phases.filter((p) => p.phaseGroup === "swing");

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gait Cycle</h1>
        <p className="mt-2 text-gray-600">
          The 8 Rancho Los Amigos phases with phase-specific exercise prescriptions.
          Stance ≈ 60% of the cycle; swing ≈ 40%.
        </p>
      </div>

      <PhaseBar phases={phases} />

      <Section title="Stance Phase" tint="bg-indigo-50" phases={stance} />
      <Section title="Swing Phase" tint="bg-emerald-50" phases={swing} />
    </div>
  );
}

function PhaseBar({
  phases,
}: {
  phases: { slug: string; shortName: string | null; name: string; cycleStartPct: number; cycleEndPct: number; phaseGroup: string }[];
}) {
  return (
    <div className="mb-10">
      <div className="mb-2 flex justify-between text-xs text-gray-500">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
      <div className="relative h-10 w-full overflow-hidden rounded-md border border-gray-200">
        {phases.map((p) => {
          const left = p.cycleStartPct;
          const width = p.cycleEndPct - p.cycleStartPct;
          const color = p.phaseGroup === "stance" ? "bg-indigo-200" : "bg-emerald-200";
          return (
            <a
              key={p.slug}
              href={`#${p.slug}`}
              className={`absolute top-0 flex h-full items-center justify-center border-r border-white/70 text-xs font-semibold text-gray-800 hover:opacity-80 ${color}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${p.name} (${p.cycleStartPct}–${p.cycleEndPct}%)`}
            >
              {p.shortName ?? ""}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function Section({
  title,
  tint,
  phases,
}: {
  title: string;
  tint: string;
  phases: Awaited<ReturnType<typeof prisma.gaitPhase.findMany>>;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-bold text-gray-900">{title}</h2>
      <div className="space-y-6">
        {phases.map((p: any) => (
          <div
            key={p.slug}
            id={p.slug}
            className={`rounded-lg border border-gray-200 ${tint} p-5`}
          >
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {p.name}{" "}
                <span className="ml-1 text-sm font-normal text-gray-500">
                  ({p.cycleStartPct}–{p.cycleEndPct}% of cycle)
                </span>
              </h3>
              {p.shortName && (
                <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                  {p.shortName}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <Field label="Functional goal" value={p.functionalGoal} />
              <Field label="Kinematics" value={p.kinematics} />
              <Field label="Kinetics" value={p.kinetics} />
              <Field label="Muscle activity" value={p.muscleActivity} />
              <Field
                label="Common deficits"
                value={p.commonDeficits}
                className="md:col-span-2"
              />
            </div>

            {p.exercises.length > 0 && (
              <div className="mt-5 border-t border-gray-200 pt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Phase-specific exercises ({p.exercises.length})
                </div>
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {p.exercises.map((link: any) => (
                    <li
                      key={link.exercise.id}
                      className="rounded-md bg-white px-3 py-2 ring-1 ring-gray-200"
                    >
                      <Link
                        href={`/exercises/${link.exercise.slug}`}
                        className="text-sm font-medium text-indigo-700 hover:underline"
                      >
                        {link.exercise.name}
                      </Link>
                      {link.exercise.dosing && (
                        <div className="text-xs text-gray-600">
                          {link.exercise.dosing}
                        </div>
                      )}
                      {link.rationale && (
                        <div className="mt-1 text-xs italic text-gray-500">
                          {link.rationale}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={className}>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-gray-800">{value}</div>
    </div>
  );
}
