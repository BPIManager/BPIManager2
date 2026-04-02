import { Badge } from "@/components/ui/badge";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import { OptimizationSummary } from "./OptimizationSummary";
import { OptimizationStepCard } from "./OptimizationStepCard";

interface OptimizationStepListProps {
  result: OptimizationResult;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

export const OptimizationStepList = ({
  result,
  onSave,
  isSaving,
  isSaved,
}: OptimizationStepListProps) => {
  const maxGain = Math.max(...result.steps.map((s) => s.bpiGain), 0.01);

  return (
    <div className="flex flex-col gap-4">
      <OptimizationSummary
        result={result}
        onSave={onSave}
        isSaving={isSaving}
        isSaved={isSaved}
      />

      {result.steps.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-2 px-2">
            <Badge
              variant="outline"
              className="text-[10px] border-bpim-border text-bpim-subtle"
            >
              推奨ルート（効率順）
            </Badge>
          </div>
          {result.steps.map((step) => (
            <OptimizationStepCard
              key={`${step.songId}-${step.rank}`}
              step={step}
              maxGain={maxGain}
            />
          ))}
        </div>
      )}
    </div>
  );
};
