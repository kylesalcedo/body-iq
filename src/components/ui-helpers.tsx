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

/**
 * The one grid card used by every list-of-entities page (muscles, regions,
 * joints, tasks…). One size, one structure, one hover — kills the p-4/p-5,
 * text-lg/text-xl drift that made the pages feel unrelated.
 * The whole card is a single link, so nothing interactive nests inside it.
 */
export function EntityCard({
  href,
  title,
  description,
  region,
  meta,
  badges,
}: {
  href: string;
  title: string;
  description?: string | null;
  region?: React.ReactNode;
  meta?: React.ReactNode;
  badges?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[112px] flex-col gap-1.5 rounded-[5px] border border-[#e4e4e4] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#232121] hover:shadow-[0_10px_28px_-20px_rgba(0,0,0,.45)]"
    >
      <span
        className="absolute left-4 top-0 h-1.5 w-1.5 -translate-y-1/2"
        style={{ background: "#000", boxShadow: `0 0 0 3px ${UI.ground}` }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold group-hover:underline" style={{ color: UI.ink }}>{title}</h3>
        {badges && <div className="flex flex-shrink-0 flex-wrap gap-1.5">{badges}</div>}
      </div>
      {region && <div className="text-xs" style={{ color: UI.sub }}>{region}</div>}
      {description && (
        <p className="line-clamp-2 text-[11.5px] leading-snug" style={{ color: UI.sub }}>{description}</p>
      )}
      {meta && <div className="mt-auto pt-1 font-mono text-[10.5px]" style={{ color: UI.sub }}>{meta}</div>}
    </Link>
  );
}

// A uniform responsive grid for EntityCard lists.
export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

// Emphasised number for mono meta lines ("12 muscles · 31 exercises").
export function MetaNum({ children }: { children: React.ReactNode }) {
  return <b className="font-bold tabular-nums" style={{ color: UI.ink }}>{children}</b>;
}
