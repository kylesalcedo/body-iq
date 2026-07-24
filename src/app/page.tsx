import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-static";
export const metadata = { title: "Body IQ — the body, mapped" };

// Raw <img src> isn't rewritten by basePath; prefix manually for the Pages build.
const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Blueprint palette (landing-only accent)
const INK = "#132339";
const SUB = "#5b6b80";
const ACC = "#2f6da8";
const LINE = "#e4eaf1";
const FILL = "#eef3f9";

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
      <svg viewBox="0 0 64 64" className="h-[58px] w-[58px] shrink-0" aria-hidden>
        <circle cx="32" cy="32" r="26" fill="none" stroke={LINE} strokeWidth="7" />
        <circle cx="32" cy="32" r="26" fill="none" stroke={ACC} strokeWidth="7" strokeLinecap="round" strokeDasharray="143.7 163.4" transform="rotate(-90 32 32)" />
        <text x="32" y="34" textAnchor="middle" dominantBaseline="middle" fill={INK} fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="17">88</text>
        <text x="32" y="45" textAnchor="middle" fill={SUB} fontFamily="ui-monospace, monospace" fontSize="6">/ 100</text>
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {bars.map((b) => (
          <div key={b.k} className="grid grid-cols-[58px_1fr_32px] items-center gap-1.5 font-mono text-[9px]" style={{ color: SUB }}>
            <span>{b.k}</span>
            <span className="h-[5px] overflow-hidden rounded-sm" style={{ background: FILL }}>
              <span className="block h-full rounded-sm" style={{ width: `${b.w}%`, background: ACC }} />
            </span>
            <span className="text-right" style={{ color: INK }}>{b.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalViz() {
  const ex = [
    { n: "Back Squat", t: "essential" },
    { n: "Front Squat", t: "essential" },
    { n: "Bulgarian Split Squat", t: "support" },
  ];
  return (
    <div>
      <span className="inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ background: FILL, color: INK, borderColor: LINE }}>
        <span className="h-[7px] w-[7px] rounded-full" style={{ background: ACC }} />
        Improve your squat
      </span>
      <div className="mt-2 flex flex-col gap-1.5">
        {ex.map((e) => (
          <div key={e.n} className="flex items-center justify-between gap-2 rounded-md px-2.5 py-[5px] font-mono text-[10.5px]" style={{ background: FILL, color: INK }}>
            <span className="truncate">{e.n}</span>
            <span className="shrink-0 text-[8.5px] font-bold uppercase tracking-wider" style={{ color: ACC }}>{e.t}</span>
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
    <div className="flex items-stretch gap-[5px]">
      {nodes.map((n, i) => (
        <div key={n.l} className="flex items-stretch gap-[5px]">
          <div className="min-w-0 flex-1 rounded-lg border px-2 py-2 text-center" style={{ background: FILL, borderColor: LINE }}>
            <div className="font-mono text-[15px] font-bold leading-none" style={{ color: ACC }}>{n.k}</div>
            <div className="mt-[3px] text-[8.5px] uppercase tracking-wide" style={{ color: SUB }}>{n.l}</div>
          </div>
          {i < nodes.length - 1 && <span className="flex items-center text-[11px]" style={{ color: "#b9c8d9" }}>→</span>}
        </div>
      ))}
    </div>
  );
}

function RomArc() {
  return (
    <div className="flex items-center gap-3.5">
      <svg viewBox="0 0 104 60" className="h-[58px] w-[100px] shrink-0" aria-hidden>
        <path d="M 12 54 A 40 40 0 0 1 92 54" fill="none" stroke={LINE} strokeWidth="6" />
        <path d="M 12 54 A 40 40 0 0 1 80.3 25.7" fill="none" stroke={ACC} strokeWidth="6" strokeLinecap="round" />
        <line x1="52" y1="54" x2="80.3" y2="25.7" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <circle cx="52" cy="54" r="3" fill={INK} />
      </svg>
      <div>
        <div className="font-mono text-[19px] font-bold leading-none" style={{ color: INK }}>0–135°</div>
        <div className="mt-[3px] text-[11px]" style={{ color: SUB }}>knee flexion · AROM</div>
      </div>
    </div>
  );
}

function GaitBar() {
  const phases = ["IC", "LR", "MSt", "TSt", "PSw", "ISw", "MSw", "TSw"];
  return (
    <div>
      <div className="flex h-[30px] overflow-hidden rounded-md border" style={{ borderColor: LINE }}>
        {phases.map((p, i) => (
          <div key={p} className="flex flex-1 items-center justify-center border-r font-mono text-[8px] last:border-r-0" style={{ color: SUB, borderColor: LINE, background: i < 5 ? FILL : "transparent" }}>
            {p}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9px]" style={{ color: SUB }}>
        <span><b style={{ color: ACC }}>STANCE</b> · 62%</span>
        <span><b style={{ color: ACC }}>SWING</b> · 38%</span>
      </div>
    </div>
  );
}

function FhirViz({ sources, codes }: { sources: number; codes: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px]" style={{ color: SUB }}>
        <b style={{ color: INK }}>{sources.toLocaleString()}</b> sources · <b style={{ color: INK }}>{codes}</b> SNOMED codes
      </div>
      <div className="overflow-hidden rounded-md border p-2.5 font-mono text-[9.5px] leading-relaxed" style={{ background: FILL, borderColor: LINE, color: SUB }}>
        <span style={{ color: ACC }}>&quot;resourceType&quot;</span>: <span style={{ color: INK }}>&quot;ActivityDefinition&quot;</span>,<br />
        <span style={{ color: ACC }}>&quot;title&quot;</span>: <span style={{ color: INK }}>&quot;Back Squat&quot;</span>,<br />
        <span style={{ color: ACC }}>&quot;status&quot;</span>: <span style={{ color: INK }}>&quot;active&quot;</span>
      </div>
    </div>
  );
}

/* ---------- card wrapper ---------- */

function FeatureCard({ href, title, desc, icon, children }: {
  href: string; title: string; desc: string; icon?: string; children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[208px] flex-col gap-3 rounded-xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-18px_rgba(19,35,59,.4)]"
      style={{ borderColor: LINE }}
    >
      {/* single graph-node signifier */}
      <span className="absolute left-4 top-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full" style={{ background: ACC, boxShadow: "0 0 0 3px #f8fafc" }} aria-hidden />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-tight group-hover:underline" style={{ color: INK, textDecorationColor: ACC }}>{title}</h3>
          {icon && <img src={`${BP}/icons/${icon}.png`} alt="" className="h-6 w-6 shrink-0 opacity-90 [image-rendering:pixelated]" />}
        </div>
        <p className="text-xs leading-relaxed text-pretty" style={{ color: SUB }}>{desc}</p>
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
    <div className="mx-auto max-w-5xl px-2 py-8 sm:px-4">
      {/* hero */}
      <section className="mb-9 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <img src={`${BP}/icons/brand.png`} alt="Body IQ" className="h-8 w-8 [image-rendering:pixelated]" />
          <span className="text-base font-bold tracking-tight" style={{ color: INK }}>Body IQ</span>
        </div>
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: ACC }}>
          Biomechanics knowledge engine
        </div>
        <h1 className="text-balance text-[clamp(30px,5vw,44px)] font-bold leading-[1.04] tracking-tight" style={{ color: INK }}>
          The body, mapped.
        </h1>
        <p className="max-w-xl text-pretty text-[15px]" style={{ color: SUB }}>
          Anatomy, movement, and exercise as one evidence-backed graph.
        </p>
        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs" style={{ color: SUB }}>
          {stats.map(([n, label], i) => (
            <span key={label} className="flex items-center gap-1.5">
              {i > 0 && <span style={{ color: "#b9c8d9" }}>·</span>}
              <b className="font-semibold tabular-nums" style={{ color: ACC }}>{n.toLocaleString()}</b> {label}
            </span>
          ))}
        </div>
      </section>

      {/* equal-rectangle feature grid */}
      <section className="grid auto-rows-fr grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard href="/exercises" title="Exercise Library" desc="Every exercise scored 0 to 100 on evidence, coherence, and completeness.">
          <QualityGauge />
        </FeatureCard>
        <FeatureCard href="/goals" title="Goals" desc="Say what you want and get exercises ranked for rehab or performance.">
          <GoalViz />
        </FeatureCard>
        <FeatureCard href="/body-map" title="Anatomy Graph" desc="Region to joint to movement to muscle, every connection real." icon="anatomy">
          <AnatomyChain r={regions} j={joints} m={movements} mu={muscles} />
        </FeatureCard>
        <FeatureCard href="/movements" title="Range of Motion" desc="Every joint motion with its plane, axis, and normal range.">
          <RomArc />
        </FeatureCard>
        <FeatureCard href="/gait" title="Gait Cycle" desc="The eight Rancho phases with kinematics and phase-specific exercises." icon="clinical">
          <GaitBar />
        </FeatureCard>
        <FeatureCard href="/sources" title="Evidence + FHIR" desc="Every claim is cited, and every exercise exports as FHIR." icon="admin">
          <FhirViz sources={sources} codes={codes} />
        </FeatureCard>
      </section>
    </div>
  );
}
