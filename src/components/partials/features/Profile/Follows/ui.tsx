import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/common/useTranslation";
import Link from "next/link";
import ArenaClassBadge from "@/components/partials/common/Badge/ArenaClassBadge";
import PrivateAccountBadge from "@/components/partials/common/Badge/PrivateAccountBadge";

interface FollowUser {
  userId: string;
  profileImage: string | null;
  userName: string | null;
  arenaClass: string | null;
  totalBpi: number | null;
  isPublic: boolean;
}

const UserFollowCard = ({
  user,
  permission,
}: {
  user: FollowUser;
  /** 自分の非公開アカウントのフォロワー一覧でのみ指定する閲覧権限の状態 */
  permission?: "pending" | "approved";
}) => {
  const { t } = useTranslation();
  const isMasked = user.userId === "";

  const UserInfo = (
    <div className="flex flex-1 items-center gap-4">
      <Avatar className="h-12 w-12 border border-bpim-border">
        <AvatarImage src={user.profileImage ?? ""} />
        <AvatarFallback>{user.userName?.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start gap-0">
        <span className="flex items-center gap-1.5 text-sm font-bold text-bpim-text">
          {user.userName}
          {!isMasked && !user.isPublic && <PrivateAccountBadge size="xs" />}
          {permission && (
            <Badge
              variant={permission === "approved" ? "secondary" : "outline"}
              className="h-4 px-1.5 text-[10px] font-bold"
            >
              {t(
                permission === "approved"
                  ? "viewPermissions.badge.approved"
                  : "viewPermissions.badge.pending",
              )}
            </Badge>
          )}
        </span>
        <div className="flex items-center gap-2">
          <ArenaClassBadge arenaClass={user.arenaClass} size="sm" />
          <span className="font-mono text-xs font-bold text-bpim-primary uppercase">
            総合BPI: {user.totalBpi?.toFixed(2) ?? "N/A"}
          </span>
        </div>
      </div>
    </div>
  );

  const containerClass = cn(
    "flex w-full items-center justify-between rounded-xl border border-bpim-border bg-bpim-surface-2/60 p-4 transition-colors duration-200",
    isMasked ? "cursor-default" : "cursor-pointer hover:bg-bpim-overlay",
  );

  return isMasked ? (
    <div className={containerClass}>{UserInfo}</div>
  ) : (
    <Link href={`/users/${user.userId}`} className={containerClass}>
      {UserInfo}
    </Link>
  );
};

export default UserFollowCard;
