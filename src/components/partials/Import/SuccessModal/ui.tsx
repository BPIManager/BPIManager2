"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  ScrollText,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import Fireworks from "react-canvas-confetti/dist/presets/fireworks";
import Lottie from "lottie-react";

import { useUser } from "@/contexts/users/UserContext";
import trendingUpAnimation from "@/assets/lottie/trending-up.json";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  result: {
    batchId: string;
    updatedCount: number;
    newTotalBpi?: number;
    previousTotalBpi?: number;
  } | null;
  version: string;
  onClose: () => void;
}

export const ImportSuccessModal = ({ result, version, onClose }: Props) => {
  const router = useRouter();
  const { fbUser } = useUser();
  const [displayBpi, setDisplayBpi] = useState(0);

  useEffect(() => {
    if (result?.newTotalBpi) {
      const end = result.newTotalBpi;
      const duration = 1000;
      const startTime = performance.now();

      const updateCount = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeInOutCubic = (t: number) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const currentValue = end * easeInOutCubic(progress);

        setDisplayBpi(currentValue);
        if (progress < 1) requestAnimationFrame(updateCount);
      };
      requestAnimationFrame(updateCount);
    }
  }, [result?.newTotalBpi]);

  if (!result) return null;

  const bpiDiff = (result.newTotalBpi || 0) - (result.previousTotalBpi || 0);
  const isImproved = bpiDiff > 0;
  const isUnchanged = bpiDiff === 0;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {isImproved && (
        <Fireworks
          autorun={{ speed: 2, duration: 1500 }}
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 1001,
            pointerEvents: "none",
          }}
        />
      )}

      <div className="relative z-[1002] flex w-full max-w-[400px] flex-col items-center gap-7 rounded-2xl border border-white/10 bg-[#16181c] p-8 text-center shadow-2xl">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
          {isImproved ? (
            <Lottie
              animationData={trendingUpAnimation}
              loop={false}
              autoplay={true}
              style={{ width: "48px", height: "48px" }}
            />
          ) : (
            <ScrollText size={32} />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black tracking-tight text-white uppercase">
            Import Completed
          </h2>
          <p className="text-sm font-medium text-slate-400">
            {result.updatedCount} 件のスコアを更新しました
          </p>
        </div>

        {result.newTotalBpi !== undefined && (
          <div className="flex w-full flex-col gap-4 py-2">
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
              Total BPI Change (☆12)
            </span>

            <div className="flex items-center justify-center gap-6">
              {result.previousTotalBpi !== undefined && (
                <span className="font-mono text-xl font-bold text-slate-600">
                  {result.previousTotalBpi.toFixed(2)}
                </span>
              )}

              <ChevronRight size={20} className="text-slate-800" />

              <span className="font-mono text-4xl font-black text-white tabular-nums leading-none">
                {displayBpi.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-center">
              <Badge
                variant="outline"
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-1 border-none font-black text-xs tracking-widest",
                  isImproved && "bg-green-500/10 text-green-400",
                  isUnchanged && "bg-slate-500/10 text-slate-400",
                  !isImproved && !isUnchanged && "bg-red-500/10 text-red-400",
                )}
              >
                {isImproved ? (
                  <TrendingUp size={14} />
                ) : isUnchanged ? (
                  <Minus size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                <span>
                  {isImproved ? "上昇" : isUnchanged ? "変動なし" : "低下"} :{" "}
                  {bpiDiff > 0 ? "+" : ""}
                  {bpiDiff.toFixed(2)}
                </span>
              </Badge>
            </div>
          </div>
        )}

        <div className="flex w-full flex-col gap-3">
          <Button
            size="lg"
            className="w-full bg-blue-600 font-black text-white hover:bg-blue-500 active:scale-95 transition-all"
            onClick={() =>
              router.push(
                `/users/${fbUser?.uid}/logs/${version}/${result.batchId}`,
              )
            }
          >
            今回の更新ログを確認
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full border-white/10 text-slate-400 font-bold hover:bg-white/5 hover:text-white"
            onClick={() => router.push("/my")}
          >
            全スコア一覧を表示
          </Button>

          <Button
            variant="ghost"
            className="text-slate-500 hover:text-slate-300"
            onClick={onClose}
          >
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
};
