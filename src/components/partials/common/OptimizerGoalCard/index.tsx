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

export type StepSortOrder =
  | "added"
  | "scoreNearest"
  | "scoreFarthest"
  | "bpiNearest"
  | "bpiFarthest";
export const STEP_SORT_ORDERS: StepSortOrder[] = [
  "added",
  "scoreNearest",
  "scoreFarthest",
  "bpiNearest",
  "bpiFarthest",
];

interface SortableStep {
  toExScore: number;
  currentExScore: number | null;
  fromBpi: number;
  toBpi: number;
  currentBpi: number | null;
}

const isAchieved = (step: SortableStep) =>
  step.currentExScore != null && step.currentExScore >= step.toExScore;

const remainingScoreToTarget = (step: SortableStep) =>
  step.currentExScore == null
    ? step.toExScore
    : Math.max(0, step.toExScore - step.currentExScore);

const remainingBpiToTarget = (step: SortableStep) =>
  step.currentBpi == null
    ? step.toBpi - step.fromBpi
    : Math.max(0, step.toBpi - step.currentBpi);

const SORT_METRIC_BY_ORDER: Record<
  Exclude<StepSortOrder, "added">,
  { metric: (step: SortableStep) => number; direction: 1 | -1 }
> = {
  scoreNearest: { metric: remainingScoreToTarget, direction: 1 },
  scoreFarthest: { metric: remainingScoreToTarget, direction: -1 },
  bpiNearest: { metric: remainingBpiToTarget, direction: 1 },
  bpiFarthest: { metric: remainingBpiToTarget, direction: -1 },
};

export function sortStepsByOrder<T extends SortableStep>(
  steps: T[],
  order: StepSortOrder,
): T[] {
  if (order === "added") return steps;
  const unachieved = steps.filter((s) => !isAchieved(s));
  const achieved = steps.filter(isAchieved);
  const { metric, direction } = SORT_METRIC_BY_ORDER[order];
  const sorted = [...unachieved].sort(
    (a, b) => direction * (metric(a) - metric(b)),
  );
  return [...sorted, ...achieved];
}
