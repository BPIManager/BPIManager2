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

type RankTier = "first" | "top10" | "top25" | "top50" | "default";

function getRankTier(areaRank: number, totalInArea: number): RankTier {
  if (areaRank === 1) return "first";
  const pct = areaRank / totalInArea;
  if (pct <= 0.1) return "top10";
  if (pct <= 0.25) return "top25";
  if (pct <= 0.5) return "top50";
  return "default";
}

const TIER_STYLE: Record<
  RankTier,
  { bg: string; text: string; border: string; glow: string | null }
> = {
  first: {
    bg: "#fbbf2425",
    text: "#fbbf24",
    border: "#fbbf2460",
    glow: "#fbbf2440",
  },
  top10: {
    bg: "#f59e0b20",
    text: "#f59e0b",
    border: "#f59e0b50",
    glow: "#f59e0b30",
  },
  top25: {
    bg: "#fb923c20",
    text: "#fb923c",
    border: "#fb923c50",
    glow: null,
  },
  top50: {
    bg: "#38bdf820",
    text: "#38bdf8",
    border: "#38bdf850",
    glow: null,
  },
  default: {
    bg: "#6b728020",
    text: "#9ca3af",
    border: "#6b728050",
    glow: null,
  },
};

const SPARKLE_POSITIONS = [
  { top: "-4px", left: "20%", delay: "0s" },
  { top: "50%", right: "-5px", delay: "1.2s" },
  { bottom: "-4px", left: "55%", delay: "2.4s" },
  { top: "10%", left: "-5px", delay: "0.8s" },
];

export const AreaRankBadge = ({
  area,
  areaRank,
  totalInArea,
}: AreaRankBadgeProps) => {
  const [open, setOpen] = useState(false);
  const tier = getRankTier(areaRank, totalInArea);
  const s = TIER_STYLE[tier];
  const hasSparkle = tier === "first" || tier === "top10";
  const sparkleColor = tier === "first" ? "#fbbf24" : "#f59e0b";

  return (
    <TooltipProvider>
      {hasSparkle && (
        <style>{`
          @keyframes area-particle {
            0%, 100% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 0.7; transform: scale(1); }
          }
        `}</style>
      )}
      <Tooltip open={open} onOpenChange={setOpen} delayDuration={0}>
        <TooltipTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            onClick={() => setOpen((v) => !v)}
            onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
            className="relative mt-1 inline-flex cursor-pointer items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums select-none"
            style={{
              background: s.bg,
              color: s.text,
              border: `1px solid ${s.border}`,
              boxShadow: s.glow ? `0 0 6px ${s.glow}` : undefined,
            }}
          >
            {hasSparkle &&
              SPARKLE_POSITIONS.map((pos, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: sparkleColor,
                    boxShadow: `0 0 4px ${sparkleColor}`,
                    animation: `area-particle 3.6s ease-in-out ${pos.delay} infinite`,
                    top: (pos as { top?: string }).top,
                    left: (pos as { left?: string }).left,
                    right: (pos as { right?: string }).right,
                    bottom: (pos as { bottom?: string }).bottom,
                    pointerEvents: "none",
                  }}
                />
              ))}
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
