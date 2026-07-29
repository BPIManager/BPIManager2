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
import { useTranslation } from "@/hooks/common/useTranslation";

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
  const { t } = useTranslation();
  const stats = [
    {
      label: t("logs.summary.batchBpi"),
      value: summary.batchPerformance,
      icon: PlusCircle,
      color: "text-bpim-primary",
      tooltip: t("logs.summary.batchBpi.tooltip"),
    },
    {
      label: t("logs.summary.updated"),
      value: summary.updatedScores,
      icon: PlusCircle,
      color: "text-bpim-warning",
    },
    {
      label: t("logs.summary.newRecords"),
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
