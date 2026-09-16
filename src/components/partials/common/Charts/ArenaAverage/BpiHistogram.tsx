import { useMemo } from "react";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { ArenaSongPoint } from "@/hooks/metrics/useArenaAnalysis";

const BpiHistogram = ({
  songs,
  rankColor,
}: {
  songs: ArenaSongPoint[];
  rankColor: string;
}) => {
  const { t } = useTranslation();
  const buckets = useMemo(() => {
    const STEP = 10;
    const MIN = -20;
    const MAX = 110;
    const bins: { label: string; count: number }[] = [];
    for (let lo = MIN; lo < MAX; lo += STEP) {
      const hi = lo + STEP;
      const label = lo === MIN ? `<${hi}` : hi >= MAX ? `${lo}+` : `${lo}`;
      const count = songs.filter(
        (s) =>
          (lo === MIN ? s.bpi < hi : s.bpi >= lo) &&
          (hi >= MAX ? true : s.bpi < hi),
      ).length;
      bins.push({ label, count });
    }
    return bins;
  }, [songs]);

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg p-5 shadow-sm">
      <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
        {t("arenaAnalysis.bpiDistribution")}
      </h3>
      <div className="flex h-32 items-end gap-1">
        {buckets.map((b) => (
          <div
            key={b.label}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span className="text-[9px] font-bold text-bpim-muted">
              {b.count > 0 ? b.count : ""}
            </span>
            <div
              className="flex w-full flex-col justify-end"
              style={{ height: "80px" }}
            >
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${(b.count / maxCount) * 100}%`,
                  backgroundColor: rankColor,
                  opacity: b.count > 0 ? 0.8 : 0.1,
                  minHeight: b.count > 0 ? "2px" : "0",
                }}
              />
            </div>
            <span className="whitespace-nowrap text-[8px] text-bpim-muted">
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BpiHistogram;
