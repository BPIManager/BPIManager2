"use client";

import { useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AreaRankBadgeProps {
  area: string;
  areaRank: number;
  totalInArea: number;
}

export const AreaRankBadge = ({
  area,
  areaRank,
  totalInArea,
}: AreaRankBadgeProps) => {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen} delayDuration={0}>
        <TooltipTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            onClick={() => setOpen((v) => !v)}
            onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
            className="mt-1 inline-flex cursor-pointer items-center gap-0.5 rounded-full bg-bpim-primary/15 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-bpim-primary select-none"
          >
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            {areaRank}位/{totalInArea}人
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="flex flex-col items-center gap-2"
        >
          <span className="text-center text-xs leading-relaxed">
            {area}のプレイヤー{totalInArea}人中
            {areaRank}位
            <br />
            ※IIDX公式のアリーナランクptに基づく順位
            <br />
            （B帯以下は集計対象外. BPIM非登録者を含む）
          </span>
          <Link
            href={`/ranking/global?area=${encodeURIComponent(area)}`}
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 rounded-md bg-bpim-primary/15 px-2 py-1 text-[10px] font-bold text-bpim-primary hover:bg-bpim-primary/25 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            BPIに基づくランキングはこちら
          </Link>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
