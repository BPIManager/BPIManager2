import { cn } from "@/lib/utils";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";
import { useTranslation } from "@/hooks/common/useTranslation";

interface StepProgress {
  songId: number;
  title: string;
  difficulty: string;
  toExScore: number;
  fromExScore: number | null;
  currentExScore: number | null;
  fromBpi: number;
  currentBpi: number | null;
  toBpi: number;
  /** #474以前に保存されたメモには無いため、無い場合はレート表示を省略する */
  notes: number | null;
}

/**
 * Optimizer関連の表示で共有する最小限のユーティリティ。
 * ダッシュボードの達成状況ウィジェットと「目標管理」タブは見た目を揃える
 * 必要が無いため、それぞれ独自のレイアウト（`OptimizerProgress/ui.tsx`・
 * `BpiOptimizer/ui/GoalCard.tsx`）を持つ。ここには両方・カスタム目標作成
 * プレビューから再利用する小さな部品だけを置く。
 *
 * 目標を超えて達成した場合も、達成そのもの(色・ラベルとも「達成」)として
 * 扱う。超過を専用の色・ラベルで特別扱いすると「良いことをしたのに
 * 警告のような見た目になる」ため区別しない。
 */

export const MiniBpiChip = ({ bpi }: { bpi: number }) => {
  const { bg, color } = getBpiColorStyle(bpi);
  return (
    <span
      className="inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-xs font-bold"
      style={{ backgroundColor: bg, color }}
    >
      {bpi.toFixed(2)}
    </span>
  );
};

/**
 * 総合BPIの推移をfull widthのバーで見せる。`from`（作成時のBPI）を渡さない
 * 場合は2点表示（現在→目標）になり、その場合`current`=`from`扱いのため
 * バーは常に0%（＝まだ何も達成していないプレビュー）になる。
 */
export const BpiJourneyBar = ({
  from,
  current,
  to,
}: {
  from?: number;
  current: number;
  to: number;
}) => {
  const { t } = useTranslation();
  const start = from ?? current;
  const span = to - start;
  const pct =
    span === 0
      ? current >= to
        ? 100
        : 0
      : Math.min(100, Math.max(0, ((current - start) / span) * 100));
  const isAchieved = current >= to;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-bpim-muted/15">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isAchieved ? "bg-bpim-success" : "bg-bpim-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        {from !== undefined && (
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wide text-bpim-subtle">
              {t("optimizer.bpiJourney.created")}
            </span>
            <MiniBpiChip bpi={from} />
          </div>
        )}
        <div className="flex flex-col items-center gap-0.5">
          <span
            className={cn(
              "text-[9px] font-bold uppercase tracking-wide",
              isAchieved ? "text-bpim-success" : "text-bpim-subtle",
            )}
          >
            {t("optimizer.bpiJourney.current")}
            {isAchieved ? ` (${t("dashboard.optimizerProgress.achieved")})` : ""}
          </span>
          <MiniBpiChip bpi={current} />
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wide text-bpim-subtle">
            {t("optimizer.bpiJourney.target")}
          </span>
          <MiniBpiChip bpi={to} />
        </div>
      </div>
    </div>
  );
};

export const buildStepProgress = (
  memo: OptimizeMemo,
  currentScores: Map<number, number | null>,
  currentBpis: Map<number, number | null>,
): StepProgress[] =>
  (memo.reportData.steps ?? []).map((step) => ({
    songId: step.songId,
    title: step.title,
    difficulty: step.difficulty,
    toExScore: step.toExScore,
    fromExScore: step.fromExScore,
    currentExScore: currentScores.get(step.songId) ?? null,
    fromBpi: step.fromBpi,
    currentBpi: currentBpis.get(step.songId) ?? null,
    toBpi: step.toBpi,
    notes: step.notes ?? null,
  }));
