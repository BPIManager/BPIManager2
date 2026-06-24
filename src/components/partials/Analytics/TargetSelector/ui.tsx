"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArenaClassBadge } from "@/components/partials/ArenaClassBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Search, ChevronRight, Check } from "lucide-react";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalSummary } from "@/hooks/social/useRivalSummary";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import { useTranslation } from "@/hooks/common/useTranslation";
import {
  ARENA_RANKS,
  PAST_VERSIONS,
  type KindOption,
} from "../../../../hooks/analytics/useTargetSelector";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";

// ---------------------------------------------------------------------------
// KindCard — target-type selection button
// ---------------------------------------------------------------------------

interface KindCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export const KindCard = ({
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

// ---------------------------------------------------------------------------
// KindStep — full list of target-type cards
// ---------------------------------------------------------------------------

export const KindStep = ({
  kindOptions,
  selectedKind,
  onKindClick,
}: {
  kindOptions: KindOption[];
  selectedKind: string | null;
  onKindClick: (opt: KindOption) => void;
}) => (
  <>
    {kindOptions.map((opt) => (
      <KindCard
        key={opt.kind}
        icon={opt.icon}
        label={opt.label}
        description={opt.description}
        selected={selectedKind === opt.kind}
        onClick={() => onKindClick(opt)}
      />
    ))}
  </>
);

// ---------------------------------------------------------------------------
// RivalPickStep — rival search list
// ---------------------------------------------------------------------------

export const RivalPickStep = ({
  onSelect,
}: {
  onSelect: (userId: string, name: string) => void;
}) => {
  const { user } = useUser();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const { rivals, isLoading } = useRivalSummary({
    userId: user?.userId || false,
    levels: ["11", "12"],
    difficulties: IIDX_DIFFICULTIES,
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
          placeholder={t("analytics.searchRivals")}
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
            {t("analytics.noRivalsFound")}
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
                    <ArenaClassBadge arenaClass={rival.arenaClass} size="sm" />
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

// ---------------------------------------------------------------------------
// ArenaRankStep — arena rank picker
// ---------------------------------------------------------------------------

export const ArenaRankStep = ({
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

// ---------------------------------------------------------------------------
// SelfVersionPickStep — past-version picker
// ---------------------------------------------------------------------------

export const SelfVersionPickStep = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (version: string, label: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
      {PAST_VERSIONS.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-bpim-muted">
          {t("analytics.noPastVersions")}
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
              <span className="font-bold text-sm text-bpim-text">
                {v.title}
              </span>
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
};
