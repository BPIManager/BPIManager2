import type { SiteStatsPeriod } from "@/types/siteStats";

const PERIOD_LABELS: Record<SiteStatsPeriod, string> = {
  all: "全期間",
  d90: "過去90日",
  d30: "過去30日",
  d7: "過去7日",
};
const PERIODS: SiteStatsPeriod[] = ["all", "d90", "d30", "d7"];

export function PeriodTabs({
  value,
  onChange,
}: {
  value: SiteStatsPeriod;
  onChange: (p: SiteStatsPeriod) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded border border-bpim-border text-[10px]">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-2 py-0.5 transition-colors ${
            value === p
              ? "bg-bpim-primary text-bpim-surface"
              : "text-bpim-muted hover:bg-bpim-overlay"
          }`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}
