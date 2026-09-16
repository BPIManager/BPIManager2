import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  accent?: string;
}

const StatCard = ({ label, value, accent }: StatCardProps) => (
  <div className="flex flex-col gap-1 rounded-xl border border-bpim-border bg-bpim-surface-2/60 px-5 py-4">
    <span className="text-[10px] font-black uppercase tracking-widest text-bpim-muted">
      {label}
    </span>
    <span
      className={cn(
        "font-mono text-2xl font-black leading-none",
        accent ?? "text-bpim-text",
      )}
    >
      {value}
    </span>
  </div>
);

export default StatCard;
