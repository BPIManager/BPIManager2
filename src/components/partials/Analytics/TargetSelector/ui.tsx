"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Users,
  User,
  BarChart2,
  Trophy,
  Search,
  ChevronRight,
  Check,
  AlertCircle,
  History,
  Star,
  UserStar,
} from "lucide-react";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalSummary } from "@/hooks/social/useRivalSummary";
import { latestVersion } from "@/constants/latestVersion";
import type {
  AnalyticsTarget,
  AnalyticsTargetKind,
} from "@/types/analytics";
import { getBpiColorStyle } from "@/constants/bpiColor";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import { versionTitles } from "@/constants/versions";

const ARENA_RANKS = [
  { id: "A1", label: "A1" },
  { id: "A2", label: "A2" },
  { id: "A3", label: "A3" },
  { id: "A4", label: "A4" },
  { id: "A5", label: "A5" },
];

interface KindCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

const KindCard = ({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: KindCardProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
      selected
        ? "border-bpim-primary bg-bpim-surface shadow-[0_0_0_3px] shadow-bpim-primary/20"
        : "border-bpim-border bg-bpim-surface hover:border-bpim-primary/50",
    )}
  >
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
        selected
          ? "border-bpim-primary bg-bpim-primary/10"
          : "border-bpim-border bg-bpim-bg",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5",
          selected ? "text-bpim-primary" : "text-bpim-muted",
        )}
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-bpim-text text-sm">{label}</p>
      <p className="text-xs text-bpim-muted mt-0.5">{description}</p>
    </div>
    {selected && <Check className="h-4 w-4 shrink-0 text-bpim-primary" />}
  </button>
);

const RivalPickStep = ({
  onSelect,
}: {
  onSelect: (userId: string, name: string) => void;
}) => {
  const { user } = useUser();
  const [search, setSearch] = useState("");

  const { rivals, isLoading } = useRivalSummary({
    userId: user?.userId || false,
    levels: ["11", "12"],
    difficulties: ["HYPER", "ANOTHER", "LEGGENDARIA"],
    version: latestVersion,
  });

  const filtered = rivals.filter((r) =>
    r.userName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bpim-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ライバル名で検索..."
          className="pl-9 bg-bpim-bg border-bpim-border text-bpim-text placeholder:text-bpim-muted focus-visible:ring-bpim-primary"
        />
      </div>

      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-16 w-full rounded-xl bg-bpim-surface"
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-bpim-muted">
            ライバルが見つかりません
          </div>
        ) : (
          filtered.map((rival) => {
            const bpiStyle = getBpiColorStyle(rival.totalBpi ?? -15);
            return (
              <button
                key={rival.userId}
                onClick={() => onSelect(rival.userId, rival.userName)}
                className="flex items-center gap-3 rounded-xl border border-bpim-border bg-bpim-surface p-3 text-left transition-all hover:bg-bpim-overlay/50 hover:border-bpim-primary/50"
              >
                <div
                  className="h-10 w-1 rounded-full shrink-0"
                  style={{ backgroundColor: bpiStyle.bg }}
                />
                <Avatar className="h-8 w-8 border border-bpim-border shrink-0">
                  <AvatarImage src={rival.profileImage ?? ""} />
                  <AvatarFallback>{rival.userName.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-bpim-text truncate">
                    {rival.userName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="bg-orange-600 h-4 px-1.5 text-[10px] font-bold border-none">
                      {rival.arenaRank || "N/A"}
                    </Badge>
                    <span className="font-mono text-[10px] text-bpim-muted">
                      {formatIIDXId(rival.iidxId || "")}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-[9px] font-bold tracking-widest text-bpim-muted uppercase">
                    BPI
                  </span>
                  <span className="font-mono text-sm font-bold text-bpim-text">
                    {rival.totalBpi?.toFixed(1) ?? "-15.0"}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-bpim-muted shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

const ArenaRankStep = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (rank: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    {ARENA_RANKS.map((r) => (
      <button
        key={r.id}
        onClick={() => onSelect(r.id)}
        className={cn(
          "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all hover:scale-[1.01]",
          selected === r.id
            ? "border-bpim-primary bg-bpim-surface shadow-[0_0_0_3px] shadow-bpim-primary/20"
            : "border-bpim-border bg-bpim-surface hover:border-bpim-primary/50",
        )}
      >
        <span className="font-bold text-sm text-bpim-text">{r.label}</span>
        {selected === r.id && <Check className="h-4 w-4 text-bpim-primary" />}
      </button>
    ))}
  </div>
);

const PAST_VERSIONS = versionTitles
  .filter((v) => v.num !== latestVersion)
  .reverse();

const SelfVersionPickStep = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (version: string, label: string) => void;
}) => (
  <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
    {PAST_VERSIONS.length === 0 ? (
      <div className="flex h-24 items-center justify-center text-sm text-bpim-muted">
        比較できる過去バージョンがありません
      </div>
    ) : (
      PAST_VERSIONS.map((v) => (
        <button
          key={v.num}
          onClick={() => onSelect(v.num, v.title)}
          className={cn(
            "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all hover:scale-[1.01]",
            selected === v.num
              ? "border-bpim-primary bg-bpim-surface shadow-[0_0_0_3px] shadow-bpim-primary/20"
              : "border-bpim-border bg-bpim-surface hover:border-bpim-primary/50",
          )}
        >
          <div>
            <span className="font-bold text-sm text-bpim-text">{v.title}</span>
            <span className="ml-2 text-[10px] font-mono text-bpim-muted">
              ver.{v.num}
            </span>
          </div>
          {selected === v.num && (
            <Check className="h-4 w-4 text-bpim-primary shrink-0" />
          )}
        </button>
      ))
    )}
  </div>
);

interface TargetSelectorModalProps {
  isOpen: boolean;
  current: AnalyticsTarget | null;
  onSelect: (target: AnalyticsTarget) => void;
  onClose: () => void;
}

type Step = "kind" | "rival-pick" | "arena-rank" | "self-version-pick";

const KIND_OPTIONS: {
  kind: AnalyticsTargetKind;
  icon: React.ElementType;
  label: string;
  description: string;
  nextStep: Step;
}[] = [
  {
    kind: "rival",
    icon: User,
    label: "個別ライバル",
    description: "フォロー中のライバル1人と比較します",
    nextStep: "rival-pick",
  },
  {
    kind: "rival-avg",
    icon: Users,
    label: "ライバル平均",
    description: "フォロー中のライバル全員の平均スコアと比較します",
    nextStep: "kind",
  },
  {
    kind: "rival-top",
    icon: UserStar,
    label: "ライバルTOP",
    description: "フォロー中のライバルので最も高いスコアと比較します",
    nextStep: "kind",
  },
  {
    kind: "arena",
    icon: BarChart2,
    label: "アリーナ平均",
    description: "指定したアリーナランク帯の平均スコアと比較します",
    nextStep: "arena-rank",
  },
  {
    kind: "self-version",
    icon: History,
    label: "過去バージョン（自分）",
    description: "自分の特定バージョンのスコアと比較します",
    nextStep: "self-version-pick",
  },
  {
    kind: "self-best",
    icon: Star,
    label: "自己歴代",
    description: "今作を含む全バージョン中の自己最高スコアと比較します",
    nextStep: "kind",
  },
  {
    kind: "self-best-excl",
    icon: Star,
    label: "自己歴代（今作除く）",
    description: "今作を除く全バージョン中の自己最高スコアと比較します",
    nextStep: "kind",
  },
  {
    kind: "aaa",
    icon: Trophy,
    label: "AAA達成スコア",
    description: "各楽曲のAAA達成に必要なスコアと比較します",
    nextStep: "kind",
  },
  {
    kind: "max-",
    icon: Trophy,
    label: "MAX-達成スコア",
    description: "各楽曲のMAX-達成に必要なスコアと比較します",
    nextStep: "kind",
  },
  {
    kind: "wr",
    icon: Trophy,
    label: "WR達成スコア",
    description:
      "各楽曲のWR達成に必要なスコアと比較します(BPIM定義におけるWRであり、最新のデータを反映していない可能性があります)",
    nextStep: "kind",
  },
];

export const TargetSelectorModal = ({
  isOpen,
  current,
  onSelect,
  onClose,
}: TargetSelectorModalProps) => {
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

  const handleKindClick = (opt: (typeof KIND_OPTIONS)[number]) => {
    setSelectedKind(opt.kind);

    if (opt.nextStep !== "kind") {
      setStep(opt.nextStep);
      return;
    }

    const labelMap: Record<string, string> = {
      "rival-avg": "ライバル平均",
      aaa: "AAA達成スコア",
      "max-": "MAX-達成スコア",
      wr: "WR達成スコア",
      "self-best": "自己歴代",
      "self-best-excl": "自己歴代（今作除く）",
    };
    onSelect({ kind: opt.kind, label: labelMap[opt.kind] ?? opt.label });
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
      label: `アリーナ平均 ${rankLabel}`,
    });
    onClose();
  };

  const handleSelfVersionPick = (versionNum: string, versionTitle: string) => {
    setSelectedSelfVersion(versionNum);
    onSelect({
      kind: "self-version",
      param: versionNum,
      label: `${versionTitle}（自分）`,
    });
    onClose();
  };

  const stepTitle: Record<Step, string> = {
    kind: "比較対象を選択",
    "rival-pick": "ライバルを選択",
    "arena-rank": "アリーナランクを選択",
    "self-version-pick": "比較するバージョンを選択",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        placement="bottom-sheet"
        disableScrollWrapper
        className="flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="border-b p-4 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2 text-bpim-text">
            {stepTitle[step]}
          </DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-col overflow-y-auto p-2 custom-scrollbar">
          <div className="mt-2 flex flex-col gap-3">
            {step === "kind" && (
              <>
                {KIND_OPTIONS.map((opt) => (
                  <KindCard
                    key={opt.kind}
                    icon={opt.icon}
                    label={opt.label}
                    description={opt.description}
                    selected={selectedKind === opt.kind}
                    onClick={() => handleKindClick(opt)}
                  />
                ))}
              </>
            )}

            {step === "rival-pick" && (
              <>
                <button
                  onClick={() => setStep("kind")}
                  className="self-start text-xs text-bpim-muted hover:text-bpim-text flex items-center gap-1"
                >
                  戻る
                </button>
                <RivalPickStep onSelect={handleRivalPick} />
              </>
            )}

            {step === "arena-rank" && (
              <>
                <button
                  onClick={() => setStep("kind")}
                  className="self-start text-xs text-bpim-muted hover:text-bpim-text flex items-center gap-1"
                >
                  戻る
                </button>
                <ArenaRankStep
                  selected={selectedArenaRank}
                  onSelect={setSelectedArenaRank}
                />
                <div className="flex gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-yellow-500/80" />
                  <p className="text-[11px] leading-relaxed text-bpim-muted">
                    <strong className="block mb-0.5 text-yellow-500/90 font-bold">
                      注意
                    </strong>
                    BPIMに登録・アリーナランクを申告したユーザー内における平均値のため、実際のアリーナ平均とは乖離があります。
                  </p>
                </div>
                <Button
                  onClick={handleArenaConfirm}
                  className="mt-2 w-full bg-bpim-primary font-bold text-white hover:bg-bpim-primary/80"
                >
                  この設定で比較する
                </Button>
              </>
            )}

            {step === "self-version-pick" && (
              <>
                <button
                  onClick={() => setStep("kind")}
                  className="self-start text-xs text-bpim-muted hover:text-bpim-text flex items-center gap-1"
                >
                  戻る
                </button>
                <p className="text-xs text-bpim-muted">
                  今作のスコアと比較したい過去バージョンを選択してください。
                  スコアが存在しない楽曲は比較対象外になります。
                </p>
                <SelfVersionPickStep
                  selected={selectedSelfVersion}
                  onSelect={handleSelfVersionPick}
                />
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
