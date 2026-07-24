import Link from "next/link";

// Shared monochrome design tokens — the vocabulary the landing established.
// Feature colors (status / category / goal-type badges) live in badges.tsx and
// keep their meaning; these are the neutral chrome everything else is built from.
export const UI = {
  ink: "#17161a",
  sub: "#686868",
  acc: "#232121",
  line: "#e4e4e4",
  fill: "#ededed",
  ground: "#f8fafc",
};

export function EntityLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`underline-offset-2 hover:underline ${className || ""}`}
      style={className?.includes("text-") ? undefined : { color: UI.ink }}
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-md border border-gray-200 bg-white p-5 ${className || ""}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-[15px] font-semibold" style={{ color: UI.ink }}>{children}</h2>;
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-3 text-sm italic" style={{ color: UI.sub }}>{message}</p>;
}

export function PageHeader({
  title,
  subtitle,
  badges,
}: {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight" style={{ color: UI.ink }}>{title}</h1>
      {subtitle && <p className="mt-1 font-mono text-xs" style={{ color: UI.sub }}>{subtitle}</p>}
      {badges && <div className="mt-2 flex flex-wrap gap-2">{badges}</div>}
      <div className="mt-4 h-px" style={{ background: UI.line }} />
    </div>
  );
}

// A bordered container that holds a stack of EntityRow items.
export function ListContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: UI.line }}>
      {children}
    </div>
  );
}

/**
 * One information row — the shared spec for every list page (muscles, regions,
 * joints, tasks, exercises…). Two sections only: a flexible content column that
 * shrinks/truncates, and a shrink-0 badge cluster. They can never overlap.
 */
export function EntityRow({
  href,
  title,
  sub,
  meta,
  badges,
  first,
}: {
  href: string;
  title: string;
  sub?: React.ReactNode;
  meta?: React.ReactNode;
  badges?: React.ReactNode;
  first?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 px-4 py-3 transition-colors hover:bg-[#ededed]"
      style={{ borderTop: first ? undefined : `1px solid ${UI.line}` }}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold" style={{ color: UI.ink }}>{title}</div>
        {sub && <div className="mt-0.5 text-xs" style={{ color: UI.sub }}>{sub}</div>}
        {meta && <div className="mt-1 font-mono text-[10.5px]" style={{ color: UI.sub }}>{meta}</div>}
      </div>
      {badges && <div className="flex flex-shrink-0 gap-1.5 pt-0.5">{badges}</div>}
    </Link>
  );
}

// Emphasised number for mono meta lines ("12 muscles · 31 exercises").
export function MetaNum({ children }: { children: React.ReactNode }) {
  return <b className="font-bold tabular-nums" style={{ color: UI.ink }}>{children}</b>;
}
