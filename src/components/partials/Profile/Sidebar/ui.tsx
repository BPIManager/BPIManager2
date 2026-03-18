"use client";

import { SiX } from "react-icons/si";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BpiHistoryTable } from "./bpiTable";
import { FollowSection } from "./followStatus";
import { FollowStats } from "./followCount";
import { formatIIDXId } from "@/utils/common/formatIidxId";

export const ProfileSideBar = ({
  profile,
  onFollowToggle,
  isUpdating = false,
}: any) => {
  return (
    <div className="lg:sticky lg:top-20 flex flex-col gap-6 rounded-2xl border border-bpim-border bg-bpim-bg/60 p-5 backdrop-blur-md shadow-xl">
      <ProfileHeaderBase profile={profile} />

      <FollowStats userId={profile.userId} follows={profile.follows} />

      <div className="my-2">
        <FollowSection
          userId={profile.userId}
          isUpdating={isUpdating}
          relationship={profile.relationship}
          onToggle={onFollowToggle}
        />
      </div>

      {profile.xId && (
        <div className="flex justify-center">
          <a
            href={`https://x.com/${profile.xId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-bpim-muted transition-colors hover:text-bpim-primary"
          >
            <SiX className="h-3.5 w-3.5" />
            <span className="text-xs">@{profile.xId}</span>
          </a>
        </div>
      )}

      <Separator className="bg-white/5" />

      <ProfileStatsContent profile={profile} />
    </div>
  );
};

export const ProfileHeaderBase = ({ profile }: { profile: any }) => (
  <div className="flex flex-col items-center gap-4 text-center">
    <Avatar className="h-28 w-28 border-2 border-bpim-primary shadow-lg shadow-bpim-primary/20">
      <AvatarImage src={profile.profileImage} />
      <AvatarFallback className="text-2xl">
        {profile.userName?.slice(0, 2)}
      </AvatarFallback>
    </Avatar>

    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-bold tracking-tight text-bpim-text">
        {profile.userName}
      </h2>
      <p className="font-mono text-xs tracking-widest text-bpim-muted uppercase">
        ID: {formatIIDXId(profile.iidxId)}
      </p>
    </div>
  </div>
);

export const ProfileStatsContent = ({ profile }: { profile: any }) => {
  const current = profile.current || {};
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-end justify-between px-1">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
            Arena
          </span>
          <Badge className="bg-orange-600 px-3 py-0.5 text-sm font-bold text-bpim-text shadow-md border-none">
            {current.arenaRank || "N/A"}
          </Badge>
        </div>
        <div className="flex flex-col items-end gap-0">
          <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
            Total BPI
          </span>
          <span className="font-mono text-2xl font-black leading-none text-bpim-primary">
            {current.totalBpi?.toFixed(2) ?? "N/A"}
          </span>
        </div>
      </div>

      <BpiHistoryTable history={profile.history} />

      {profile.profileText && (
        <div className="rounded-xl border border-bpim-border bg-white/5 p-3">
          <span className="mb-2 block text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
            Bio
          </span>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-bpim-text">
            {profile.profileText}
          </p>
        </div>
      )}
    </div>
  );
};
