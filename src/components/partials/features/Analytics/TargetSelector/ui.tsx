"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import ArenaClassBadge from "@/components/partials/common/Badge/ArenaClassBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Search, Check } from "lucide-react";
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
} from "@/hooks/analytics/useTargetSelector";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";

// ---------------------------------------------------------------------------
// KindCard — target-type selection button
// ---------------------------------------------------------------------------

interface KindCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  /** paramを持たないkind向け: チェックボックスの選択状態 */
  checked?: boolean;
  /** paramを持つkind向け: 既に選択済みの件数バッジ */
  selectedCount?: number;
  onCheckToggle?: () => void;
  onClick: () => void;
  disabled?: boolean;
}

export const KindCard = ({
  icon: Icon,
  label,
  description,
  checked,
  selectedCount,
  onCheckToggle,
  onClick,
  disabled,
}: KindCardProps) => (
  <div
    className={cn(
      "flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200",
      checked
        ? "border-bpim-primary bg-bpim-surface shadow-[0_0_0_3px] shadow-bpim-primary/20"
        : "border-bpim-border bg-bpim-surface hover:border-bpim-primary/50",
    )}
  >
    {onCheckToggle && (
      <Checkbox
        checked={checked}
        disabled={disabled && !checked}
        onCheckedChange={onCheckToggle}
      />
    )}
    <button onClick={onClick} className="flex flex-1 items-center gap-4 text-left">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
          checked
            ? "border-bpim-primary bg-bpim-primary/10"
            : "border-bpim-border bg-bpim-bg",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            checked ? "text-bpim-primary" : "text-bpim-muted",
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-bpim-text text-sm">{label}</p>
        <p className="text-xs text-bpim-muted mt-0.5">{description}</p>
      </div>
      {!!selectedCount && (
        <span className="shrink-0 rounded-full bg-bpim-primary/15 px-2 py-0.5 text-[10px] font-bold text-bpim-primary">
          {selectedCount}
        </span>
      )}
      {checked && <Check className="h-4 w-4 shrink-0 text-bpim-primary" />}
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// KindStep — full list of target-type cards
// ---------------------------------------------------------------------------

export const KindStep = ({
  kindOptions,
  isSelected,
  countForKind,
  isCapReached,
  onKindClick,
  onKindToggle,
}: {
  kindOptions: KindOption[];
  isSelected: (opt: KindOption) => boolean;
  countForKind: (kind: KindOption["kind"]) => number;
  isCapReached: boolean;
  onKindClick: (opt: KindOption) => void;
  onKindToggle: (opt: KindOption) => void;
}) => (
  <>
    {kindOptions.map((opt) => (
      <KindCard
        key={opt.kind}
        icon={opt.icon}
        label={opt.label}
        description={opt.description}
        checked={opt.hasNoParam ? isSelected(opt) : undefined}
        selectedCount={opt.hasNoParam ? undefined : countForKind(opt.kind)}
        onCheckToggle={opt.hasNoParam ? () => onKindToggle(opt) : undefined}
        onClick={() => onKindClick(opt)}
        disabled={isCapReached}
      />
    ))}
  </>
);

// ---------------------------------------------------------------------------
// RivalPickStep — rival search list
// ---------------------------------------------------------------------------

export const RivalPickStep = ({
  isSelected,
  isCapReached,
  onToggle,
  onSelectOnly,
}: {
  isSelected: (userId: string) => boolean;
  isCapReached: boolean;
  onToggle: (userId: string, name: string) => void;
  onSelectOnly: (userId: string, name: string) => void;
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
            const checked = isSelected(rival.userId);
            return (
              <div
                key={rival.userId}
                className="flex items-center gap-3 rounded-xl border border-bpim-border bg-bpim-surface p-3 transition-all hover:border-bpim-primary/50"
              >
                <Checkbox
                  checked={checked}
                  disabled={isCapReached && !checked}
                  onCheckedChange={() => onToggle(rival.userId, rival.userName)}
                />
                <button
                  onClick={() => onSelectOnly(rival.userId, rival.userName)}
                  className="flex flex-1 items-center gap-3 text-left"
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
                </button>
              </div>
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
  isSelected,
  isCapReached,
  onToggle,
  onSelectOnly,
}: {
  isSelected: (rankId: string) => boolean;
  isCapReached: boolean;
  onToggle: (rankId: string) => void;
  onSelectOnly: (rankId: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    {ARENA_RANKS.map((r) => {
      const checked = isSelected(r.id);
      return (
        <div
          key={r.id}
          className={cn(
            "flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all",
            checked
              ? "border-bpim-primary bg-bpim-surface shadow-[0_0_0_3px] shadow-bpim-primary/20"
              : "border-bpim-border bg-bpim-surface hover:border-bpim-primary/50",
          )}
        >
          <Checkbox
            checked={checked}
            disabled={isCapReached && !checked}
            onCheckedChange={() => onToggle(r.id)}
          />
          <button
            onClick={() => onSelectOnly(r.id)}
            className="flex flex-1 items-center justify-between text-left"
          >
            <span className="font-bold text-sm text-bpim-text">{r.label}</span>
            {checked && <Check className="h-4 w-4 text-bpim-primary" />}
          </button>
        </div>
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// SelfVersionPickStep — past-version picker
// ---------------------------------------------------------------------------

export const SelfVersionPickStep = ({
  isSelected,
  isCapReached,
  onToggle,
  onSelectOnly,
}: {
  isSelected: (versionNum: string) => boolean;
  isCapReached: boolean;
  onToggle: (versionNum: string, label: string) => void;
  onSelectOnly: (versionNum: string, label: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
      {PAST_VERSIONS.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-bpim-muted">
          {t("analytics.noPastVersions")}
        </div>
      ) : (
        PAST_VERSIONS.map((v) => {
          const checked = isSelected(v.num);
          return (
            <div
              key={v.num}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all",
                checked
                  ? "border-bpim-primary bg-bpim-surface shadow-[0_0_0_3px] shadow-bpim-primary/20"
                  : "border-bpim-border bg-bpim-surface hover:border-bpim-primary/50",
              )}
            >
              <Checkbox
                checked={checked}
                disabled={isCapReached && !checked}
                onCheckedChange={() => onToggle(v.num, v.title)}
              />
              <button
                onClick={() => onSelectOnly(v.num, v.title)}
                className="flex flex-1 items-center justify-between text-left"
              >
                <div>
                  <span className="font-bold text-sm text-bpim-text">
                    {v.title}
                  </span>
                  <span className="ml-2 text-[10px] font-mono text-bpim-muted">
                    ver.{v.num}
                  </span>
                </div>
                {checked && (
                  <Check className="h-4 w-4 text-bpim-primary shrink-0" />
                )}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};
