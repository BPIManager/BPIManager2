"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  TOP_RANKER_VERSIONS,
  getTopRankerAreaName,
} from "@/constants/iidx/topRankerAreas";
import { cn } from "@/lib/utils";
import { clickableProps } from "@/utils/common/clickableProps";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { AreaSummaryRow } from "./summary";

interface SummaryTableProps {
  rows: AreaSummaryRow[];
  /** 下の一覧で選択中のバージョン */
  currentVersion: string;
  onSelectVersion: (version: string) => void;
}

const SummaryTable = ({
  rows,
  currentVersion,
  onSelectVersion,
}: SummaryTableProps) => {
  const { t } = useTranslation();
  const [openAreaId, setOpenAreaId] = useState<number | null>(null);
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
                      <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-bpim-overlay sm:block">
                        <div
                          className="h-full rounded-full bg-bpim-primary"
                          style={{ width: `${(row.total / max) * 100}%` }}
                        />
                      </div>
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
                          return (
                            <div
                              key={v}
                              {...clickableProps(() => onSelectVersion(v))}
                              aria-current={v === currentVersion}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 font-mono transition-colors duration-200 hover:bg-bpim-overlay",
                                v === currentVersion &&
                                  "border-bpim-primary bg-bpim-bg/40",
                              )}
                            >
                              <span className="w-8 text-xs text-bpim-muted">
                                v{v}
                              </span>
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bpim-overlay">
                                <div
                                  className="h-full rounded-full bg-bpim-primary"
                                  style={{
                                    width: `${(count / row.bestCount) * 100}%`,
                                  }}
                                />
                              </div>
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
  );
};

export default SummaryTable;
