"use client";

import { useState } from "react";
import { AAATableItem } from "@/types/metrics/aaa";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AAATableTooltip } from "./tooltip";
import { cn } from "@/lib/utils";

export const AAAGridItem = ({
  item,
  goal,
}: {
  item: AAATableItem;
  goal: "aaa" | "maxMinus";
}) => {
  const [open, setOpen] = useState(false);

  const target = item.targets[goal];
  const userBpi = item.user.bpi;
  const targetBpi = target.targetBpi;
  const bpiGap = userBpi - targetBpi;
  const isHighBpi = userBpi >= 100;

  const getBgColor = (gap: number, high: boolean) => {
    if (high) return "bg-[#003567]";
    if (gap < -10) return "bg-[#FF3131]";
    if (gap < -5) return "bg-[#FF8C8C]";
    if (gap < -0.001) return "bg-[#FFE999]";
    if (gap <= 5) return "bg-[#EAEFF9]";
    if (gap <= 10) return "bg-[#6C9BD2]";
    return "bg-[#187FC4]";
  };

  const bgColorClass =
    item.user.exScore > 0 ? getBgColor(bpiGap, isHighBpi) : "bg-bpim-surface-2";

  const useWhiteText = isHighBpi || bpiGap > 5 || item.user.exScore === 0;
  const diffChar = item.difficulty.slice(0, 1).toUpperCase();

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen} delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            className={cn(
              "group relative flex cursor-help flex-col gap-2 rounded-md p-3 transition-all duration-150 ease-out border select-none",
              bgColorClass,
              useWhiteText ? "text-bpim-text" : "text-slate-950",
              open
                ? "border-white scale-105 z-10 shadow-2xl"
                : "border-bpim-border hover:scale-[1.04] hover:shadow-xl",
            )}
            style={{ touchAction: "manipulation" }}
          >
            <h5 className="truncate text-[11px] font-black leading-none tracking-tight">
              {item.title}{" "}
              <span className="opacity-60 font-mono">[{diffChar}]</span>
            </h5>

            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-0">
                <span className="text-[8px] font-black uppercase leading-none opacity-60 tracking-tighter">
                  Target
                </span>
                <span className="font-mono text-sm font-black leading-none">
                  {targetBpi.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col items-end gap-0">
                <span className="text-[8px] font-black uppercase leading-none opacity-60 tracking-tighter">
                  My BPI
                </span>
                <span className="font-mono text-sm font-black leading-none">
                  {item.user.exScore > 0 ? userBpi.toFixed(2) : "-"}
                </span>
              </div>
            </div>
          </div>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          className="border-bpim-border bg-bpim-bg/95 p-3 shadow-2xl backdrop-blur-md"
        >
          <AAATableTooltip item={item} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
