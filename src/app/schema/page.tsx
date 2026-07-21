import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle } from "@/components/ui-helpers";

export const metadata = { title: "Data Model — Body IQ" };

async function counts() {
  const [regions, joints, movements, muscles, tasks, exercises, cues, sources, movementMuscle, exerciseMuscle, lengthening, videos, codes, edges] =
    await Promise.all([
      prisma.region.count(), prisma.joint.count(), prisma.movement.count(), prisma.muscle.count(),
      prisma.functionalTask.count(), prisma.exercise.count(), prisma.cue.count(), prisma.researchSource.count(),
      prisma.movementMuscle.count(), prisma.exerciseMuscle.count(),
      prisma.exerciseMuscle.count({ where: { role: "lengthening" } }),
      prisma.exerciseVideo.count(), prisma.entityCode.count(),
      prisma.progression.count({ where: { targetExerciseId: { not: null } } }),
    ]);
  return { regions, joints, movements, muscles, tasks, exercises, cues, sources, movementMuscle, exerciseMuscle, lengthening, videos, codes, edges };
}

const CHAIN: { key: string; label: string; href: string; note: string }[] = [
  { key: "regions", label: "Region", href: "/regions", note: "10 anatomical regions" },
  { key: "joints", label: "Joint", href: "/joints", note: "articulations per region" },
  { key: "movements", label: "Movement", href: "/movements", note: "actions at a joint, with ROM" },
  { key: "muscles", label: "Muscle", href: "/muscles", note: "O / I / A / N / B anatomy" },
  { key: "tasks", label: "Functional Task", href: "/tasks", note: "ADL / occupational / sport" },
  { key: "exercises", label: "Exercise", href: "/exercises", note: "cues, dosing, progressions" },
];

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <div className="text-xl font-bold tabular-nums text-gray-900">{n.toLocaleString()}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function Field({ name, type, note }: { name: string; type: string; note?: string }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="font-mono text-gray-800">{name}</span>
      <span className="font-mono text-xs text-indigo-600">{type}</span>
      {note && <span className="text-xs text-gray-400">— {note}</span>}
    </div>
  );
}

export default async function SchemaPage() {
  const c = await counts();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Data Model"
        subtitle="How Body IQ structures movement knowledge into a queryable, validated graph. Counts are live from the database."
      />

      {/* Biomechanics chain */}
      <Card className="mb-6">
        <SectionTitle>The Biomechanics Chain</SectionTitle>
        <p className="mb-4 text-sm text-gray-600">
          Every entity connects along one backbone. Each node links to its browser; the arrows are real foreign keys.
        </p>
        <div className="flex flex-wrap items-stretch gap-2">
          {CHAIN.map((node, i) => (
            <div key={node.key} className="flex items-stretch gap-2">
              <Link
                href={node.href}
                className="group flex w-32 flex-col justify-between rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50 px-3 py-2 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <span className="block">
                  <span className="block text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{node.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-gray-400">{node.note}</span>
                </span>
                <span className="mt-2 block text-lg font-bold tabular-nums text-indigo-600">{(c as any)[node.key].toLocaleString()}</span>
              </Link>
              {i < CHAIN.length - 1 && <div className="flex items-center text-gray-300" aria-hidden>→</div>}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-600">
          <span className="font-medium text-gray-800">→ Evidence.</span> Every node also links to{" "}
          <Link href="/sources" className="text-indigo-600 hover:underline">{c.sources} research sources</Link>{" "}
          through a polymorphic source-attachment table, so any claim can be traced to a citation.
        </p>
      </Card>

      {/* Relationships are weighted */}
      <Card className="mb-6">
        <SectionTitle>Relationships Are Weighted, Not Just Present</SectionTitle>
        <p className="mb-4 text-sm text-gray-600">
          Muscle links carry a <span className="font-mono text-xs">role</span> — the graph knows <em>how</em> a muscle
          participates, not just that it does. This is what powers "what does this exercise stretch?"
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { role: "primary", desc: "main mover", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
            { role: "secondary", desc: "significant contributor", cls: "bg-blue-50 text-blue-800 border-blue-200" },
            { role: "stabilizer", desc: "stabilizes the joint", cls: "bg-sky-50 text-sky-800 border-sky-200" },
            { role: "synergist", desc: "assists the mover", cls: "bg-purple-50 text-purple-800 border-purple-200" },
            { role: "lengthening", desc: "stretched (antagonist)", cls: "bg-teal-50 text-teal-800 border-teal-200" },
            { role: "common_association", desc: "frequently associated", cls: "bg-gray-50 text-gray-700 border-gray-200" },
          ].map((r) => (
            <div key={r.role} className={`rounded-md border px-3 py-2 text-xs ${r.cls}`}>
              <div className="font-mono font-semibold">{r.role}</div>
              <div className="opacity-80">{r.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat n={c.movementMuscle} label="movement ↔ muscle links" />
          <Stat n={c.exerciseMuscle} label="exercise ↔ muscle links" />
          <Stat n={c.lengthening} label="lengthening (stretch) links" />
          <Stat n={c.edges} label="difficulty-graph edges" />
        </div>
      </Card>

      {/* Core entity: Exercise */}
      <Card className="mb-6">
        <SectionTitle>Anatomy of an Exercise Record</SectionTitle>
        <p className="mb-3 text-sm text-gray-600">The richest node. Every field is nullable-safe and independently validated.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Content</div>
            <Field name="description" type="String" />
            <Field name="dosing" type="String?" note="from RCTs" />
            <Field name="emgNotes" type="String?" note="activation + citations" />
            <Field name="evidenceLevel" type="String?" note="strong…expert-opinion" />
            <Field name="startPosition / endPosition / rom" type="String?" note="for video gen" />
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Validation & scoring</div>
            <Field name="status" type="EntityStatus" note="draft → verified" />
            <Field name="confidence" type="Float" />
            <Field name="qualityScore" type="Int?" note="0–100 composite" />
            <Field name="scoreBreakdown" type="Json?" note="per-validator" />
            <Field name="provenance" type="String?" note="literature | claude-researched" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>related: <span className="font-mono">muscles, movements, functionalTasks, cues ({c.cues}), regressions, progressions, videos ({c.videos}), sources, codes</span></span>
        </div>
      </Card>

      {/* Validation model */}
      <Card className="mb-6">
        <SectionTitle>The Validation Model</SectionTitle>
        <p className="mb-4 text-sm text-gray-600">Nothing is trusted by default. Every entity climbs a status ladder, and exercises also carry an automated quality score.</p>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {["draft", "needs_review", "reviewed", "verified"].map((s, i, arr) => (
            <div key={s} className="flex items-center gap-2">
              <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-xs text-gray-700">{s}</span>
              {i < arr.length - 1 && <span className="text-gray-300" aria-hidden>→</span>}
            </div>
          ))}
          <span className="ml-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-xs text-amber-700">disputed</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          {[
            { label: "Evidence", max: 30, desc: "sources, tier, dosing, EMG" },
            { label: "Coherence", max: 30, desc: "does the graph agree with the claim?" },
            { label: "Completeness", max: 25, desc: "cues, progressions, positions" },
            { label: "Review rigor", max: 15, desc: "status, flags resolved" },
          ].map((d) => (
            <div key={d.label} className="rounded-md border border-gray-200 bg-white px-3 py-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-gray-800">{d.label}</span>
                <span className="text-xs tabular-nums text-gray-400">/{d.max}</span>
              </div>
              <div className="mt-0.5 text-[11px] leading-tight text-gray-500">{d.desc}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          The composite writes to <span className="font-mono">qualityScore</span>; the reasoning shows on each exercise page.
          The coherence validator cross-checks that an exercise's primary muscles actually produce its linked movements.
        </p>
      </Card>

      {/* Interop */}
      <Card className="mb-6">
        <SectionTitle>Interoperability Layer</SectionTitle>
        <p className="mb-3 text-sm text-gray-600">
          The graph stays terminology-agnostic internally, but exports to clinical standards so it can live inside any health system.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
            <div className="text-sm font-semibold text-indigo-900">FHIR R4 ActivityDefinition</div>
            <p className="mt-1 text-xs text-indigo-800">Every exercise renders as a standard FHIR resource, live. Portable into any FHIR-capable EHR or care-plan engine.</p>
            <Link href="/api/exercises/squat/fhir" target="_blank" className="mt-2 inline-block text-xs font-medium text-indigo-700 hover:underline">
              View example (squat) →
            </Link>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <div className="text-sm font-semibold text-gray-900">EntityCode — terminology mapping</div>
            <p className="mt-1 text-xs text-gray-600">
              SNOMED CT / UCUM / ICF codes attach to any entity, each with its own verification status.
              Currently <span className="font-mono">{c.codes}</span> mapped — the scaffolding is in place; population is the next interop step.
            </p>
          </div>
        </div>
      </Card>

      <p className="text-xs text-gray-400">
        Full schema in <span className="font-mono">prisma/schema.prisma</span>. Programmatic access via the{" "}
        <Link href="/api-docs" className="text-indigo-600 hover:underline">REST API</Link>.
      </p>
    </div>
  );
}
