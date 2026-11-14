import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { DashCard } from "@/components/ui/dashcard";
import { Switch } from "@/components/ui/switch";
import { HelpTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import RadarSectionChart from "@/components/partials/common/DashBoard/Radar";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";
import { useTranslation } from "@/hooks/common/useTranslation";
import { clickableProps } from "@/utils/common/clickableProps";
import { relativeRadarDomain, toRelativeBpi } from "@/lib/radar/relative";
import type { RadarCategory } from "@/types/stats/radar";
import type { RadarGrowthSnapshot } from "@/types/logs/radarGrowth";

const formatDiff = (diff: number, digits: number) =>
  `${diff > 0 ? "+" : ""}${diff.toFixed(digits)}`;

const LogRadarGrowthCard = ({
  data,
  onOpenSongs,
  onOpenList,
}: {
  data: RadarGrowthSnapshot;
  /** 更新曲と総合BPIへの影響のモーダルを開く */
  onOpenSongs: (category: RadarCategory) => void;
  /** 指定時、行クリックで更新楽曲タブ（カテゴリで絞り込み）へ遷移する */
  onOpenList?: (category: RadarCategory) => void;
}) => {
  const { t } = useTranslation();
  // 相対評価（更新前=1.00）はレーダーの描画だけに適用し、右側の数値は常に絶対値（BPI）を出す
  const [isRelative, setIsRelative] = useState(true);
  const digits = isRelative ? 3 : 2;

  const sorted = useMemo(
    () => [...data.categories].sort((a, b) => b.after - a.after),
    [data],
  );
  const chartBefore = Object.fromEntries(
    data.categories.map((c) => [c.category, isRelative ? 1 : c.before]),
  );
  const chartAfter = Object.fromEntries(
    data.categories.map((c) => [
      c.category,
      isRelative ? toRelativeBpi(c.before, c.after) : c.after,
    ]),
  );
  const domain = useMemo(
    () =>
      isRelative
        ? relativeRadarDomain(data.categories.map((c) => toRelativeBpi(c.before, c.after)))
        : undefined,
    [isRelative, data],
  );

  return (
    <DashCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold uppercase text-bpim-muted">
            {t("logs.detail.radarGrowth")}
          </h3>
          <HelpTooltip>{t("logs.detail.radarGrowth.mode.help")}</HelpTooltip>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <span
              className={cn(
                "whitespace-nowrap text-xs font-bold",
                !isRelative ? "text-bpim-text" : "text-bpim-subtle",
              )}
            >
              {t("logs.detail.radarGrowth.mode.absolute")}
            </span>
            <Switch checked={isRelative} onCheckedChange={setIsRelative} />
            <span
              className={cn(
                "whitespace-nowrap text-xs font-bold",
                isRelative ? "text-bpim-text" : "text-bpim-subtle",
              )}
            >
              {t("logs.detail.radarGrowth.mode.relative")}
            </span>
          </label>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-bpim-warning" />
            <span className="text-xs font-bold text-bpim-warning">
              {t("logs.detail.radarGrowth.before")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-bpim-primary" />
            <span className="text-xs font-bold text-bpim-primary">
              {t("logs.detail.radarGrowth.after")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
        <RadarSectionChart
          data={chartAfter}
          rivalData={chartBefore}
          domain={domain}
          labels={{
            me: t("logs.detail.radarGrowth.after"),
            rival: t("logs.detail.radarGrowth.before"),
            growth: true,
            digits,
          }}
        />
        <div className="flex flex-col gap-2">
          {sorted.map((c) => {
            const style = getBpiColorStyle(c.after);
            return (
              <div
                key={c.category}
                {...clickableProps(() => (onOpenList ?? onOpenSongs)(c.category))}
                title={onOpenList ? t("logs.detail.radarGrowth.openList") : undefined}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md border border-bpim-border bg-bpim-surface-2/60 p-2.5 transition-all duration-200",
                  "hover:translate-x-1 hover:bg-bpim-overlay",
                )}
              >
                <span className="text-xs font-bold text-bpim-text">
                  {c.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-bpim-muted">
                    {c.before.toFixed(2)}
                  </span>
                  <span className="text-xs text-bpim-subtle">→</span>
                  <div
                    className="inline-flex min-w-16 items-center justify-center rounded-sm border px-2 py-0.5 font-mono text-sm font-bold text-bpim-text"
                    style={{
                      borderColor: style.bg,
                      backgroundColor: `${style.bg}15`,
                    }}
                  >
                    {c.after.toFixed(2)}
                  </div>
                  {onOpenList && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSongs(c.category);
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      aria-label={t("logs.detail.radarGrowth.openSongs")}
                      title={t("logs.detail.radarGrowth.openSongs")}
                      className="order-last rounded-md p-1 text-bpim-muted transition-colors hover:bg-bpim-overlay hover:text-bpim-text"
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <span
                    className={cn(
                      "min-w-14 text-right font-mono text-xs font-bold",
                      c.diff > 0 && "text-bpim-success",
                      c.diff < 0 && "text-bpim-danger",
                      c.diff === 0 && "text-bpim-subtle",
                    )}
                  >
                    {formatDiff(c.diff, 2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashCard>
  );
};

export default LogRadarGrowthCard;
