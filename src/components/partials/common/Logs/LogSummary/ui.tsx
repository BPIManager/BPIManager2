import { ReactNode } from "react";
import { PlusCircle, MusicIcon, ExternalLink } from "lucide-react";
import { HelpTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DashCard } from "@/components/ui/dashcard";
import { useTranslation } from "@/hooks/common/useTranslation";

const BPICALC_NPM_URL = "https://www.npmjs.com/package/@bpim/bpicalc";

export const LabelWithTooltip = ({
  label,
  tooltipText,
  isSharing,
}: {
  label: string;
  tooltipText?: ReactNode;
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
    batchPerformance: number | null;
    newRecords: number;
    updatedScores: number;
  };
  isSharing: boolean;
}) => {
  const { t } = useTranslation();
  const stats = [
    {
      label: t("logs.summary.batchBpi"),
      value:
        summary.batchPerformance !== null
          ? summary.batchPerformance.toFixed(2)
          : "—",
      icon: PlusCircle,
      color: "text-bpim-primary",
      tooltip: (
        <>
          <p>{t("logs.summary.batchBpi.tooltip")}</p>
          <a
            href={BPICALC_NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 font-medium text-bpim-primary hover:underline"
          >
            {t("common.bpicalcLink")}
            <ExternalLink className="h-3 w-3" />
          </a>
        </>
      ),
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
