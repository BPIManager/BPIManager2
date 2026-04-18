"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BpiHistoryTable } from "./bpiTable";
import { FollowSection } from "./followStatus";
import { FollowStats } from "./followCount";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import { XIcon } from "../../LogIn";
import { UserProfileData } from "@/types/users/profile";
import { RoleBadge } from "../../UserRole/badge";
import { ChevronDown, ExternalLink } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { latestVersion } from "@/constants/latestVersion";

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

  return (
    <div className="overflow-hidden rounded-2xl border border-bpim-border bg-bpim-bg/60 shadow-xl backdrop-blur-md lg:sticky lg:top-20">
      <div className="h-20 bg-linear-to-br from-bpim-primary/40 via-bpim-surface-2 to-bpim-overlay" />
      <div className="-mt-10 flex items-end justify-between px-4">
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
            {profile.role && <RoleBadge {...profile.role} variant="full" />}
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

        <div className="flex items-center justify-between rounded-xl border border-bpim-border bg-bpim-surface-2/60 px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
              アリーナランク
            </span>
            <Badge className="w-fit border-none bg-orange-800 px-3 py-1 text-md text-white shadow-md">
              {profile.current?.arenaRank || "N/A"}
            </Badge>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
              総合BPI
            </span>
            <span className="font-mono text-lg leading-none text-bpim-primary">
              {profile.current?.totalBpi?.toFixed(2) ?? "N/A"}
            </span>
          </div>
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
            <BpiHistoryTable history={profile.history} />
          </CollapsibleContent>
        </Collapsible>
        {profile.current?.updatedAt && (
          <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
            最終更新:{" "}
            {dayjs(profile.current.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
          </p>
        )}
      </div>
    </div>
  );
};
