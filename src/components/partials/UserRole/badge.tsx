"use client";

import { useState } from "react";
import { Coffee, Fish, Piano, Code2, Trophy, Sparkle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import type { UserRoleInfo } from "@/types/users/profile";
import { Button } from "@/components/ui/button";

type RoleKey = "coffee" | "saba" | "iidx" | "developer" | "pro";

const ROLE_CONFIG: Record<
  RoleKey,
  {
    icon: typeof Coffee;
    label: string;
    color: string;
    bg: string;
    compactIconSize: string;
    fullIconSize: string;
  }
> = {
  coffee: {
    icon: Coffee,
    label: "Coffee",
    color: "text-amber-400/70",
    bg: "bg-amber-400/10 border-amber-400/20 hover:bg-amber-400/15",
    compactIconSize: "h-3 w-3",
    fullIconSize: "h-3.5 w-3.5",
  },
  saba: {
    icon: Fish,
    label: "Saba",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10 border-cyan-400/30 hover:bg-cyan-400/20",
    compactIconSize: "h-3.5 w-3.5",
    fullIconSize: "h-4 w-4",
  },
  iidx: {
    icon: Sparkle,
    label: "Sparkle",
    color: "text-violet-300",
    bg: "bg-violet-500/20 border-violet-400/50 hover:bg-violet-500/30",
    compactIconSize: "h-4 w-4",
    fullIconSize: "h-4.5 w-4.5",
  },
  developer: {
    icon: Code2,
    label: "Developer",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/30 hover:bg-emerald-400/20",
    compactIconSize: "h-3 w-3",
    fullIconSize: "h-3.5 w-3.5",
  },
  pro: {
    icon: Trophy,
    label: "Pro",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/30 hover:bg-yellow-400/20",
    compactIconSize: "h-3 w-3",
    fullIconSize: "h-3.5 w-3.5",
  },
};

type RoleBadgeVariant = "compact" | "full";

export const RoleBadge = ({
  role,
  description,
  grantedAt,
  variant = "compact",
  size = "normal",
}: UserRoleInfo & {
  variant?: RoleBadgeVariant;
  size?: "normal" | "small";
}) => {
  const [open, setOpen] = useState(false);
  const config = ROLE_CONFIG[role as RoleKey];
  if (!config) return null;

  const {
    icon: Icon,
    label,
    color,
    bg,
    compactIconSize,
    fullIconSize,
  } = config;
  const days = dayjs().diff(dayjs(grantedAt), "day");
  const date = dayjs(grantedAt).format("YYYY-MM-DD");
  const tooltipText = description || label;
  const isFull = variant === "full";

  return (
    <TooltipProvider>
      <Tooltip
        open={open}
        onOpenChange={(v) => {
          if (!v) setOpen(false);
        }}
      >
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border font-bold transition-colors",
              isFull ? "px-3 py-1 my-2" : "px-2 py-0.5 ml-1",
              size === "small" ? "text-[10px]" : "text-sm",
              bg,
              color,
            )}
          >
            <Icon className={isFull ? fullIconSize : compactIconSize} />
            {isFull && <span>{label}</span>}
          </button>
        </TooltipTrigger>
        <TooltipContent className="flex flex-col items-center gap-0.5 text-center">
          <span className="font-bold">サポーターレベル:{tooltipText}</span>
          <span className="text-[10px] text-bpim-muted">
            {days}日間サポート中
            <br />
            {date}より
          </span>
          <Button
            size="xs"
            className="mt-1"
            onClick={() => window.open("https://ci-en.net/creator/36005")}
          >
            サポーターとは?
          </Button>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
