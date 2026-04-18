import Link from "next/link";
import { cn } from "@/lib/utils";

export const FollowStats = ({
  userId,
  follows,
  className,
}: {
  userId: string;
  follows: { following: number; followers: number };
  className?: string;
}) => (
  <div
    className={cn("flex lg:justify-center items-center gap-5 py-1", className)}
  >
    <Link
      href={`/users/${userId}/following`}
      className="group flex items-baseline gap-1.5 transition-opacity hover:opacity-80"
    >
      <span className="font-mono text-base font-bold text-bpim-text">
        {follows.following}
      </span>
      <span className="text-xs font-medium text-bpim-muted group-hover:text-bpim-text transition-colors">
        フォロー
      </span>
    </Link>

    <Link
      href={`/users/${userId}/followers`}
      className="group flex items-baseline gap-1.5 transition-opacity hover:opacity-80"
    >
      <span className="font-mono text-base font-bold text-bpim-text">
        {follows.followers}
      </span>
      <span className="text-xs font-medium text-bpim-muted group-hover:text-bpim-text transition-colors">
        フォロワー
      </span>
    </Link>
  </div>
);
