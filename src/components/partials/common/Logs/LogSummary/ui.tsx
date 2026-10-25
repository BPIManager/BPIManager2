import { ReactNode } from "react";
import { PlusCircle, MusicIcon, ExternalLink } from "lucide-react";
import { HelpTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DashCard } from "@/components/ui/dashcard";
import { useTranslation } from "@/hooks/common/useTranslation";
import { Button } from "@/components/ui/button";
import { SELF_BEST_COMPARE } from "@/constants/logic/compareTarget";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import type { BatchRecordCounts } from "@/types/logs/batchDetail";

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
  recordCounts,
  version,
  onOpenList,
  isSharing,
}: {
  version?: string;
  /** 指定した比較対象を設定して「更新楽曲」タブを開く */
  onOpenList?: (compareVersion: string) => void;
  summary: {
    batchPerformance: number | null;
    newRecords: number;
    updatedScores: number;
  };
  recordCounts?: BatchRecordCounts;
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

  const versionIdx = version
    ? (IIDX_VERSIONS as readonly string[]).indexOf(version)
    : -1;
  const previousVersion =
    version !== "INF" && versionIdx > 0 ? IIDX_VERSIONS[versionIdx - 1] : null;
  const recordStats = [
    {
      label: t("logs.summary.selfBestUpdates"),
      value: recordCounts?.selfBestUpdates ?? "-",
      color: "text-bpim-success",
      compareTarget: SELF_BEST_COMPARE,
    },
    {
      label: t("logs.summary.prevVersionOvertakes"),
      value: recordCounts?.prevVersionOvertakes ?? "-",
      color: "text-yellow-400",
      compareTarget: previousVersion,
    },
  ];

  const renderCards = (items: typeof stats | typeof recordStats) =>
    items.map((stat, i) => (
      <DashCard
        key={i}
        className="p-3 md:p-5 flex flex-col items-start justify-center gap-1"
      >
        <LabelWithTooltip
          isSharing={isSharing}
          label={stat.label}
          tooltipText={"tooltip" in stat ? stat.tooltip : undefined}
        />
        <div className="flex w-full items-center justify-between gap-2">
          <div
            className={cn(
              "text-2xl font-bold font-mono leading-tight",
              stat.color,
            )}
          >
            {stat.value}
          </div>
          {"compareTarget" in stat && onOpenList && !isSharing && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 shrink-0 rounded-full border-bpim-border bg-transparent px-3 text-xs font-bold"
              disabled={!stat.compareTarget || stat.value === "-"}
              onClick={() => onOpenList(stat.compareTarget!)}
            >
              {t("logs.summary.openList")}
            </Button>
          )}
        </div>
      </DashCard>
    ));

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">{renderCards(stats)}</div>
      <div className="grid grid-cols-2 gap-2">{renderCards(recordStats)}</div>
    </div>
  );
};
