import { LucideIcon, Swords } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import { FollowSection } from "../../Profile/Sidebar/followStatus";
import { cn } from "@/lib/utils";
import { UserProfileData, UserProfileCompare } from "@/types/users/profile";

interface RivalHeaderProps {
  profile: UserProfileData | null | undefined;
  isUpdating: boolean;
  onToggleFollow: () => void;
}

interface WinLossEntry {
  level: number;
  win: number;
  lose: number;
  draw: number;
}

interface WinLossStatsProps {
  winLossData: WinLossEntry[];
}

interface SectionTitleProps {
  icon: LucideIcon;
  label: string;
}

interface StatBoxProps {
  label: string;
  value: number;
  color: string;
}

export const RivalHeader = ({
  profile,
  isUpdating,
  onToggleFollow,
}: RivalHeaderProps) => (
  <div className="flex w-full flex-col gap-4">
    <div className="flex flex-col items-center gap-4 text-center md:flex-row md:gap-6 md:text-left">
      <Avatar className="h-24 w-24 border-2 border-bpim-border">
        <AvatarImage src={profile?.profileImage ?? undefined} />
        <AvatarFallback>{profile?.userName?.slice(0, 2)}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-1 md:items-start">
        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
          <h2 className="text-xl font-bold tracking-tight text-bpim-text">
            {profile?.userName}
          </h2>
          {profile?.relationship?.isMutual && (
            <Badge
              variant="secondary"
              className="bg-bpim-primary/10 text-bpim-primary border-bpim-border px-2 py-0 text-[10px]"
            >
              相互フォロー
            </Badge>
          )}
        </div>
        <p className="font-mono text-xs tracking-wider text-bpim-muted">
          ID: {formatIIDXId(profile?.iidxId ?? "")}
        </p>
        <div className="mt-1 flex justify-center gap-2 md:justify-start">
          <Badge className="bg-orange-600 text-bpim-text border-none rounded-sm px-2">
            {profile?.current?.arenaRank || "N/A"}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-bpim-primary/10 text-bpim-primary border-bpim-border rounded-sm px-2"
          >
            ☆12 BPI: {profile?.current?.totalBpi?.toFixed(2) || "N/A"}
          </Badge>
        </div>
      </div>

      <div className="w-full md:w-auto">
        <FollowSection
          onModal
          userId={profile?.userId ?? ""}
          isUpdating={isUpdating}
          relationship={
            profile?.relationship ?? {
              isFollowing: false,
              isFollowed: false,
              isSelf: false,
            }
          }
          onToggle={onToggleFollow}
        />
      </div>
    </div>

    {profile?.profileText && (
      <div className="w-full rounded-lg bg-bpim-surface-2/60 p-3">
        <p className="whitespace-pre-wrap text-xs text-bpim-text leading-relaxed">
          {profile.profileText}
        </p>
      </div>
    )}
  </div>
);

export const WinLossStats = ({ winLossData }: WinLossStatsProps) => (
  <div className="flex flex-col gap-3">
    <SectionTitle icon={Swords} label="WIN / LOSS STATS" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[11, 12].map((lv) => {
        const stats = winLossData.find((s) => s.level === lv) ?? {
          win: 0,
          lose: 0,
          draw: 0,
        };
        const total = stats.win + stats.lose + stats.draw;
        const winRate =
          total > 0 ? ((stats.win / total) * 100).toFixed(1) : "0.0";

        return (
          <div
            key={lv}
            className="rounded-xl border border-bpim-border bg-bpim-surface-2/40 p-4"
          >
            <div className="mb-3 flex justify-between items-center">
              <span className="text-xs font-bold text-bpim-primary">
                LEVEL {lv}
              </span>
              <span className="text-[10px] font-bold text-bpim-success">
                {winRate}%
              </span>
            </div>

            <div className="flex justify-around items-center">
              <StatBox
                label="WIN"
                value={stats.win}
                color="text-bpim-success"
              />
              <StatBox
                label="DRAW"
                value={stats.draw}
                color="text-bpim-muted"
              />
              <StatBox
                label="LOSE"
                value={stats.lose}
                color="text-bpim-danger"
              />
            </div>

            <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-bpim-overlay/60">
              <div
                className="h-full bg-bpim-success transition-all duration-700 ease-in-out"
                style={{ width: `${winRate}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export const SectionTitle = ({ icon: Icon, label }: SectionTitleProps) => (
  <div className="flex items-center gap-2">
    <Icon className="h-3 w-3 text-bpim-muted" />
    <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
      {label}
    </span>
  </div>
);

const StatBox = ({ label, value, color }: StatBoxProps) => (
  <div className="flex flex-col items-center gap-0">
    <span className={cn("text-xl font-black leading-none", color)}>
      {value}
    </span>
    <span className="text-[8px] font-bold tracking-tighter text-bpim-subtle uppercase">
      {label}
    </span>
  </div>
);
