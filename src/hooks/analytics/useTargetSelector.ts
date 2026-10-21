import { useState } from "react";
import {
  Users,
  User,
  BarChart2,
  Trophy,
  History,
  Star,
  UserStar,
  Crown,
} from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { AnalyticsTarget, AnalyticsTargetKind } from "@/types/analytics";
import {
  versionTitles,
  getVersionNameFromNumber,
} from "@/constants/iidx/versionTitles";
import { latestVersion, arenaDataVersion } from "@/constants/iidx/iidxVersions";
import { getTopRankerAreaName } from "@/constants/iidx/topRankerAreas";
import { decodeTopRankerParam, encodeTopRankerParam } from "./topRankerParam";

export type Step =
  | "kind"
  | "rival-pick"
  | "arena-rank"
  | "self-version-pick"
  | "top-ranker-area"
  | "version-pick";

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

/** アリーナ平均の静的集計データが存在するバージョン（26〜`arenaDataVersion`） */
export const ARENA_DATA_VERSIONS = versionTitles
  .map((v) => v.num)
  .filter((num) => num !== "INF" && Number(num) <= Number(arenaDataVersion));

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
    nextStep: "version-pick",
  },
  {
    kind: "rival-top",
    icon: UserStar,
    label: t("analytics.kind.rivalTop"),
    description: t("analytics.kind.rivalTopDesc"),
    nextStep: "version-pick",
  },
  {
    kind: "top-ranker",
    icon: Crown,
    label: t("analytics.kind.topRanker"),
    description: t("analytics.kind.topRankerDesc"),
    nextStep: "top-ranker-area",
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
  // バージョン選択ステップに進む前に確定している比較対象（バージョン未確定）
  const [pending, setPending] = useState<Omit<
    AnalyticsTarget,
    "version"
  > | null>(null);
  const [selectedSelfVersion, setSelectedSelfVersion] = useState<string>(
    current?.kind === "self-version" ? (current.param ?? "") : "",
  );

  const currentTopRanker =
    current?.kind === "top-ranker"
      ? decodeTopRankerParam(current.param)
      : { version: "", areaId: null };
  const [selectedTopRankerArea, setSelectedTopRankerArea] = useState<
    number | null
  >(currentTopRanker.areaId);

  // モーダルを開いた瞬間、またはモーダルが開いている間にcurrentが変わった時だけ
  // 選択状態を確定済みcurrentからrender中に同期的にリセットする
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevCurrent, setPrevCurrent] = useState(current);
  if (isOpen && (!prevIsOpen || current !== prevCurrent)) {
    setPrevIsOpen(true);
    setPrevCurrent(current);
    setStep("kind");
    setSelectedKind(current?.kind ?? null);
    setSelectedArenaRank(
      current?.kind === "arena" ? (current.param ?? "A1") : "A1",
    );
    setSelectedSelfVersion(
      current?.kind === "self-version" ? (current.param ?? "") : "",
    );
    setSelectedTopRankerArea(currentTopRanker.areaId);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  const handleKindClick = (opt: KindOption) => {
    setSelectedKind(opt.kind);
    if (opt.nextStep !== "kind") {
      setStep(opt.nextStep);
      return;
    }
    onSelect({ kind: opt.kind, label: opt.label });
    onClose();
  };

  const goToVersionPick = (target: Omit<AnalyticsTarget, "version">) => {
    setPending(target);
    setStep("version-pick");
  };

  const handleKindClickWithVersion = (opt: KindOption) => {
    if (opt.nextStep !== "version-pick") return handleKindClick(opt);
    setSelectedKind(opt.kind);
    goToVersionPick({ kind: opt.kind, label: opt.label });
  };

  const handleRivalPick = (userId: string, name: string) => {
    goToVersionPick({ kind: "rival", param: userId, label: name });
  };

  const handleVersionPick = (version: string) => {
    if (!pending) return;
    if (pending.kind === "top-ranker") {
      // 県別は version を param に含める既存形式で保存する
      onSelect({
        kind: "top-ranker",
        param: encodeTopRankerParam(version, Number(pending.param)),
        label: `${t("analytics.kind.topRanker")} ${getVersionNameFromNumber(version)} ${pending.label}`,
      });
      onClose();
      return;
    }
    onSelect({
      ...pending,
      version,
      label: `${pending.label} (${getVersionNameFromNumber(version)})`,
    });
    onClose();
  };

  const handleArenaRankPick = (rankId: string) => {
    setSelectedArenaRank(rankId);
    const rankLabel = ARENA_RANKS.find((r) => r.id === rankId)?.label ?? rankId;
    goToVersionPick({
      kind: "arena",
      param: rankId,
      label: `${t("analytics.kind.arena")} ${rankLabel}`,
    });
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

  // エリアを選んだあと、他の種別と同じくバージョン選択へ進む（label はエリア名のみ保持）
  const handleTopRankerAreaPick = (areaId: number) => {
    setSelectedTopRankerArea(areaId);
    goToVersionPick({
      kind: "top-ranker",
      param: String(areaId),
      label: getTopRankerAreaName(areaId),
    });
  };

  const stepTitle: Record<Step, string> = {
    kind: t("analytics.selectTarget"),
    "rival-pick": t("analytics.selectRival"),
    "arena-rank": t("analytics.selectArenaRank"),
    "self-version-pick": t("analytics.selectVersion"),
    "top-ranker-area": t("analytics.selectTopRankerArea"),
    "version-pick": t("analytics.selectTargetVersion"),
  };

  // 「戻る」で遷移する1つ前のステップ（kindは最上位なので無し）
  const backStep: Record<Step, Step | null> = {
    kind: null,
    "rival-pick": "kind",
    "arena-rank": "kind",
    "self-version-pick": "kind",
    "top-ranker-area": "kind",
    "version-pick":
      pending?.kind === "rival"
        ? "rival-pick"
        : pending?.kind === "arena"
          ? "arena-rank"
          : pending?.kind === "top-ranker"
            ? "top-ranker-area"
            : "kind",
  };

  return {
    step,
    setStep,
    selectedKind,
    selectedArenaRank,
    selectedSelfVersion,
    selectedTopRankerArea,
    kindOptions,
    stepTitle,
    backStep,
    pendingKind: pending?.kind ?? null,
    pendingParam: pending?.param,
    handleVersionPick,
    handleKindClick: handleKindClickWithVersion,
    handleRivalPick,
    handleArenaRankPick,
    handleSelfVersionPick,
    handleTopRankerAreaPick,
  };
}
