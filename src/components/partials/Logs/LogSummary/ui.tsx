import { PlusCircle, HelpCircle, MusicIcon } from "lucide-react";
import {
  HelpTooltip,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DashCard } from "@/components/ui/dashcard";

export const LabelWithTooltip = ({
  label,
  tooltipText,
  isSharing,
}: {
  label: string;
  tooltipText?: string;
  isSharing: boolean;
}) => {
  if (!tooltipText) {
    return (
      <span className="text-sm font-bold text-bpim-text leading-[1.2] tracking-tighter whitespace-nowrap">
        {label}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-bold text-bpim-text tracking-tighter whitespace-nowrap">
        {label}
      </span>
      {!isSharing && <HelpTooltip>{tooltipText}</HelpTooltip>}
    </div>
  );
};

export const BatchSummaryCards = ({
  summary,
  isSharing,
}: {
  summary: {
    batchPerformance: number;
    newRecords: number;
    updatedScores: number;
  };
  isSharing: boolean;
}) => {
  const stats = [
    {
      label: "今日のBPI",
      value: summary.batchPerformance,
      icon: PlusCircle,
      color: "text-bpim-primary",
      tooltip: "今回更新した☆12のみを対象とした総合BPI",
    },
    {
      label: "更新",
      value: summary.updatedScores,
      icon: PlusCircle,
      color: "text-bpim-warning",
    },
    {
      label: "新規",
      value: summary.newRecords,
      icon: MusicIcon,
      color: "text-purple-300",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat, i) => (
        <DashCard
          key={i}
          className="p-3 md:p-5 flex flex-col items-start justify-center gap-1"
        >
          <LabelWithTooltip
            isSharing={isSharing}
            label={stat.label}
            tooltipText={stat.tooltip}
          />
          <div
            className={cn(
              "text-2xl font-bold font-mono leading-tight",
              stat.color,
            )}
          >
            {stat.value}
          </div>
        </DashCard>
      ))}
    </div>
  );
};
