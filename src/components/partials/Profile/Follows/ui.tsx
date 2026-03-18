import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const UserFollowCard = ({ user }: { user: any }) => {
  const isMasked = user.userId === "";

  const UserInfo = (
    <div className="flex flex-1 items-center gap-4">
      <Avatar className="h-12 w-12 border border-bpim-border">
        <AvatarImage src={user.profileImage ?? ""} />
        <AvatarFallback>{user.userName?.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start gap-0">
        <span className="text-sm font-bold text-white">{user.userName}</span>
        <div className="flex items-center gap-2">
          <Badge className="bg-orange-600 px-1 py-0 text-[10px] font-bold border-none h-4">
            {user.arenaRank || "N/A"}
          </Badge>
          <span className="font-mono text-xs font-bold text-blue-300 uppercase">
            総合BPI: {user.totalBpi?.toFixed(2) ?? "N/A"}
          </span>
        </div>
      </div>
    </div>
  );

  const containerClass = cn(
    "flex w-full items-center justify-between rounded-xl border border-bpim-border bg-white/5 p-4 transition-colors duration-200",
    isMasked ? "cursor-default" : "cursor-pointer hover:bg-white/10",
  );

  return isMasked ? (
    <div className={containerClass}>{UserInfo}</div>
  ) : (
    <Link href={`/users/${user.userId}`} className={containerClass}>
      {UserInfo}
    </Link>
  );
};
