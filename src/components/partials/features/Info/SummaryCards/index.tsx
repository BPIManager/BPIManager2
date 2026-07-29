import { DashCard } from "@/components/ui/dashcard";

export function SummaryCard({
  label,
  total,
  today,
  color,
}: {
  label: string;
  total: number;
  today: number;
  color: string;
}) {
  return (
    <DashCard>
      <p className="text-[11px] font-bold uppercase tracking-wider text-bpim-muted">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>
        {total.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-bpim-muted">
        前日:{" "}
        <span className="font-bold text-bpim-text">
          +{today.toLocaleString()}
        </span>
      </p>
    </DashCard>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full rounded-xl border border-bpim-border bg-bpim-surface p-5 animate-pulse ${className}`}
    >
      <div className="h-4 w-24 rounded bg-bpim-overlay mb-3" />
      <div className="h-8 w-32 rounded bg-bpim-overlay" />
    </div>
  );
}
