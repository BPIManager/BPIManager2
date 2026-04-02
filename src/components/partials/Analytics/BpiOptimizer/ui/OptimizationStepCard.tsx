import { ArrowRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OptimizationStep } from "@/types/bpi-optimizer";
import { BpiChip } from "./BpiChip";
import { RADAR_LABELS, DIFF_COLORS } from "./shared";

export const OptimizationStepCard = ({
  step,
  maxGain,
}: {
  step: OptimizationStep;
  maxGain: number;
}) => {
  const impactWidth = Math.min(100, (step.bpiGain / maxGain) * 100);

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-bpim-border bg-bpim-surface p-4 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-bpim-bg flex items-center justify-center shrink-0 border border-bpim-border font-black text-bpim-muted group-hover:text-bpim-primary group-hover:border-bpim-primary/50 transition-colors">
            {step.rank}
          </div>
          <div className="min-w-0 flex flex-col gap-1">
            <h3 className="text-sm font-black text-bpim-text truncate leading-tight">
              {step.title}
            </h3>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-black text-white",
                  DIFF_COLORS[step.difficulty],
                )}
              >
                {step.difficultyLevel} {step.difficulty.charAt(0)}
              </div>
              {step.radarCategory && (
                <span className="text-[10px] font-bold text-bpim-subtle px-2 py-0.5 bg-bpim-bg rounded-full border border-bpim-border">
                  {RADAR_LABELS[step.radarCategory]}
                </span>
              )}
              {step.isRadarStrength && (
                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[9px] h-4">
                  <Star className="h-2 w-2 mr-1 fill-yellow-500" /> 得意曲
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs font-black text-bpim-primary">
            EX +{step.exScoreGap}
          </div>
          <div className="text-[10px] text-bpim-muted font-bold">
            目標: {step.toExScore}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-end">
          <span className="text-[9px] font-black text-bpim-subtle uppercase tracking-widest">
            総合BPIへのインパクト
          </span>
          <span className="text-[10px] font-mono font-bold text-bpim-primary">
            +{step.bpiGain.toFixed(2)}
          </span>
        </div>
        <div className="h-1.5 w-full bg-bpim-bg rounded-full overflow-hidden border border-bpim-border/50">
          <div
            className="h-full bg-gradient-to-r from-bpim-primary/50 to-bpim-primary transition-all duration-1000"
            style={{ width: `${impactWidth}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-bpim-border/50">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black text-bpim-subtle uppercase tracking-widest leading-none">
            単曲BPIの変化
          </span>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <BpiChip bpi={step.fromBpi} size="xs" />
            </div>
            <ArrowRight className="h-3 w-3 text-bpim-primary/50" />
            <div className="flex flex-col items-center">
              <BpiChip bpi={step.toBpi} size="xs" />
            </div>
            <span className="text-[10px] font-bold text-bpim-primary ml-1">
              (+{(step.toBpi - step.fromBpi).toFixed(1)})
            </span>
          </div>
        </div>

        <div className="text-right flex flex-col justify-end">
          <span className="text-[9px] font-black text-bpim-subtle uppercase tracking-widest leading-none">
            達成後総合BPI
          </span>
          <div className="text-sm font-black text-bpim-text font-mono leading-tight mt-1">
            {step.cumulativeTotalBpi.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};
