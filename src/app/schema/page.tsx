import { Fragment } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, UI } from "@/components/ui-helpers";

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
  { key: "regions", label: "Region", href: "/regions", note: "anatomical regions" },
  { key: "joints", label: "Joint", href: "/joints", note: "articulations" },
  { key: "movements", label: "Movement", href: "/movements", note: "actions at a joint" },
  { key: "muscles", label: "Muscle", href: "/muscles", note: "O / I / A / N / B" },
  { key: "tasks", label: "Functional Task", href: "/tasks", note: "ADL / sport" },
  { key: "exercises", label: "Exercise", href: "/exercises", note: "cues, dosing, progressions" },
];

function ProseLink({ href, children, target }: { href: string; children: React.ReactNode; target?: string }) {
  return (
    <Link href={href} target={target} className="font-medium underline underline-offset-2" style={{ color: UI.ink }}>
      {children}
    </Link>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-md border px-3 py-2" style={{ borderColor: UI.line }}>
      <div className="text-xl font-bold tabular-nums" style={{ color: UI.ink }}>{n.toLocaleString()}</div>
      <div className="text-xs" style={{ color: UI.sub }}>{label}</div>
    </div>
  );
}

function Field({ name, type, note }: { name: string; type: string; note?: string }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="font-mono" style={{ color: UI.ink }}>{name}</span>
      <span className="font-mono text-xs" style={{ color: UI.sub }}>{type}</span>
      {note && <span className="text-xs" style={{ color: "#a3a3a3" }}>— {note}</span>}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#a3a3a3" }}>{children}</div>;
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
      <Card className="mb-5">
        <SectionTitle>The Biomechanics Chain</SectionTitle>
        <p className="mb-4 text-sm" style={{ color: UI.sub }}>
          Every entity connects along one backbone. Each node links to its browser; the arrows are real foreign keys.
        </p>
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
          {CHAIN.map((node, i) => (
            <Fragment key={node.key}>
              <Link
                href={node.href}
                className="group flex flex-1 basis-0 flex-col justify-between gap-2 rounded-md border p-3 transition-colors hover:bg-[#f7f7f7]"
                style={{ borderColor: UI.line, minWidth: 112 }}
              >
                <span>
                  <span className="block text-sm font-semibold group-hover:underline" style={{ color: UI.ink }}>{node.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-tight" style={{ color: UI.sub }}>{node.note}</span>
                </span>
                <span className="text-lg font-bold tabular-nums" style={{ color: UI.ink }}>{(c as any)[node.key].toLocaleString()}</span>
              </Link>
              {i < CHAIN.length - 1 && (
                <div className="flex items-center text-sm" style={{ color: "#c4c4c4" }} aria-hidden>→</div>
              )}
            </Fragment>
          ))}
        </div>
        <p className="mt-4 text-sm" style={{ color: UI.sub }}>
          <span className="font-semibold" style={{ color: UI.ink }}>→ Evidence.</span> Every node also links to{" "}
          <ProseLink href="/sources">{c.sources} research sources</ProseLink>{" "}
          through a polymorphic source-attachment table, so any claim can be traced to a citation.
        </p>
      </Card>

      {/* Relationships are weighted */}
      <Card className="mb-5">
        <SectionTitle>Relationships Are Weighted, Not Just Present</SectionTitle>
        <p className="mb-4 text-sm" style={{ color: UI.sub }}>
          Muscle links carry a <span className="font-mono text-xs" style={{ color: UI.ink }}>role</span> — the graph knows <em>how</em> a muscle
          participates, not just that it does. This is what powers &ldquo;what does this exercise stretch?&rdquo;
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
      <Card className="mb-5">
        <SectionTitle>Anatomy of an Exercise Record</SectionTitle>
        <p className="mb-4 text-sm" style={{ color: UI.sub }}>The richest node. Every field is nullable-safe and independently validated.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <SubLabel>Content</SubLabel>
            <Field name="description" type="String" />
            <Field name="dosing" type="String?" note="from RCTs" />
            <Field name="emgNotes" type="String?" note="activation + citations" />
            <Field name="evidenceLevel" type="String?" note="strong…expert-opinion" />
            <Field name="startPosition / endPosition / rom" type="String?" note="for video gen" />
          </div>
          <div className="space-y-2">
            <SubLabel>Validation &amp; scoring</SubLabel>
            <Field name="status" type="EntityStatus" note="draft → verified" />
            <Field name="confidence" type="Float" />
            <Field name="qualityScore" type="Int?" note="0–100 composite" />
            <Field name="scoreBreakdown" type="Json?" note="per-validator" />
            <Field name="provenance" type="String?" note="literature | researched" />
          </div>
        </div>
        <div className="mt-4 border-t pt-3 text-xs" style={{ borderColor: UI.line, color: UI.sub }}>
          related: <span className="font-mono" style={{ color: UI.ink }}>muscles, movements, functionalTasks, cues ({c.cues}), regressions, progressions, videos ({c.videos}), sources, codes</span>
        </div>
      </Card>

      {/* Validation model */}
      <Card className="mb-5">
        <SectionTitle>The Validation Model</SectionTitle>
        <p className="mb-4 text-sm" style={{ color: UI.sub }}>Nothing is trusted by default. Every entity climbs a status ladder, and exercises also carry an automated quality score.</p>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {["draft", "needs_review", "reviewed", "verified"].map((s, i, arr) => (
            <Fragment key={s}>
              <span className="rounded-md border px-2.5 py-1 font-mono text-xs" style={{ borderColor: UI.line, background: "#f7f7f7", color: UI.ink }}>{s}</span>
              {i < arr.length - 1 && <span style={{ color: "#c4c4c4" }} aria-hidden>→</span>}
            </Fragment>
          ))}
          <span className="ml-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-xs text-amber-700">disputed</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Evidence", max: 30, desc: "sources, tier, dosing, EMG" },
            { label: "Coherence", max: 30, desc: "graph agrees with the claim" },
            { label: "Completeness", max: 25, desc: "cues, progressions, positions" },
            { label: "Review rigor", max: 15, desc: "status, flags resolved" },
          ].map((d) => (
            <div key={d.label} className="rounded-md border px-3 py-2" style={{ borderColor: UI.line }}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold" style={{ color: UI.ink }}>{d.label}</span>
                <span className="text-xs tabular-nums" style={{ color: "#a3a3a3" }}>/{d.max}</span>
              </div>
              <div className="mt-0.5 text-[11px] leading-tight" style={{ color: UI.sub }}>{d.desc}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs" style={{ color: UI.sub }}>
          The composite writes to <span className="font-mono" style={{ color: UI.ink }}>qualityScore</span>; the reasoning shows on each exercise page.
          The coherence validator cross-checks that an exercise&rsquo;s primary muscles actually produce its linked movements.
        </p>
      </Card>

      {/* Interop */}
      <Card className="mb-5">
        <SectionTitle>Interoperability Layer</SectionTitle>
        <p className="mb-4 text-sm" style={{ color: UI.sub }}>
          The graph stays terminology-agnostic internally, but exports to clinical standards so it can live inside any health system.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border p-4" style={{ borderColor: UI.line, background: "#f7f7f7" }}>
            <div className="text-sm font-semibold" style={{ color: UI.ink }}>FHIR R4 ActivityDefinition</div>
            <p className="mt-1 text-xs" style={{ color: UI.sub }}>Every exercise renders as a standard FHIR resource, live. Portable into any FHIR-capable EHR or care-plan engine.</p>
            <div className="mt-2">
              <ProseLink href="/api/exercises/squat/fhir" target="_blank">View example (squat) →</ProseLink>
            </div>
          </div>
          <div className="rounded-md border p-4" style={{ borderColor: UI.line }}>
            <div className="text-sm font-semibold" style={{ color: UI.ink }}>EntityCode — terminology mapping</div>
            <p className="mt-1 text-xs" style={{ color: UI.sub }}>
              SNOMED CT / UCUM / ICF codes attach to any entity, each with its own verification status.
              Currently <span className="font-mono" style={{ color: UI.ink }}>{c.codes}</span> mapped — the scaffolding is in place; population is the next interop step.
            </p>
          </div>
        </div>
      </Card>

      <p className="text-xs" style={{ color: "#a3a3a3" }}>
        Full schema in <span className="font-mono">prisma/schema.prisma</span>. Programmatic access via the{" "}
        <ProseLink href="/api-docs">REST API</ProseLink>.
      </p>
    </div>
  );
}
