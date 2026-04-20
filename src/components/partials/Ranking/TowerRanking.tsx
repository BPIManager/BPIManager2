"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { List, useListRef } from "react-window";
import type { RowComponentProps } from "react-window";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useIidxTowerRanking } from "@/hooks/stats/useIidxTowerRanking";
import { TowerRankingRow } from "./TowerRankingRow";
import { Skeleton } from "@/components/ui/skeleton";
import { RivalComparisonModal } from "../UserList/Modal";
import type {
  TowerPeriod,
  TowerType,
  TowerRankingEntry,
} from "@/types/users/ranking";

const ITEM_SIZE = 58;

const PERIODS: { value: TowerPeriod; label: string }[] = [
  { value: "day", label: "日別" },
  { value: "week", label: "週別" },
  { value: "month", label: "月別" },
];

const TOWER_TYPES: { value: TowerType; label: string }[] = [
  { value: "total", label: "総合" },
  { value: "key", label: "鍵盤" },
  { value: "scratch", label: "スクラッチ" },
];

function getPeriodRange(
  period: TowerPeriod,
  date: string,
): { startDate: string; endDate: string; label: string } {
  const d = dayjs(date);
  if (period === "week") {
    const dow = d.day();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = d.add(mondayOffset, "day");
    const sunday = monday.add(6, "day");
    return {
      startDate: monday.format("YYYY-MM-DD"),
      endDate: sunday.format("YYYY-MM-DD"),
      label: `${monday.format("YYYY/MM/DD")} 〜 ${sunday.format("MM/DD")}`,
    };
  }
  if (period === "month") {
    return {
      startDate: d.startOf("month").format("YYYY-MM-DD"),
      endDate: d.endOf("month").format("YYYY-MM-DD"),
      label: `${d.format("YYYY年M月")}`,
    };
  }
  return {
    startDate: date,
    endDate: date,
    label: d.format("YYYY/MM/DD"),
  };
}

function navigateDate(
  period: TowerPeriod,
  date: string,
  direction: -1 | 1,
): string {
  const d = dayjs(date);
  if (period === "day") return d.add(direction, "day").format("YYYY-MM-DD");
  if (period === "week")
    return d.add(direction * 7, "day").format("YYYY-MM-DD");
  return d.add(direction, "month").format("YYYY-MM-DD");
}

function isNextDisabled(period: TowerPeriod, date: string): boolean {
  const today = dayjs().format("YYYY-MM-DD");
  const next = navigateDate(period, date, 1);
  const { startDate } = getPeriodRange(period, next);
  return startDate > today;
}

interface RowData {
  rankings: TowerRankingEntry[];
  onRowClick: (userId: string) => void;
}

const VirtualRow = ({
  index,
  style,
  ariaAttributes,
  rankings,
  onRowClick,
}: RowComponentProps<RowData>) => {
  const entry = rankings[index];
  return (
    <div
      style={{
        ...style,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 3,
        paddingBottom: 3,
      }}
      {...ariaAttributes}
    >
      <TowerRankingRow entry={entry} onClick={onRowClick} />
    </div>
  );
};

interface TowerRankingProps {
  version: string;
}

export const TowerRanking = ({ version }: TowerRankingProps) => {
  const router = useRouter();
  const today = dayjs().format("YYYY-MM-DD");

  const period = ((router.query.towerPeriod as string) || "day") as TowerPeriod;
  const towerType = ((router.query.towerType as string) ||
    "total") as TowerType;
  const selectedDate = (router.query.towerDate as string) || today;

  const { startDate, endDate, label } = getPeriodRange(period, selectedDate);

  const { data, isLoading } = useIidxTowerRanking({
    version,
    period,
    date: selectedDate,
  });

  const sortedRankings = useMemo(() => {
    if (!data) return [];
    const sorted = [...data.rankings].sort((a, b) => {
      const av =
        towerType === "key"
          ? a.keyCount
          : towerType === "scratch"
            ? a.scratchCount
            : a.totalCount;
      const bv =
        towerType === "key"
          ? b.keyCount
          : towerType === "scratch"
            ? b.scratchCount
            : b.totalCount;
      return bv - av;
    });
    return sorted.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [data, towerType]);

  const selfRank = useMemo(
    () => sortedRankings.find((e) => e.isSelf)?.rank ?? 0,
    [sortedRankings],
  );

  const listRef = useListRef(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    hasScrolled.current = false;
  }, [period, selectedDate, towerType]);

  useEffect(() => {
    if (sortedRankings.length > 0 && !hasScrolled.current) {
      const selfIndex = sortedRankings.findIndex((e) => e.isSelf);
      if (selfIndex >= 0) {
        hasScrolled.current = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            listRef.current?.scrollToRow({ index: selfIndex, align: "center" });
          });
        });
      }
    }
  }, [sortedRankings, listRef]);

  const pushQuery = (patch: Record<string, string>) => {
    router.push({ query: { ...router.query, ...patch } }, undefined, {
      shallow: true,
    });
  };

  const handlePeriodChange = (p: TowerPeriod) => {
    pushQuery({ towerPeriod: p, towerDate: today });
  };

  const handleTypeChange = (t: TowerType) => {
    pushQuery({ towerType: t });
  };

  const handleDateChange = (d: string) => {
    if (d > today) return;
    pushQuery({ towerDate: d });
  };

  const handlePrev = () => {
    pushQuery({ towerDate: navigateDate(period, selectedDate, -1) });
  };

  const handleNext = () => {
    if (!isNextDisabled(period, selectedDate)) {
      pushQuery({ towerDate: navigateDate(period, selectedDate, 1) });
    }
  };

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  }, []);

  const rowProps: RowData = {
    rankings: sortedRankings,
    onRowClick: handleRowClick,
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
          Period
        </label>
        <div className="flex rounded-lg border border-bpim-border overflow-hidden">
          {PERIODS.map((p, i) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePeriodChange(p.value)}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold transition-colors",
                i > 0 && "border-l border-bpim-border",
                period === p.value
                  ? "bg-bpim-primary text-white"
                  : "bg-bpim-surface-2/40 text-bpim-muted hover:bg-bpim-overlay/50",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
          Type
        </label>
        <div className="flex rounded-lg border border-bpim-border overflow-hidden">
          {TOWER_TYPES.map((t, i) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold transition-colors",
                i > 0 && "border-l border-bpim-border",
                towerType === t.value
                  ? "bg-bpim-primary text-white"
                  : "bg-bpim-surface-2/40 text-bpim-muted hover:bg-bpim-overlay/50",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 border-bpim-border bg-bpim-surface-2/40"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 flex items-center justify-center">
          {period === "day" ? (
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full rounded-md border border-bpim-border bg-bpim-surface-2/40 px-2 py-1 text-center text-xs font-bold text-bpim-text focus:outline-none focus:ring-1 focus:ring-bpim-primary"
            />
          ) : (
            <span className="text-xs font-bold text-bpim-text">{label}</span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 border-bpim-border bg-bpim-surface-2/40"
          onClick={handleNext}
          disabled={isNextDisabled(period, selectedDate)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {selfRank > 0 && (
        <div className="rounded-xl border border-bpim-muted/20 bg-bpim-overlay/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-md text-bpim-muted">
              全 {data?.totalCount ?? 0} 人中
            </p>
            <div className="text-right">
              <span className="text-xs text-bpim-muted">現在の順位</span>
              <div className="font-mono text-xl font-bold text-bpim-text">
                <span className="text-bpim-primary">{selfRank}</span>
                <span className="ml-0.5 text-sm">位</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-13 w-full rounded-lg" />
          ))}
        </div>
      ) : sortedRankings.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-bpim-border py-12 text-sm text-bpim-muted">
          この期間のデータはありません
        </div>
      ) : (
        <List
          listRef={listRef}
          rowComponent={VirtualRow}
          rowCount={sortedRankings.length}
          rowHeight={ITEM_SIZE}
          rowProps={rowProps}
          defaultHeight={500}
          overscanCount={5}
          className="rounded-xl border border-bpim-border"
          style={{ height: "calc(100svh - 480px)", minHeight: "300px" }}
        />
      )}

      {selectedUserId && (
        <RivalComparisonModal
          rivalId={selectedUserId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          viewerRadar={data?.viewerRadar ?? {}}
        />
      )}
    </div>
  );
};
