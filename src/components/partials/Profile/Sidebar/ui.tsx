"use client";

import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BpiHistoryTable } from "./bpiTable";
import { ArenaClassBadge } from "./ArenaClassBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FollowSection } from "./followStatus";
import { FollowStats } from "./followCount";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import { XIcon } from "../../LogIn";
import { UserProfileData } from "@/types/users/profile";
import { RoleBadge } from "../../UserRole/badge";
import {
  ChevronDown,
  ExternalLink,
  Coffee,
  Fish,
  Code2,
  Trophy,
  Sparkle,
  MapPin,
} from "lucide-react";
import dayjs from "@/lib/dayjs";
import { latestVersion } from "@/constants/latestVersion";
import { ARENA_RANK_ORDER } from "@/constants/arenaRanks";

type RoleKey = "coffee" | "saba" | "iidx" | "developer" | "pro";

const ROLE_HEADER: Record<RoleKey, { from: string; Icon: typeof Coffee }> = {
  coffee: { from: "#f59e0b40", Icon: Coffee },
  saba: { from: "#22d3ee40", Icon: Fish },
  iidx: { from: "#a78bfa40", Icon: Sparkle },
  developer: { from: "#34d39940", Icon: Code2 },
  pro: { from: "#facc1540", Icon: Trophy },
};

export const ProfileSideBar = ({
  profile,
  onFollowToggle,
  isUpdating = false,
}: {
  profile: UserProfileData;
  onFollowToggle?: () => void;
  isUpdating?: boolean;
}) => {
  const [historyOpen, setHistoryOpen] = useState(false);

  const roleKey = profile.role?.role as RoleKey | undefined;
  const roleHeader = roleKey ? ROLE_HEADER[roleKey] : undefined;
  const RoleIcon = roleHeader?.Icon;

  const current = profile.stats[0] ?? null;
  const hasDetails = current != null;

  const allTimeBest = useMemo(() => {
    const order = ARENA_RANK_ORDER as readonly string[];
    return profile.stats.reduce<{
      arenaClass: string;
      version: string;
      at: Date | string | null;
    } | null>((best, stat) => {
      if (!stat.bestArenaClass) return best;
      if (!best)
        return {
          arenaClass: stat.bestArenaClass,
          version: stat.version,
          at: stat.bestArenaClassAt ?? null,
        };
      return order.indexOf(stat.bestArenaClass) < order.indexOf(best.arenaClass)
        ? {
            arenaClass: stat.bestArenaClass,
            version: stat.version,
            at: stat.bestArenaClassAt ?? null,
          }
        : best;
    }, null);
  }, [profile.stats]);

  return (
    <div className="overflow-hidden rounded-2xl border border-bpim-border bg-bpim-bg/60 shadow-xl backdrop-blur-md lg:sticky lg:top-20">
      <div
        className="relative h-20 overflow-hidden"
        style={
          roleHeader
            ? {
                background: `linear-gradient(to bottom right, ${roleHeader.from}, var(--color-bpim-surface-2), var(--color-bpim-overlay))`,
              }
            : undefined
        }
      >
        {!roleHeader && (
          <div className="absolute inset-0 bg-linear-to-br from-bpim-primary/40 via-bpim-surface-2 to-bpim-overlay" />
        )}
        {RoleIcon && (
          <RoleIcon className="absolute -right-4 -bottom-4 h-28 w-28 rotate-[-15deg] opacity-[0.08]" />
        )}
      </div>
      <div className="relative z-10 -mt-10 flex items-end justify-between px-4">
        <Avatar className="h-20 w-20 shrink-0 border-4 border-bpim-bg shadow-lg">
          <AvatarImage src={profile.profileImage ?? undefined} />
          <AvatarFallback className="text-2xl">
            {profile.userName?.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="pb-1">
          <FollowSection
            userId={profile.userId}
            isUpdating={isUpdating}
            relationship={profile.relationship}
            onToggle={onFollowToggle}
            className="h-8 w-auto min-w-25 px-4 text-[13px] font-bold"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-5 pt-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold leading-tight text-bpim-text">
              {profile.userName}
            </h2>
            {profile.role && (
              <RoleBadge {...profile.role} variant="full" size="small" />
            )}
          </div>
          <div className="flex flex-row gap-4 text-[12px] lg:text-[10px]  text-bpim-muted">
            {profile.iidxId && (
              <form
                method="post"
                action={`https://p.eagate.573.jp/game/2dx/${latestVersion}/rival/rival_search.html#rivalsearch`}
                target="_blank"
                rel="noopener noreferrer"
                className="contents"
              >
                <input
                  type="hidden"
                  name="iidxid"
                  value={profile.iidxId.replace(/\D/g, "")}
                />
                <input type="hidden" name="mode" value="1" />
                <button
                  type="submit"
                  className="flex items-center gap-1 cursor-pointer text-bpim-primary hover:underline"
                >
                  IIDX: {formatIIDXId(profile.iidxId)}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </form>
            )}
            {profile.xId && (
              <a
                href={`https://x.com/${profile.xId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-bpim-primary hover:underline"
              >
                <XIcon className="h-3 w-3 fill-current" />
                <span>@{profile.xId}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {profile.profileText && (
          <p className="whitespace-pre-wrap text-[13px] leading-normal text-bpim-text">
            {profile.profileText}
          </p>
        )}

        <FollowStats userId={profile.userId} follows={profile.follows} />

        <Separator className="bg-bpim-surface-2/60" />

        <div className="flex flex-col gap-0 rounded-xl border border-bpim-border bg-bpim-surface-2/60 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
                現在のアリーナクラス
              </span>
              <ArenaClassBadge arenaClass={current?.arenaClass} contained />
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
                総合BPI
              </span>
              <span className="font-mono text-2xl font-black leading-none text-bpim-primary">
                {current?.totalBpi?.toFixed(2) ?? "N/A"}
              </span>
            </div>
          </div>

          {hasDetails && (
            <div className="grid grid-cols-3 items-stretch divide-x divide-bpim-border border-t border-bpim-border">
              {allTimeBest ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex h-full flex-col items-center justify-center gap-1 px-2 py-2.5 cursor-default">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-bpim-muted">
                          最高クラス
                        </span>
                        <ArenaClassBadge
                          arenaClass={allTimeBest.arenaClass}
                          size="sm"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <span className="font-mono text-center">
                        IIDX {allTimeBest.version}
                        {allTimeBest.at
                          ? ` · ${dayjs(allTimeBest.at).format("YYYY-MM-DD")}`
                          : ""}
                        <br />
                        <small>
                          ※その日中に過去最高ランクから降格した場合、データが記録されません
                        </small>
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <div />
              )}
              <div className="flex h-full flex-col items-center justify-center gap-1 px-2 py-2.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-bpim-muted">
                  エリア
                </span>
                <span className="text-xs leading-none text-bpim-text">
                  {current?.area ?? "-"}
                </span>
                {profile.areaRank && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="mt-1 inline-flex cursor-default items-center gap-0.5 rounded-full bg-bpim-primary/15 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-bpim-primary">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          {profile.areaRank.areaRank}位/
                          {profile.areaRank.totalInArea}人
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <span className="text-center text-xs leading-relaxed">
                          {current?.area}のプレイヤー
                          {profile.areaRank.totalInArea}
                          人中
                          <br />
                          {profile.areaRank.areaRank}位（B帯以下は集計対象外）
                          <br />
                          ※IIDX公式準拠の順位です
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex h-full flex-col items-center justify-center gap-1 px-2 py-2.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-bpim-muted">
                  段位 SP/DP
                </span>
                <span className="text-xs text-bpim-text">
                  {current?.gradeSp ? `${current.gradeSp}` : "-"}
                  &nbsp;/&nbsp;
                  {current?.gradeDp && current.gradeDp !== "---"
                    ? `${current.gradeDp}`
                    : "-"}
                </span>
              </div>
            </div>
          )}
        </div>

        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-bpim-muted transition-colors hover:bg-bpim-overlay">
            <span>バージョン別履歴</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                historyOpen ? "rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <BpiHistoryTable stats={profile.stats} />
          </CollapsibleContent>
        </Collapsible>
        {profile.stats[0]?.updatedAt && (
          <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
            最終更新:{" "}
            {dayjs(profile.stats[0].updatedAt).format("YYYY-MM-DD HH:mm:ss")}
          </p>
        )}
      </div>
    </div>
  );
};
