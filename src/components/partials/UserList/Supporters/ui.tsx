"use client";

import { Coffee, Fish, Sparkle, Code2, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import { RoleBadge } from "../../UserRole/badge";
import type { SupporterUser } from "@/hooks/users/useSupporters";

type RoleKey = "pro" | "iidx" | "saba" | "developer" | "coffee";

const SUPPORTER_ORDER: RoleKey[] = ["pro", "iidx", "saba", "coffee"];
const CONTRIBUTOR_ORDER: RoleKey[] = ["developer"];

const ROLE_CONFIG: Record<
  RoleKey,
  {
    label: string;
    icon: LucideIcon;
    color: string;
    headerBg: string;
    divider: string;
  }
> = {
  pro: {
    label: "Pro",
    icon: Trophy,
    color: "text-yellow-400",
    headerBg: "bg-yellow-400/10 border-yellow-400/30",
    divider: "border-yellow-400/20",
  },
  iidx: {
    label: "Sparkle",
    icon: Sparkle,
    color: "text-violet-300",
    headerBg: "bg-violet-500/10 border-violet-400/40",
    divider: "border-violet-400/20",
  },
  saba: {
    label: "Saba",
    icon: Fish,
    color: "text-cyan-400",
    headerBg: "bg-cyan-400/10 border-cyan-400/30",
    divider: "border-cyan-400/20",
  },
  developer: {
    label: "Developer",
    icon: Code2,
    color: "text-emerald-400",
    headerBg: "bg-emerald-400/10 border-emerald-400/30",
    divider: "border-emerald-400/20",
  },
  coffee: {
    label: "Coffee",
    icon: Coffee,
    color: "text-amber-400",
    headerBg: "bg-amber-400/10 border-amber-400/30",
    divider: "border-amber-400/20",
  },
};

const SupporterRow = ({ user }: { user: SupporterUser }) => (
  <Link
    href={`/users/${user.userId}`}
    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-bpim-surface-2/60"
  >
    <Avatar className="h-8 w-8 shrink-0 border border-bpim-border">
      <AvatarImage src={user.profileImage ?? ""} />
      <AvatarFallback>{user.userName.slice(0, 2)}</AvatarFallback>
    </Avatar>
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-1.5">
        <span className="truncate text-sm font-bold text-bpim-text">
          {user.userName}
        </span>
        <RoleBadge {...user.role} size="small" />
      </div>
    </div>
  </Link>
);

const RoleGroup = ({
  roleKey,
  users,
}: {
  roleKey: RoleKey;
  users: SupporterUser[];
}) => {
  if (users.length === 0) return null;
  const { label, icon: Icon, color, headerBg, divider } = ROLE_CONFIG[roleKey];
  return (
    <div className={cn("rounded-xl border", headerBg)}>
      <div
        className={cn("flex items-center gap-2 border-b px-4 py-2.5", divider)}
      >
        <Icon className={cn("h-4 w-4", color)} />
        <span
          className={cn("text-xs font-bold tracking-wider uppercase", color)}
        >
          {label}
        </span>
        <span className="ml-auto text-[10px] text-bpim-muted">
          {users.length}名
        </span>
      </div>
      <div className="flex flex-col divide-y divide-bpim-border/30 px-1 py-1">
        {users.map((user) => (
          <SupporterRow key={user.userId} user={user} />
        ))}
      </div>
    </div>
  );
};

export const SupporterListView = ({ users }: { users: SupporterUser[] }) => {
  const grouped = SUPPORTER_ORDER.reduce<
    Partial<Record<RoleKey, SupporterUser[]>>
  >((acc, role) => {
    acc[role] = users.filter((u) => u.role.role === role);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      {SUPPORTER_ORDER.map((roleKey) => (
        <RoleGroup
          key={roleKey}
          roleKey={roleKey}
          users={grouped[roleKey] ?? []}
        />
      ))}
    </div>
  );
};

export const ContributorListView = ({ users }: { users: SupporterUser[] }) => {
  const contributors = users.filter((u) => u.role.role === "developer");

  return (
    <div className="flex flex-col gap-4">
      {CONTRIBUTOR_ORDER.map((roleKey) => (
        <RoleGroup key={roleKey} roleKey={roleKey} users={contributors} />
      ))}
    </div>
  );
};
