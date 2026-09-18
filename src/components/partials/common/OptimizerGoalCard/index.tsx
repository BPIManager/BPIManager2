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
 * Optimizer関連の表示で共有するユーティリティ・部品。
 * ダッシュボードの達成状況ウィジェットは一覧性重視の簡易表示
 * （`OptimizerProgress/ui.tsx`）を持つ一方、目標1件をタップした先の詳細
 * （達成状況＋曲一覧）は`GoalDetailDrawer`としてダッシュボード・
 * 「目標管理」タブの双方から共有する。
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
  showAchievedState = true,
}: {
  from?: number;
  current: number;
  to: number;
  showAchievedState?: boolean;
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
  const isAchieved = showAchievedState && current >= to;

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
            {isAchieved
              ? ` (${t("dashboard.optimizerProgress.achieved")})`
              : ""}
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

/**
 * ダッシュボードウィジェット・「目標管理」タブ双方の曲一覧で共有する
 * 並び替え。「追加した順」はプラン保存時の順序をそのまま維持し、
 * 「近い順/遠い順」は目標EXスコアまでの残り(未プレイは目標スコアそのもの
 * を最大距離として扱う)で並べ替える。達成済みの曲は残り0として並び替えの
 * 対象にすると常に「近い順」の先頭に来てしまうため、並び替え対象からは
 * 除外し常に末尾へ固定する。
 */
export type StepSortOrder = "added" | "nearest" | "farthest";
export const STEP_SORT_ORDERS: StepSortOrder[] = [
  "added",
  "nearest",
  "farthest",
];

interface SortableStep {
  toExScore: number;
  currentExScore: number | null;
}

const isAchieved = (step: SortableStep) =>
  step.currentExScore != null && step.currentExScore >= step.toExScore;

const remainingToTarget = (step: SortableStep) =>
  step.currentExScore == null
    ? step.toExScore
    : Math.max(0, step.toExScore - step.currentExScore);

export function sortStepsByOrder<T extends SortableStep>(
  steps: T[],
  order: StepSortOrder,
): T[] {
  if (order === "added") return steps;
  const unachieved = steps.filter((s) => !isAchieved(s));
  const achieved = steps.filter(isAchieved);
  const sorted = unachieved.sort(
    (a, b) => remainingToTarget(a) - remainingToTarget(b),
  );
  const ordered = order === "nearest" ? sorted : sorted.reverse();
  return [...ordered, ...achieved];
}
