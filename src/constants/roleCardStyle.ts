import { cn } from "@/lib/utils";
import type { UserRoleInfo } from "@/types/users/profile";

const ROLE_CARD_BORDER: Record<string, string> = {
  coffee: "border-amber-400/40 hover:border-amber-400/60",
  saba: "border-cyan-400/40 hover:border-cyan-400/60",
  iidx: "border-violet-400/50 hover:border-violet-400/70",
  developer: "border-emerald-400/40 hover:border-emerald-400/60",
  pro: "border-yellow-400/40 hover:border-yellow-400/60",
};

const ROLE_CARD_BG: Record<string, string> = {
  coffee: "bg-amber-400/5",
  saba: "bg-cyan-400/5",
  iidx: "bg-violet-500/10",
  developer: "bg-emerald-400/5",
  pro: "bg-yellow-400/5",
};

export const getRoleCardStyle = (role: UserRoleInfo | null): string => {
  if (!role) return "";
  const border = ROLE_CARD_BORDER[role.role] ?? "";
  const bg = ROLE_CARD_BG[role.role] ?? "";
  return cn(border, bg);
};
