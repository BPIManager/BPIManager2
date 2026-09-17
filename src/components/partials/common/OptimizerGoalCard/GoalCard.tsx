import { cn } from "@/lib/utils";
import { DIFF_COLORS } from "@/constants/theme/difficultyColors";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";
import { getRankDetail } from "@/constants/iidx/rankBorders";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";
import { useTranslation } from "@/hooks/common/useTranslation";

/**
 * 目標の詳細表示（ダッシュボードウィジェット・「目標管理」タブ双方の
 * ドロワーから利用）で使うBPI推移・曲別進捗表示。
 */

type Highlight = "achieved" | undefined;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const journeyPct = (from: number, current: number, to: number) => {
  const span = to - from;
  if (span === 0) return current >= to ? 100 : 0;
  return clamp(((current - from) / span) * 100, 0, 100);
};

const scoreRate = (score: number, notes: number) =>
  notes > 0 ? (score / (notes * 2)) * 100 : 0;

const rankDetailText = (exScore: number, notes: number | null) => {
  if (notes == null) return null;
  const detail = getRankDetail(exScore, notes * 2);
  return detail.label === "MAX-"
    ? `MAX - ${detail.shortage}`
    : `${detail.label} + ${detail.surplus}`;
};

const HighlightBadge = ({ highlight }: { highlight: Highlight }) => {
  const { t } = useTranslation();
  if (!highlight) return null;
  return (
    <span className="shrink-0 rounded-full bg-bpim-success px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-white">
      {t("dashboard.optimizerProgress.achieved")}
    </span>
  );
};

/** 現在地を示すマーカー付きの進捗バー。両端に「伸び幅/残り」を補助表示できる。 */
const JourneyTrack = ({
  pct,
  highlight,
  auxLeft,
  auxRight,
}: {
  pct: number;
  highlight: Highlight;
  auxLeft?: string;
  auxRight?: string;
}) => (
  <div className="flex flex-col gap-1">
    <div className="relative h-2.5 w-full rounded-full bg-bpim-muted/20">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          highlight === "achieved" ? "bg-bpim-success" : "bg-bpim-primary",
        )}
        style={{ width: `${Math.max(pct, 4)}%` }}
      />
      <div
        className={cn(
          "absolute top-1/2 h-4 w-4 rounded-full border-2 border-bpim-bg shadow-sm transition-all duration-500",
          highlight === "achieved" ? "bg-bpim-success" : "bg-bpim-primary",
        )}
        style={{
          left: `${Math.max(pct, 4)}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
    {(auxLeft || auxRight) && (
      <div className="flex items-center justify-between text-[11px] font-mono font-bold">
        <span className="text-bpim-success">{auxLeft}</span>
        <span className="text-bpim-muted">{auxRight}</span>
      </div>
    )}
  </div>
);

/** BPIの色付きチップ。「BPI」という文字ラベルを必ず併記し、単なる色数字にしない。 */
const BpiTag = ({ bpi, size = "sm" }: { bpi: number; size?: "sm" | "lg" }) => {
  const { bg, color } = getBpiColorStyle(bpi);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-mono font-black",
        size === "lg" ? "px-2.5 py-1 text-base" : "px-1.5 py-0.5 text-xs",
      )}
      style={{ backgroundColor: bg, color }}
    >
      <span
        className={cn(
          "font-bold opacity-80",
          size === "lg" ? "text-xs" : "text-[10px]",
        )}
      >
        BPI
      </span>
      {bpi.toFixed(2)}
    </span>
  );
};

/** 「作成時/現在/目標」いずれかの1カラム。`emphasize`で現在地を目立たせる。 */
const JourneyColumn = ({
  label,
  children,
  emphasize,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  emphasize?: boolean;
  highlight?: Highlight;
}) => (
  <div
    className={cn(
      "flex flex-1 flex-col items-center gap-1 rounded-lg p-2 text-center",
      emphasize
        ? "border-2 bg-bpim-bg"
        : "border border-bpim-border/60 bg-bpim-bg/60",
      emphasize &&
        (highlight === "achieved"
          ? "border-bpim-success"
          : "border-bpim-primary/60"),
    )}
  >
    <span
      className={cn(
        "text-[11px] font-bold uppercase tracking-wide",
        emphasize ? "text-bpim-text" : "text-bpim-muted",
      )}
    >
      {label}
    </span>
    {children}
  </div>
);

export interface GoalSongStep {
  songId: number;
  title: string;
  difficulty: string;
  toExScore: number;
  fromExScore: number | null;
  currentExScore: number | null;
  fromBpi: number;
  currentBpi: number | null;
  toBpi: number;
  notes: number | null;
}

/**
 * 曲ごとの達成状況を面積比の積み上げバーで示す（目標全体カードの概観用）。
 * 1曲1ドットだと自動生成プラン（最大400曲）で表示が破綻するため、
 * 曲数に関わらずスケールする比率ベースの表現にする。
 */
export const SongStatusBar = ({ steps }: { steps: GoalSongStep[] }) => {
  const total = steps.length;
  if (total === 0) return null;

  const achievedCount = steps.filter(
    (step) =>
      step.currentExScore != null && step.currentExScore >= step.toExScore,
  ).length;
  const remainingCount = total - achievedCount;
  const achievedPct = (achievedCount / total) * 100;
  const remainingPct = (remainingCount / total) * 100;

  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-bpim-muted/15">
      {achievedPct > 0 && (
        <div className="bg-bpim-success" style={{ width: `${achievedPct}%` }} />
      )}
      {remainingPct > 0 && (
        <div
          className="bg-bpim-muted/30"
          style={{ width: `${remainingPct}%` }}
        />
      )}
    </div>
  );
};

/**
 * 総合BPIの推移。目標カードは「概観」であることが一目で分かるよう、
 * 曲別カードには無い達成率(n/m曲)と比率バーを先頭に置く。
 */
export const GoalBpiJourney = ({
  memo,
  liveCurrentTotalBpi,
  steps,
  isExpanded,
}: {
  memo: OptimizeMemo;
  liveCurrentTotalBpi: number | null;
  steps: GoalSongStep[];
  isExpanded?: boolean;
}) => {
  const { t, tFormat } = useTranslation();
  const createdTotalBpi = memo.reportData.currentTotalBpi;
  const targetTotalBpi = memo.reportData.targetTotalBpi ?? memo.targetBpi;
  const hasCreated = typeof createdTotalBpi === "number";
  const currentTotalBpi = liveCurrentTotalBpi ?? createdTotalBpi;
  const achievedCount = steps.filter(
    (s) => s.currentExScore != null && s.currentExScore >= s.toExScore,
  ).length;

  if (
    typeof currentTotalBpi !== "number" ||
    typeof targetTotalBpi !== "number"
  ) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-bpim-border bg-bpim-surface p-4">
        <span className="text-xs font-bold text-bpim-muted">
          {t("optimizer.bpiJourney.target")}
        </span>
        <BpiTag bpi={targetTotalBpi} size="lg" />
      </div>
    );
  }

  const start = hasCreated ? createdTotalBpi : currentTotalBpi;
  const pct = journeyPct(start, currentTotalBpi, targetTotalBpi);
  const isAchieved = currentTotalBpi >= targetTotalBpi;
  const highlight: Highlight = isAchieved ? "achieved" : undefined;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl bg-bpim-surface p-3",
        isExpanded && "border-2 border-bpim-primary/30",
      )}
    >
      {steps.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg bg-bpim-bg p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-bpim-text">
              {tFormat("optimizer.bpiJourney.songsAchieved", {
                achieved: achievedCount,
                total: steps.length,
              })}
            </span>
            <HighlightBadge highlight={highlight} />
          </div>
          <SongStatusBar steps={steps} />
        </div>
      )}

      <div className="flex items-stretch gap-2">
        {hasCreated && (
          <JourneyColumn label={t("optimizer.bpiJourney.created")}>
            <BpiTag bpi={createdTotalBpi} />
          </JourneyColumn>
        )}
        <JourneyColumn
          label={t("optimizer.bpiJourney.currentTotalBpi")}
          emphasize
          highlight={highlight}
        >
          <BpiTag bpi={currentTotalBpi} size="lg" />
        </JourneyColumn>
        <JourneyColumn label={t("optimizer.bpiJourney.target")}>
          <BpiTag bpi={targetTotalBpi} />
        </JourneyColumn>
      </div>

      <JourneyTrack pct={pct} highlight={highlight} />
    </div>
  );
};

const ExValue = ({
  exScore,
  notes,
  emphasize,
}: {
  exScore: number;
  notes: number | null;
  emphasize?: boolean;
}) => {
  const rankText = rankDetailText(exScore, notes);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={cn(
          "font-mono font-black text-bpim-text",
          emphasize ? "text-lg" : "text-sm",
        )}
      >
        {exScore}
      </span>
      {notes != null && (
        <span className="font-mono text-[11px] font-bold text-bpim-muted">
          {scoreRate(exScore, notes).toFixed(2)}%
        </span>
      )}
      {rankText && (
        <span className="font-mono text-[11px] font-bold text-bpim-primary">
          {rankText}
        </span>
      )}
    </div>
  );
};

/** 曲1つ分の進捗を、作成時/現在/目標の3カラムで表示する。 */
export const GoalSongCard = ({
  step,
  contribution,
}: {
  step: GoalSongStep;
  contribution?: number | null;
}) => {
  const { t, tFormat } = useTranslation();
  const current = step.currentExScore;
  const baseline = step.fromExScore ?? 0;
  const pct =
    current == null ? 0 : journeyPct(baseline, current, step.toExScore);
  const isAchieved = current != null && current >= step.toExScore;
  const highlight: Highlight = isAchieved ? "achieved" : undefined;

  const gained =
    current != null && step.fromExScore != null
      ? current - step.fromExScore
      : null;
  const remaining =
    current != null ? Math.max(0, step.toExScore - current) : null;
  const hasImproved = step.fromExScore != null && gained != null && gained > 0;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-bpim-border bg-bpim-surface p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-black text-white",
              DIFF_COLORS[step.difficulty],
            )}
          >
            {step.difficulty.charAt(0)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-bpim-text">
            {step.title}
          </span>
        </div>
        <HighlightBadge highlight={highlight} />
      </div>

      <div className="flex items-stretch gap-1.5">
        <JourneyColumn label={t("optimizer.bpiJourney.created")}>
          {step.fromExScore != null ? (
            <>
              <ExValue exScore={step.fromExScore} notes={step.notes} />
              <BpiTag bpi={step.fromBpi} />
            </>
          ) : (
            <span className="py-2 text-[11px] font-bold text-bpim-subtle">
              {t("optimizer.customGoal.unplayed")}
            </span>
          )}
        </JourneyColumn>
        <JourneyColumn
          label={t("optimizer.bpiJourney.current")}
          emphasize
          highlight={highlight}
        >
          {current != null ? (
            <>
              <ExValue exScore={current} notes={step.notes} emphasize />
              {step.currentBpi != null && (
                <BpiTag bpi={step.currentBpi} size="lg" />
              )}
            </>
          ) : (
            <span className="py-2 text-xs font-bold text-bpim-subtle">
              {t("optimizer.customGoal.unplayed")}
            </span>
          )}
        </JourneyColumn>
        <JourneyColumn label={t("optimizer.bpiJourney.target")}>
          <ExValue exScore={step.toExScore} notes={step.notes} />
          <BpiTag bpi={step.toBpi} />
        </JourneyColumn>
      </div>

      <JourneyTrack
        pct={pct}
        highlight={highlight}
        auxLeft={
          hasImproved
            ? tFormat("optimizer.bpiJourney.gainedPoints", { diff: gained })
            : undefined
        }
        auxRight={
          remaining != null && remaining > 0
            ? tFormat("dashboard.optimizerProgress.remaining", {
                diff: remaining,
              })
            : undefined
        }
      />

      {hasImproved && contribution != null && contribution > 0.001 && (
        <div className="rounded-lg bg-bpim-primary/10 px-2.5 py-1 text-xs font-bold text-bpim-primary">
          {tFormat("optimizer.bpiJourney.contribution", {
            value: contribution.toFixed(2),
          })}
        </div>
      )}
    </div>
  );
};
