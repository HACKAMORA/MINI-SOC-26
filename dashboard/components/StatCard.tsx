type StatCardProps = {
  label: string;
  value: number | string;
  accent?: "brand" | "critical" | "high" | "medium" | "low";
  sublabel?: string;
};

const accentText: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "text-brand",
  critical: "text-critical",
  high: "text-high",
  medium: "text-medium",
  low: "text-low",
};

const accentDot: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-brand",
  critical: "bg-critical",
  high: "bg-high",
  medium: "bg-medium",
  low: "bg-low",
};

export function StatCard({ label, value, accent = "brand", sublabel }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${accentDot[accent]}`} />
        {label}
      </div>
      <div className={`mt-3 text-3xl font-semibold tabular-nums ${accentText[accent]}`}>{value}</div>
      {sublabel && <div className="mt-1 text-xs text-muted">{sublabel}</div>}
    </div>
  );
}
