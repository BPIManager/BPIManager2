import { useState } from "react";
import {
  Users,
  User,
  BarChart2,
  Trophy,
  History,
  Star,
  UserStar,
} from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { AnalyticsTarget, AnalyticsTargetKind } from "@/types/analytics";
import { versionTitles } from "@/constants/iidx/versionTitles";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { MAX_COMPARISON_TARGETS } from "@/constants/logic/analyticsComparison";
import { targetKey } from "@/hooks/analytics/resolveMultiTargets";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalSummary } from "@/hooks/social/useRivalSummary";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";

export type Step = "kind" | "rival-pick" | "arena-rank" | "self-version-pick";

export type KindOption = {
  kind: AnalyticsTargetKind;
  icon: React.ElementType;
  label: string;
  description: string;
  nextStep: Step;
  /** trueの場合、paramを持たずkindカード自体がチェックボックス対象になる */
  hasNoParam: boolean;
};

export const ARENA_RANKS = [
  { id: "A1", label: "A1" },
  { id: "A2", label: "A2" },
  { id: "A3", label: "A3" },
  { id: "A4", label: "A4" },
  { id: "A5", label: "A5" },
];

export const PAST_VERSIONS = versionTitles
  .filter((v) => v.num !== latestVersion)
  .reverse();

export const buildKindOptions = (
  t: (key: TranslationKey) => string,
): KindOption[] => [
  {
    kind: "rival",
    icon: User,
    label: t("analytics.kind.rival"),
    description: t("analytics.kind.rivalDesc"),
    nextStep: "rival-pick",
    hasNoParam: false,
  },
  {
    kind: "rival-avg",
    icon: Users,
    label: t("analytics.kind.rivalAvg"),
    description: t("analytics.kind.rivalAvgDesc"),
    nextStep: "kind",
    hasNoParam: true,
  },
  {
    kind: "rival-top",
    icon: UserStar,
    label: t("analytics.kind.rivalTop"),
    description: t("analytics.kind.rivalTopDesc"),
    nextStep: "kind",
    hasNoParam: true,
  },
  {
    kind: "arena",
    icon: BarChart2,
    label: t("analytics.kind.arena"),
    description: t("analytics.kind.arenaDesc"),
    nextStep: "arena-rank",
    hasNoParam: false,
  },
  {
    kind: "self-version",
    icon: History,
    label: t("analytics.kind.selfVersion"),
    description: t("analytics.kind.selfVersionDesc"),
    nextStep: "self-version-pick",
    hasNoParam: false,
  },
  {
    kind: "self-best",
    icon: Star,
    label: t("analytics.kind.selfBest"),
    description: t("analytics.kind.selfBestDesc"),
    nextStep: "kind",
    hasNoParam: true,
  },
  {
    kind: "self-best-excl",
    icon: Star,
    label: t("analytics.kind.selfBestExcl"),
    description: t("analytics.kind.selfBestExclDesc"),
    nextStep: "kind",
    hasNoParam: true,
  },
  {
    kind: "aaa",
    icon: Trophy,
    label: t("analytics.kind.aaa"),
    description: t("analytics.kind.aaaDesc"),
    nextStep: "kind",
    hasNoParam: true,
  },
  {
    kind: "max-",
    icon: Trophy,
    label: t("analytics.kind.max"),
    description: t("analytics.kind.maxDesc"),
    nextStep: "kind",
    hasNoParam: true,
  },
  {
    kind: "wr",
    icon: Trophy,
    label: t("analytics.kind.wr"),
    description: t("analytics.kind.wrDesc"),
    nextStep: "kind",
    hasNoParam: true,
  },
];

interface UseTargetSelectorProps {
  isOpen: boolean;
  /** 現在選択中のターゲット一覧（複数選択、#287） */
  current: AnalyticsTarget[];
  /** 選択内容が変わるたびに新しい配列全体を渡す */
  onChange: (targets: AnalyticsTarget[]) => void;
  onClose: () => void;
}

/**
 * `/analytics`のターゲット選択モーダルの状態管理フック(#287で単一選択から
 * 複数選択に拡張)。
 *
 * 各ステップの行は共通で「チェックマークで複数選択への追加/除外」
 * 「行全体クリックでその1件だけを選んで即座に確定・モーダルを閉じる」の
 * 2種類の操作を持つ。paramを持たないkind(rival-avg/rival-top/self-best/
 * self-best-excl/aaa/max-/wr)はkindカード自体がその行になり、paramが
 * 必要なkind(rival/arena/self-version)はサブステップ側の各行がそれに
 * あたる。
 */
export function useTargetSelector({
  isOpen,
  current,
  onChange,
  onClose,
}: UseTargetSelectorProps) {
  const { t } = useTranslation();
  const kindOptions = buildKindOptions(t);
  const { user } = useUser();

  // 「個別ライバル」カードの一括選択チェックボックス用(フォロー中全員を
  // 個別ターゲットとして追加する)。RivalPickStepも同じデータを使うが、
  // SWRの同一キャッシュを共有するため二重取得のコストは実質無い
  const { rivals } = useRivalSummary({
    userId: user?.userId || false,
    levels: ["11", "12"],
    difficulties: IIDX_DIFFICULTIES,
    version: latestVersion,
  });

  const [step, setStep] = useState<Step>("kind");

  // モーダルを開いた瞬間だけステップをリセットする
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setStep("kind");
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  const remaining = MAX_COMPARISON_TARGETS - 1 - current.length;
  const isCapReached = remaining <= 0;

  const isSelected = (target: AnalyticsTarget) =>
    current.some((c) => targetKey(c) === targetKey(target));

  const countForKind = (kind: AnalyticsTargetKind) =>
    current.filter((c) => c.kind === kind).length;

  /** チェックマーク操作: 選択中なら除外、未選択なら追加(上限到達時は何もしない) */
  const toggleTarget = (target: AnalyticsTarget) => {
    if (isSelected(target)) {
      onChange(current.filter((c) => targetKey(c) !== targetKey(target)));
      return;
    }
    if (isCapReached) return;
    onChange([...current, target]);
  };

  /** 行全体クリック操作: この1件だけを選んで確定し、モーダルを閉じる */
  const selectOnly = (target: AnalyticsTarget) => {
    onChange([target]);
    onClose();
  };

  const handleKindClick = (opt: KindOption) => {
    if (opt.hasNoParam) {
      selectOnly({ kind: opt.kind, label: opt.label });
      return;
    }
    setStep(opt.nextStep);
  };

  const handleKindToggle = (opt: KindOption) => {
    toggleTarget({ kind: opt.kind, label: opt.label });
  };

  const handleRivalToggle = (userId: string, name: string) => {
    toggleTarget({ kind: "rival", param: userId, label: name });
  };

  const handleRivalSelectOnly = (userId: string, name: string) => {
    selectOnly({ kind: "rival", param: userId, label: name });
  };

  /** フォロー中の全ライバルが、個別ターゲットとして選択済みか */
  const isAllRivalsSelected =
    rivals.length > 0 &&
    rivals.every((r) =>
      isSelected({ kind: "rival", param: r.userId, label: r.userName }),
    );

  /**
   * 「個別ライバル」カードのチェックボックス操作: フォロー中の全ライバルを
   * まとめて個別ターゲットとして追加/除外する（ライバル平均ではなく、
   * 1人ずつ別ターゲットとして扱う）。上限に達している分は追加しない。
   */
  const handleToggleAllRivals = () => {
    if (isAllRivalsSelected) {
      onChange(current.filter((c) => c.kind !== "rival"));
      return;
    }
    const toAdd = rivals
      .map((r): AnalyticsTarget => ({
        kind: "rival",
        param: r.userId,
        label: r.userName,
      }))
      .filter((t) => !isSelected(t));
    onChange([...current, ...toAdd.slice(0, Math.max(0, remaining))]);
  };

  const arenaTargetFor = (rankId: string): AnalyticsTarget => {
    const rankLabel = ARENA_RANKS.find((r) => r.id === rankId)?.label ?? rankId;
    return {
      kind: "arena",
      param: rankId,
      label: `${t("analytics.kind.arena")} ${rankLabel}`,
    };
  };

  const handleArenaToggle = (rankId: string) => {
    toggleTarget(arenaTargetFor(rankId));
  };

  const handleArenaSelectOnly = (rankId: string) => {
    selectOnly(arenaTargetFor(rankId));
  };

  const selfVersionTargetFor = (
    versionNum: string,
    versionTitle: string,
  ): AnalyticsTarget => ({
    kind: "self-version",
    param: versionNum,
    label: `${versionTitle} (${t("page.rival.me")})`,
  });

  const handleSelfVersionToggle = (versionNum: string, versionTitle: string) => {
    toggleTarget(selfVersionTargetFor(versionNum, versionTitle));
  };

  const handleSelfVersionSelectOnly = (
    versionNum: string,
    versionTitle: string,
  ) => {
    selectOnly(selfVersionTargetFor(versionNum, versionTitle));
  };

  const stepTitle: Record<Step, string> = {
    kind: t("analytics.selectTarget"),
    "rival-pick": t("analytics.selectRival"),
    "arena-rank": t("analytics.selectArenaRank"),
    "self-version-pick": t("analytics.selectVersion"),
  };

  return {
    step,
    setStep,
    kindOptions,
    stepTitle,
    current,
    isSelected,
    countForKind,
    isCapReached,
    remaining,
    handleKindClick,
    handleKindToggle,
    isAllRivalsSelected,
    handleToggleAllRivals,
    handleRivalToggle,
    handleRivalSelectOnly,
    handleArenaToggle,
    handleArenaSelectOnly,
    handleSelfVersionToggle,
    handleSelfVersionSelectOnly,
  };
}
