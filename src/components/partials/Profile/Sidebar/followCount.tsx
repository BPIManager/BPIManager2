import Link from "next/link";

export const FollowStats = ({
  userId,
  follows,
}: {
  userId: string;
  follows: { following: number; followers: number };
}) => (
  <div className="flex w-full items-center justify-center gap-8 py-2">
    <Link
      href={`/users/${userId}/following`}
      className="group flex flex-col items-center"
    >
      <span className="font-mono text-lg font-bold text-bpim-text group-hover:text-bpim-primary transition-colors">
        {follows.following}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
        フォロー
      </span>
    </Link>
    <Link
      href={`/users/${userId}/followers`}
      className="group flex flex-col items-center"
    >
      <span className="font-mono text-lg font-bold text-bpim-text group-hover:text-bpim-primary transition-colors">
        {follows.followers}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted">
        フォロワー
      </span>
    </Link>
  </div>
);
