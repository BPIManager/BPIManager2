/** ユーザーロール別アイコン */
import { Coffee, Fish, Sparkle, Code2, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ROLE_ICON: Record<string, { icon: LucideIcon; color: string }> = {
  coffee: { icon: Coffee, color: "text-amber-400" },
  saba: { icon: Fish, color: "text-cyan-400" },
  iidx: { icon: Sparkle, color: "text-violet-300" },
  developer: { icon: Code2, color: "text-emerald-400" },
  pro: { icon: Trophy, color: "text-yellow-400" },
};
