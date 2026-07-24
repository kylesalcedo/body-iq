import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-static";
export const metadata = { title: "Body IQ" };

// Monochrome palette — the six-value grayscale from the pixel-icon set.
const INK = "#17161a";
const SUB = "#686868";
const ACC = "#232121";
const STRONG = "#000000";
const LINE = "#dcdcdc";
const FILL = "#e9e9e9";
const GROUND = "#f8fafc"; // app main-content background (marker ring blends into it)

/* ---------- feature-card viz ---------- */

function QualityGauge() {
  const bars = [
    { k: "evidence", n: "27/30", w: 90 },
    { k: "coherence", n: "28/30", w: 93 },
    { k: "complete", n: "20/25", w: 80 },
    { k: "rigor", n: "13/15", w: 87 },
  ];
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 64 64" className="h-[56px] w-[56px] shrink-0" aria-hidden>
        <circle cx="32" cy="32" r="26" fill="none" stroke={FILL} strokeWidth="7" />
        <circle cx="32" cy="32" r="26" fill="none" stroke={ACC} strokeWidth="7" strokeLinecap="round" strokeDasharray="143.7 163.4" transform="rotate(-90 32 32)" />
        <text x="32" y="34" textAnchor="middle" dominantBaseline="middle" fill={INK} fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="17">88</text>
        <text x="32" y="45" textAnchor="middle" fill={SUB} fontFamily="ui-monospace, monospace" fontSize="6">/ 100</text>
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {bars.map((b) => (
          <div key={b.k} className="grid grid-cols-[52px_1fr_30px] items-center gap-1.5 font-mono text-[9px]" style={{ color: SUB }}>
            <span>{b.k}</span>
            <span className="h-[5px] overflow-hidden" style={{ background: FILL }}>
              <span className="block h-full" style={{ width: `${b.w}%`, background: ACC }} />
            </span>
            <span className="text-right" style={{ color: INK }}>{b.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChipListViz({ label, items }: { label: string; items: { n: string; t: string }[] }) {
  return (
    <div>
      <span className="inline-flex items-center gap-1.5 self-start rounded-[3px] border px-2.5 py-1 text-[11.5px] font-semibold" style={{ background: FILL, color: INK, borderColor: LINE }}>
        <span className="h-[7px] w-[7px]" style={{ background: STRONG }} />
        {label}
      </span>
      <div className="mt-2 flex flex-col gap-1">
        {items.map((e) => (
          <div key={e.n} className="flex items-center justify-between gap-2 rounded-[3px] px-2 py-[5px] font-mono text-[10px]" style={{ background: FILL, color: INK }}>
            <span className="truncate">{e.n}</span>
            <span className="shrink-0 text-[8px] font-bold uppercase tracking-wider" style={{ color: SUB }}>{e.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnatomyChain({ r, j, m, mu }: { r: number; j: number; m: number; mu: number }) {
  const nodes = [
    { k: r, l: "region" },
    { k: j, l: "joint" },
    { k: m, l: "move" },
    { k: mu, l: "muscle" },
  ];
  return (
    <div className="flex items-stretch gap-1">
      {nodes.map((n, i) => (
        <div key={n.l} className="flex items-stretch gap-1">
          <div className="min-w-0 flex-1 border px-2 py-2 text-center" style={{ background: FILL, borderColor: LINE }}>
            <div className="font-mono text-[14px] font-bold leading-none" style={{ color: INK }}>{n.k}</div>
            <div className="mt-[3px] text-[8px] uppercase tracking-wide" style={{ color: SUB }}>{n.l}</div>
          </div>
          {i < nodes.length - 1 && <span className="flex items-center text-[11px]" style={{ color: "#bdbdbd" }}>→</span>}
        </div>
      ))}
    </div>
  );
}

function RomArc() {
  return (
    <div className="flex items-center gap-3.5">
      <svg viewBox="0 0 104 60" className="h-[56px] w-[98px] shrink-0" aria-hidden>
        <path d="M 12 54 A 40 40 0 0 1 92 54" fill="none" stroke={FILL} strokeWidth="6" />
        <path d="M 12 54 A 40 40 0 0 1 80.3 25.7" fill="none" stroke={ACC} strokeWidth="6" strokeLinecap="round" />
        <line x1="52" y1="54" x2="80.3" y2="25.7" stroke={STRONG} strokeWidth="2" strokeLinecap="round" />
        <circle cx="52" cy="54" r="3" fill={STRONG} />
      </svg>
      <div>
        <div className="font-mono text-[19px] font-bold leading-none" style={{ color: INK }}>0–135°</div>
        <div className="mt-[3px] text-[10.5px]" style={{ color: SUB }}>knee flexion · AROM</div>
      </div>
    </div>
  );
}

function GaitBar() {
  const phases = ["IC", "LR", "MSt", "TSt", "PSw", "ISw", "MSw", "TSw"];
  return (
    <div>
      <div className="flex h-[28px] overflow-hidden border" style={{ borderColor: LINE }}>
        {phases.map((p, i) => (
          <div key={p} className="flex flex-1 items-center justify-center border-r font-mono text-[8px] last:border-r-0" style={{ color: SUB, borderColor: LINE, background: i < 5 ? FILL : "transparent" }}>
            {p}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[8.5px]" style={{ color: SUB }}>
        <span><b style={{ color: INK }}>STANCE</b> · 62%</span>
        <span><b style={{ color: INK }}>SWING</b> · 38%</span>
      </div>
    </div>
  );
}

function PlannerViz() {
  const cols = ["Flex", "Ext", "Abd", "Rot"];
  const rows = [
    { r: "Hip", cells: [{ v: "12", bg: "#3b3b3b" }, { v: "9", bg: "#686868" }, { v: "7", hot: true }, { v: "5", bg: "#a8a8a8" }] },
    { r: "Knee", cells: [{ v: "14", bg: "#232121" }, { v: "11", bg: "#4f4f4f" }, { v: "2", bg: "#cfcfcf", fg: "#686868" }, { v: "0", bg: "#e2e2e2", fg: "#a0a0a0" }] },
    { r: "Shldr", cells: [{ v: "8", bg: "#5a5a5a" }, { v: "8", bg: "#5a5a5a" }, { v: "6", bg: "#7a7a7a" }, { v: "9", bg: "#4f4f4f" }] },
  ];
  return (
    <div>
      <div className="grid gap-[3px] font-mono text-[8px]" style={{ gridTemplateColumns: "32px repeat(4,1fr)" }}>
        <div />
        {cols.map((c) => <div key={c} className="pb-px text-center" style={{ color: SUB }}>{c}</div>)}
        {rows.flatMap((row) => [
          <div key={`${row.r}-l`} className="flex items-center" style={{ color: SUB }}>{row.r}</div>,
          ...row.cells.map((c, i) => (
            <div
              key={`${row.r}-${i}`}
              className="flex h-5 items-center justify-center text-[8.5px] font-bold"
              style={(c as any).hot
                ? { outline: `2px solid ${STRONG}`, outlineOffset: "-2px", color: STRONG, background: "#fff" }
                : { background: (c as any).bg, color: (c as any).fg || "#fff" }}
            >
              {c.v}
            </div>
          )),
        ])}
      </div>
      <div className="mt-1.5 font-mono text-[9px]" style={{ color: SUB }}>
        <b style={{ color: INK }}>Hip × Abduction</b> → 7 exercises
      </div>
    </div>
  );
}

function FinderViz() {
  const filters = [{ k: "muscle:", v: "Glutes" }, { k: "kit:", v: "None" }, { k: "level:", v: "Beginner" }];
  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {filters.map((f) => (
          <span key={f.v} className="inline-flex gap-1 rounded-[3px] border px-1.5 py-[3px] font-mono text-[9px]" style={{ background: FILL, color: INK, borderColor: LINE }}>
            <span style={{ color: SUB }}>{f.k}</span>{f.v}
          </span>
        ))}
      </div>
      <div className="mt-2 font-mono text-[10px]" style={{ color: SUB }}><b style={{ color: INK, fontWeight: 700 }}>42</b> exercises match</div>
      <div className="mt-1.5 flex flex-col gap-[3px]">
        {[100, 82, 64].map((w, i) => <div key={i} className="h-[7px]" style={{ width: `${w}%`, background: FILL }} />)}
      </div>
    </div>
  );
}

/* ---------- card wrapper ---------- */

function FeatureCard({ href, title, desc, children }: {
  href: string; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[172px] flex-col gap-2 rounded-[5px] border border-[#dcdcdc] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#232121] hover:shadow-[0_10px_28px_-20px_rgba(0,0,0,.45)]"
    >
      {/* pixel-square node marker */}
      <span className="absolute left-4 top-0 h-[7px] w-[7px] -translate-y-1/2" style={{ background: STRONG, boxShadow: `0 0 0 3px ${GROUND}` }} aria-hidden />
      <div className="flex flex-col gap-1.5">
        <h3 className="text-sm font-semibold tracking-tight group-hover:underline" style={{ color: INK }}>{title}</h3>
        <p className="text-pretty text-[11.5px] leading-relaxed" style={{ color: SUB }}>{desc}</p>
      </div>
      <div className="mt-auto">{children}</div>
    </Link>
  );
}

/* ---------- page ---------- */

export default async function Home() {
  const [regions, joints, movements, muscles, exercises, sources, codes] = await Promise.all([
    prisma.region.count(),
    prisma.joint.count(),
    prisma.movement.count(),
    prisma.muscle.count(),
    prisma.exercise.count(),
    prisma.researchSource.count(),
    prisma.entityCode.count(),
  ]);

  const stats = [
    [exercises, "exercises"],
    [muscles, "muscles"],
    [movements, "movements"],
    [sources, "sources"],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl px-2 py-6 sm:px-4">
      {/* hero — no brand repeat, leads with the value */}
      <section className="mb-6 flex flex-col gap-2.5">
        <h1 className="text-[clamp(14px,2vw,18px)] font-semibold tracking-tight" style={{ color: INK }}>
          Anatomy, movement, and exercise as one evidence-backed graph.
        </h1>
        <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs" style={{ color: SUB }}>
          {stats.map(([n, label], i) => (
            <span key={label} className="flex items-center gap-1.5">
              {i > 0 && <span style={{ color: "#bdbdbd" }}>·</span>}
              <b className="font-bold tabular-nums" style={{ color: INK }}>{n.toLocaleString()}</b> {label}
            </span>
          ))}
        </div>
      </section>

      {/* nine equal-rectangle feature cards */}
      <section className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard href="/exercises" title="Exercise Library" desc="Every exercise scored 0 to 100 on evidence, coherence, and completeness.">
          <QualityGauge />
        </FeatureCard>
        <FeatureCard href="/goals" title="Goals" desc="Say what you want and get exercises ranked for rehab or performance.">
          <ChipListViz label="Improve your squat" items={[{ n: "Back Squat", t: "essential" }, { n: "Front Squat", t: "essential" }, { n: "Bulgarian Split Squat", t: "support" }]} />
        </FeatureCard>
        <FeatureCard href="/finder" title="Exercise Finder" desc="Filter the library by muscle, movement, equipment, or difficulty.">
          <FinderViz />
        </FeatureCard>

        <FeatureCard href="/body-map" title="Anatomy Graph" desc="Region to joint to movement to muscle, every connection real.">
          <AnatomyChain r={regions} j={joints} m={movements} mu={muscles} />
        </FeatureCard>
        <FeatureCard href="/movements" title="Range of Motion" desc="Every joint motion with its plane, axis, and normal range.">
          <RomArc />
        </FeatureCard>
        <FeatureCard href="/tasks" title="Functional Tasks" desc="Everyday activities mapped to the exercises that build them.">
          <ChipListViz label="Climbing stairs" items={[{ n: "Step-Up", t: "essential" }, { n: "Split Squat", t: "essential" }, { n: "Standing Calf Raise", t: "support" }]} />
        </FeatureCard>

        <FeatureCard href="/gait" title="Gait Cycle" desc="The eight Rancho phases with kinematics and phase-specific exercises.">
          <GaitBar />
        </FeatureCard>
        <FeatureCard href="/planner" title="Workout Planner" desc="Pick a region and movement, get every exercise that trains it.">
          <PlannerViz />
        </FeatureCard>
        <FeatureCard href="/sources" title="Evidence + FHIR" desc="Every claim is cited, and every exercise exports as FHIR.">
          <div>
            <div className="mb-1.5 flex gap-1.5 font-mono text-[9.5px]" style={{ color: SUB }}>
              <b style={{ color: INK }}>{sources.toLocaleString()}</b> sources · <b style={{ color: INK }}>{codes}</b> SNOMED codes
            </div>
            <div className="overflow-hidden border p-2.5 font-mono text-[9px] leading-relaxed" style={{ background: FILL, borderColor: LINE, color: SUB }}>
              &quot;resourceType&quot;: <span style={{ color: INK }}>&quot;ActivityDefinition&quot;</span>,<br />
              &quot;title&quot;: <span style={{ color: INK }}>&quot;Back Squat&quot;</span>,<br />
              &quot;status&quot;: <span style={{ color: INK }}>&quot;active&quot;</span>
            </div>
          </div>
        </FeatureCard>
      </section>
    </div>
  );
}
