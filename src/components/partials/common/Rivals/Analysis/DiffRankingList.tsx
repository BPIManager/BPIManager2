import { RADAR_COLORS } from "@/constants/iidx/radars";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { RivalDiffPoint } from "@/hooks/social/useRivalAnalysis";

const DiffRankingList = ({
  title,
  items,
  isWin,
}: {
  title: string;
  items: RivalDiffPoint[];
  isWin: boolean;
}) => {
  const { t } = useTranslation();
  const maxDiff = Math.max(...items.map((i) => i.diff), 1);
  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg p-5 shadow-sm">
      <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-center text-xs text-bpim-muted">
          {t("rivals.analysis.noSongs")}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((item, i) => {
            const pct = Math.min(100, (item.diff / maxDiff) * 100);
            const color = isWin ? "#4ade80" : "#ef4444";
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-right text-[10px] font-bold text-bpim-muted">
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[11px] font-bold text-bpim-text">
                        {item.title}
                      </span>
                      <span className="text-[9px] text-bpim-muted">
                        {item.difficulty}
                        {item.radarCategory && (
                          <span
                            className="ml-1"
                            style={{ color: RADAR_COLORS[item.radarCategory] }}
                          >
                            {item.radarCategory}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end font-mono text-[10px]">
                      <span className="font-black" style={{ color }}>
                        {isWin ? "+" : "-"}
                        {item.diff.toFixed(1)}
                      </span>
                      <span className="text-bpim-muted">
                        {item.myBpi.toFixed(1)} / {item.rivalBpi.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-bpim-surface-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiffRankingList;
