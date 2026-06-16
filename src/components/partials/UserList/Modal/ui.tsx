import { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import { FollowSection } from "../../Profile/Sidebar/followStatus";

import { UserProfileData } from "@/types/users/profile";
import { RoleBadge } from "../../UserRole/badge";
import { ArenaClassBadge } from "../../ArenaClassBadge";
import { useTranslation } from "@/hooks/common/useTranslation";

interface RivalHeaderProps {
  profile: UserProfileData | null | undefined;
  isUpdating: boolean;
  onToggleFollow: () => void;
}

interface SectionTitleProps {
  icon: LucideIcon;
  label: string;
}

export const RivalHeader = ({
  profile,
  isUpdating,
  onToggleFollow,
}: RivalHeaderProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col items-center gap-4 text-center md:flex-row md:gap-6 md:text-left">
        <Avatar className="h-24 w-24 border-2 border-bpim-border">
          <AvatarImage src={profile?.profileImage ?? undefined} />
          <AvatarFallback>{profile?.userName?.slice(0, 2)}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1 md:items-start">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <h2 className="text-xl font-bold tracking-tight text-bpim-text">
              {profile?.userName}
            </h2>
            {profile?.role && <RoleBadge {...profile.role} />}
            {profile?.relationship?.isMutual && (
              <Badge
                variant="secondary"
                className="bg-bpim-primary/10 text-bpim-primary border-bpim-border px-2 py-0 text-[10px]"
              >
                {t("rivals.mutual")}
              </Badge>
            )}
          </div>
          <p className="font-mono text-xs tracking-wider text-bpim-muted">
            ID: {formatIIDXId(profile?.iidxId ?? "")}
          </p>
          <div className="mt-1 flex justify-center gap-2 md:justify-start">
            <ArenaClassBadge
              arenaClass={profile?.stats[0]?.arenaClass || "N/A"}
            />
            <Badge
              variant="secondary"
              className="bg-bpim-primary/10 text-bpim-primary border-bpim-border rounded-sm px-2"
            >
              ☆12 BPI: {profile?.stats[0]?.totalBpi?.toFixed(2) || "N/A"}
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
                isMutual: false,
                isFollowedBy: false,
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
};

export const SectionTitle = ({ icon: Icon, label }: SectionTitleProps) => (
  <div className="flex items-center gap-2">
    <Icon className="h-3 w-3 text-bpim-muted" />
    <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
      {label}
    </span>
  </div>
);

export { WinLossStats } from "@/components/partials/WinLossStats";
