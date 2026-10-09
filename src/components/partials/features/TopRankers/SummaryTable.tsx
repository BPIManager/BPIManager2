"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  TOP_RANKER_VERSIONS,
  getTopRankerAreaName,
} from "@/constants/iidx/topRankerAreas";
import { Tabs } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AppTabsGroup } from "@/components/ui/complex/tabs";
import { cn } from "@/lib/utils";
import { clickableProps } from "@/utils/common/clickableProps";
import { useTranslation } from "@/hooks/common/useTranslation";
import { toSegments, type BreakdownMode } from "./breakdown";
import type { AreaSummaryRow, CountBreakdown } from "./summary";

interface SummaryTableProps {
  rows: AreaSummaryRow[];
  /** 下の一覧で選択中のバージョン・エリア */
  currentVersion: string;
  currentAreaId: number | null;
  onSelectVersion: (version: string, areaId: number) => void;
}

/** 内訳を色付きセグメントで積み上げたバー。全体の長さは`ratio`(0〜1)で決まり、ホバーで内訳を一覧表示する */
const BreakdownBar = ({
  breakdown,
  mode,
  ratio,
  unit,
  className,
}: {
  breakdown: CountBreakdown;
  mode: BreakdownMode;
  ratio: number;
  unit: string;
  className?: string;
}) => {
  const segments = toSegments(breakdown, mode);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "h-2 overflow-hidden rounded-full bg-bpim-overlay",
            className,
          )}
        >
          <div
            className="flex h-full overflow-hidden rounded-full"
            style={{ width: `${ratio * 100}%` }}
          >
            {segments.map((seg) => (
              <div
                key={seg.key}
                className="h-full"
                style={{
                  flexGrow: seg.count,
                  flexBasis: 0,
                  backgroundColor: seg.color,
                }}
              />
            ))}
          </div>
        </div>
      </TooltipTrigger>
      {segments.length > 0 && (
        <TooltipContent side="top" className="flex-col items-stretch gap-1">
          {segments.map((seg) => (
            <span key={seg.key} className="flex items-center gap-2 font-mono">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="flex-1 text-bpim-muted">{seg.name}</span>
              <span className="font-bold text-bpim-text">
                {seg.count}
                {unit}
              </span>
            </span>
          ))}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

const Legend = ({
  rows,
  mode,
}: {
  rows: AreaSummaryRow[];
  mode: BreakdownMode;
}) => {
  const present = new Set(
    rows.flatMap((r) => toSegments(r.breakdown, mode).map((seg) => seg.key)),
  );
  const items = toSegments(rows[0].breakdown, mode, true).filter((seg) =>
    present.has(seg.key),
  );
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((seg) => (
        <span
          key={seg.key}
          className="flex items-center gap-1 text-[10px] font-bold text-bpim-muted"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: seg.color }}
          />
          {seg.label}
        </span>
      ))}
    </div>
  );
};

const SummaryTable = ({
  rows,
  currentVersion,
  currentAreaId,
  onSelectVersion,
}: SummaryTableProps) => {
  const { t } = useTranslation();
  const [openAreaId, setOpenAreaId] = useState<number | null>(null);
  const [mode, setMode] = useState<BreakdownMode>("level");
  const unit = t("topRankers.summary.unit");
  const max = rows[0]?.total ?? 1;

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-bpim-muted">
        {t("topRankers.summary.empty")}
      </p>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Legend rows={rows} mode={mode} />
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as BreakdownMode)}
            className="w-40"
          >
            <AppTabsGroup
              visual="flat"
              tabs={[
                { value: "level", label: t("topRankers.breakdown.level") },
                {
                  value: "difficulty",
                  label: t("topRankers.breakdown.difficulty"),
                },
              ]}
            />
          </Tabs>
        </div>

        <div className="overflow-x-clip">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bpim-border text-xs text-bpim-muted">
                <th className="py-2 pr-3 text-left font-bold">
                  {t("topRankers.summary.area")}
                </th>
                <th className="py-2 pr-3 text-right font-bold">
                  {t("topRankers.summary.total")}
                </th>
                <th className="py-2 text-right font-bold">
                  {t("topRankers.summary.bestVersion")}
                </th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isOpen = openAreaId === row.areaId;
                return (
                  <Fragment key={row.areaId}>
                    <tr
                      {...clickableProps(() =>
                        setOpenAreaId(isOpen ? null : row.areaId),
                      )}
                      aria-expanded={isOpen}
                      className="cursor-pointer border-b border-bpim-border/50 transition-colors duration-200 hover:bg-bpim-overlay"
                    >
                      <td className="py-2 pr-3 font-bold text-bpim-text">
                        {getTopRankerAreaName(row.areaId)}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center justify-end gap-2 font-mono">
                          <BreakdownBar
                            breakdown={row.breakdown}
                            mode={mode}
                            ratio={row.total / max}
                            unit={unit}
                            className="hidden w-24 sm:block"
                          />
                          <span className="min-w-12 text-right text-bpim-text">
                            {row.total}
                            {unit}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-right font-mono text-bpim-text">
                        IIDX{row.bestVersion}
                        <span className="ml-1 text-bpim-muted">
                          ({row.bestCount}
                          {unit})
                        </span>
                      </td>
                      <td className="py-2 pl-2">
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-bpim-muted transition-transform duration-200",
                            isOpen && "rotate-180",
                          )}
                        />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-bpim-border/50 bg-bpim-surface">
                        <td colSpan={4} className="p-3">
                          <div className="flex flex-col gap-2">
                            {TOP_RANKER_VERSIONS.map((v) => {
                              const count = row.byVersion[v] ?? 0;
                              const isCurrent =
                                v === currentVersion &&
                                row.areaId === currentAreaId;
                              return (
                                <div
                                  key={v}
                                  {...clickableProps(() =>
                                    onSelectVersion(v, row.areaId),
                                  )}
                                  aria-current={isCurrent}
                                  className={cn(
                                    "flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 font-mono transition-colors duration-200 hover:bg-bpim-overlay",
                                    isCurrent &&
                                      "border-bpim-primary bg-bpim-bg/40",
                                  )}
                                >
                                  <span className="w-8 text-xs text-bpim-muted">
                                    v{v}
                                  </span>
                                  <BreakdownBar
                                    breakdown={
                                      row.breakdownByVersion[v] ?? {
                                        byLevel: {},
                                        byDifficulty: {},
                                      }
                                    }
                                    mode={mode}
                                    ratio={count / row.bestCount}
                                    unit={unit}
                                    className="flex-1"
                                  />
                                  <span className="min-w-12 text-right text-sm font-bold text-bpim-text">
                                    {count}
                                    {unit}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SummaryTable;
