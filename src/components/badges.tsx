import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  needs_review: "bg-amber-50 text-amber-700 border-amber-300",
  reviewed: "bg-blue-50 text-blue-700 border-blue-300",
  verified: "bg-green-50 text-green-700 border-green-300",
  disputed: "bg-red-50 text-red-700 border-red-300",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  needs_review: "Needs Review",
  reviewed: "Reviewed",
  verified: "Verified",
  disputed: "Disputed",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusColors[status] || statusColors.draft
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 80
      ? "text-green-700 bg-green-50 border-green-300"
      : pct >= 60
        ? "text-blue-700 bg-blue-50 border-blue-300"
        : pct >= 40
          ? "text-amber-700 bg-amber-50 border-amber-300"
          : "text-red-700 bg-red-50 border-red-300";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums",
        color
      )}
      title="Confidence"
    >
      {pct}%
    </span>
  );
}

const roleColors: Record<string, string> = {
  primary: "bg-indigo-50 text-indigo-700 border-indigo-300",
  secondary: "bg-purple-50 text-purple-700 border-purple-300",
  stabilizer: "bg-teal-50 text-teal-700 border-teal-300",
  synergist: "bg-sky-50 text-sky-700 border-sky-300",
  common_association: "bg-gray-50 text-gray-600 border-gray-300",
};

const roleLabels: Record<string, string> = {
  primary: "Primary",
  secondary: "Secondary",
  stabilizer: "Stabilizer",
  synergist: "Synergist",
  common_association: "Common Association",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        roleColors[role] || roleColors.common_association
      )}
    >
      {roleLabels[role] || role}
    </span>
  );
}
