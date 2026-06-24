import { useState, useEffect } from "react";
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
import { versionTitles } from "@/constants/iidx/versions";
import { latestVersion } from "@/constants/iidx/latestVersion";

export type Step = "kind" | "rival-pick" | "arena-rank" | "self-version-pick";

export type KindOption = {
  kind: AnalyticsTargetKind;
  icon: React.ElementType;
  label: string;
  description: string;
  nextStep: Step;
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
  },
  {
    kind: "rival-avg",
    icon: Users,
    label: t("analytics.kind.rivalAvg"),
    description: t("analytics.kind.rivalAvgDesc"),
    nextStep: "kind",
  },
  {
    kind: "rival-top",
    icon: UserStar,
    label: t("analytics.kind.rivalTop"),
    description: t("analytics.kind.rivalTopDesc"),
    nextStep: "kind",
  },
  {
    kind: "arena",
    icon: BarChart2,
    label: t("analytics.kind.arena"),
    description: t("analytics.kind.arenaDesc"),
    nextStep: "arena-rank",
  },
  {
    kind: "self-version",
    icon: History,
    label: t("analytics.kind.selfVersion"),
    description: t("analytics.kind.selfVersionDesc"),
    nextStep: "self-version-pick",
  },
  {
    kind: "self-best",
    icon: Star,
    label: t("analytics.kind.selfBest"),
    description: t("analytics.kind.selfBestDesc"),
    nextStep: "kind",
  },
  {
    kind: "self-best-excl",
    icon: Star,
    label: t("analytics.kind.selfBestExcl"),
    description: t("analytics.kind.selfBestExclDesc"),
    nextStep: "kind",
  },
  {
    kind: "aaa",
    icon: Trophy,
    label: t("analytics.kind.aaa"),
    description: t("analytics.kind.aaaDesc"),
    nextStep: "kind",
  },
  {
    kind: "max-",
    icon: Trophy,
    label: t("analytics.kind.max"),
    description: t("analytics.kind.maxDesc"),
    nextStep: "kind",
  },
  {
    kind: "wr",
    icon: Trophy,
    label: t("analytics.kind.wr"),
    description: t("analytics.kind.wrDesc"),
    nextStep: "kind",
  },
];

interface UseTargetSelectorProps {
  isOpen: boolean;
  current: AnalyticsTarget | null;
  onSelect: (target: AnalyticsTarget) => void;
  onClose: () => void;
}

export function useTargetSelector({
  isOpen,
  current,
  onSelect,
  onClose,
}: UseTargetSelectorProps) {
  const { t } = useTranslation();
  const kindOptions = buildKindOptions(t);

  const [step, setStep] = useState<Step>("kind");
  const [selectedKind, setSelectedKind] = useState<AnalyticsTargetKind | null>(
    current?.kind ?? null,
  );
  const [selectedArenaRank, setSelectedArenaRank] = useState<string>(
    current?.kind === "arena" ? (current.param ?? "A1") : "A1",
  );
  const [selectedSelfVersion, setSelectedSelfVersion] = useState<string>(
    current?.kind === "self-version" ? (current.param ?? "") : "",
  );

  useEffect(() => {
    if (isOpen) {
      setStep("kind");
      setSelectedKind(current?.kind ?? null);
      setSelectedArenaRank(
        current?.kind === "arena" ? (current.param ?? "A1") : "A1",
      );
      setSelectedSelfVersion(
        current?.kind === "self-version" ? (current.param ?? "") : "",
      );
    }
  }, [isOpen, current]);

  const handleKindClick = (opt: KindOption) => {
    setSelectedKind(opt.kind);
    if (opt.nextStep !== "kind") {
      setStep(opt.nextStep);
      return;
    }
    onSelect({ kind: opt.kind, label: opt.label });
    onClose();
  };

  const handleRivalPick = (userId: string, name: string) => {
    onSelect({ kind: "rival", param: userId, label: name });
    onClose();
  };

  const handleArenaConfirm = () => {
    const rankLabel =
      ARENA_RANKS.find((r) => r.id === selectedArenaRank)?.label ??
      selectedArenaRank;
    onSelect({
      kind: "arena",
      param: selectedArenaRank,
      label: `${t("analytics.kind.arena")} ${rankLabel}`,
    });
    onClose();
  };

  const handleSelfVersionPick = (versionNum: string, versionTitle: string) => {
    setSelectedSelfVersion(versionNum);
    onSelect({
      kind: "self-version",
      param: versionNum,
      label: `${versionTitle} (${t("page.rival.me")})`,
    });
    onClose();
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
    selectedKind,
    selectedArenaRank,
    setSelectedArenaRank,
    selectedSelfVersion,
    kindOptions,
    stepTitle,
    handleKindClick,
    handleRivalPick,
    handleArenaConfirm,
    handleSelfVersionPick,
  };
}
