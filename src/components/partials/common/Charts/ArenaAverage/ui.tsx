"use client";

import { useState, useMemo, memo } from "react";
import { ArenaAverageData } from "@/types/metrics/arena";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomPagination from "@/components/partials/common/ListControls/Pagination/ui";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { A_RANKS } from "@/constants/iidx/arenaRanks";
import { RANK_THRESHOLDS } from "@/constants/theme/rankThreshold";
import { useTranslation } from "@/hooks/common/useTranslation";

export type DisplayMetric = "exScore" | "rate" | "bpi";

type SortKey = "title" | (typeof A_RANKS)[number];
type SortOrder = "asc" | "desc";

export const getRankInfo = (rate: number) => {
  const ratio = rate / 100;
  const rank = RANK_THRESHOLDS.find((t) => ratio >= t.ratio);
  return rank || RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
};

const getBpiColor = (bpi: number): { bg: string; text: string } => {
  if (bpi >= 100) return { bg: "bg-orange-500", text: "text-slate-950" };
  if (bpi >= 50) return { bg: "bg-yellow-400", text: "text-black" };
  if (bpi >= 20) return { bg: "bg-green-400", text: "text-slate-900" };
  if (bpi >= 0) return { bg: "bg-bpim-primary", text: "text-slate-900" };
  return { bg: "bg-slate-600", text: "text-bpim-text" };
};

const SortIcon = ({
  k,
  sortKey,
  sortOrder,
}: {
  k: SortKey;
  sortKey: SortKey;
  sortOrder: SortOrder;
}) => {
  if (sortKey !== k) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
  return sortOrder === "asc" ? (
    <ChevronUp className="ml-1 h-3 w-3 text-bpim-primary" />
  ) : (
    <ChevronDown className="ml-1 h-3 w-3 text-bpim-primary" />
  );
};

const ArenaRow = memo(function ArenaRow({
    item,
    displayMetric,
  }: {
    item: ArenaAverageData;
    displayMetric: DisplayMetric;
  }) {
  return (
    <TableRow className="group border-bpim-border hover:bg-bpim-overlay/50">
      <TableCell className="sticky left-0 z-10 min-w-50 max-w-62.5 bg-bpim-bg p-3 shadow-[2px_0_5px_rgba(0,0,0,0.3)] group-hover:bg-bpim-bg transition-colors">
        <div className="flex flex-col gap-0.5">
          <span className="truncate text-xs font-bold text-bpim-text">
            {item.title}
          </span>
          <span className="text-[10px] font-medium text-bpim-muted uppercase tracking-tighter">
            {item.difficulty}
          </span>
        </div>
      </TableCell>

      {A_RANKS.map((rankName) => {
        const stats = item.averages[rankName];
        if (!stats) {
          return (
            <TableCell key={rankName} className="text-center text-bpim-subtle">
              -
            </TableCell>
          );
        }

        if (displayMetric === "bpi") {
          const bpi = stats.avgBpi;
          if (bpi === undefined) {
            return (
              <TableCell key={rankName} className="text-center text-bpim-subtle">
                -
              </TableCell>
            );
          }
          const { bg, text } = getBpiColor(bpi);
          return (
            <TableCell
              key={rankName}
              className={cn(
                "text-center py-2 px-1 transition-opacity hover:opacity-80",
                bg,
                text,
              )}
            >
              <span className="font-mono text-xs font-black leading-tight">
                {bpi.toFixed(1)}
              </span>
            </TableCell>
          );
        }

        const rankInfo = getRankInfo(stats.rate);
        return (
          <TableCell
            key={rankName}
            className={cn(
              "text-center py-2 px-1 transition-opacity hover:opacity-80",
              rankInfo.bg,
              rankInfo.text,
            )}
          >
            <div className="flex flex-col items-center gap-0">
              {displayMetric === "exScore" ? (
                <>
                  <span className="font-mono text-xs font-black leading-tight">
                    {Math.round(stats.avgExScore)}
                  </span>
                  <span className="font-mono text-[9px] font-bold opacity-70">
                    {stats.rate.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono text-xs font-black leading-tight">
                    {stats.rate.toFixed(1)}%
                  </span>
                  <span className="font-mono text-[9px] font-bold opacity-70">
                    {Math.round(stats.avgExScore)}
                  </span>
                </>
              )}
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
});


const ArenaAverageTable = ({
  data,
  displayMetric = "exScore",
}: {
  data: ArenaAverageData[];
  displayMetric?: DisplayMetric;
}) => {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);
  const [prevData, setPrevData] = useState(data);
  const PAGE_SIZE = 50;

  if (data !== prevData) {
    setPrevData(data);
    setPage(1);
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortKey === "title") {
        valA = a.title;
        valB = b.title;
      } else {
        const statsA = a.averages[sortKey];
        const statsB = b.averages[sortKey];
        if (displayMetric === "bpi") {
          valA = statsA?.avgBpi ?? -999;
          valB = statsB?.avgBpi ?? -999;
        } else {
          valA = statsA?.rate ?? -1;
          valB = statsB?.rate ?? -1;
        }
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortKey, sortOrder, displayMetric]);

  const visibleData = useMemo(() => {
    return sortedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [sortedData, page]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl border border-bpim-border bg-bpim-bg shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <Table className="border-collapse">
            <TableHeader className="bg-bpim-bg/80 sticky top-0 z-20 backdrop-blur-md">
              <TableRow className="hover:bg-transparent border-bpim-border">
                <TableHead
                  onClick={() => handleSort("title")}
                  className="sticky left-0 z-30 cursor-pointer bg-bpim-bg px-3 text-[10px] font-black uppercase tracking-widest text-bpim-muted hover:text-bpim-text"
                >
                  <div className="flex items-center">
                    {t("arenaAverage.songTitle")}{" "}
                    <SortIcon k="title" sortKey={sortKey} sortOrder={sortOrder} />
                  </div>
                </TableHead>

                {A_RANKS.map((rank) => (
                  <TableHead
                    key={rank}
                    onClick={() => handleSort(rank)}
                    className="min-w-21.25 cursor-pointer text-center px-2 py-3 text-[10px] font-black uppercase tracking-widest text-bpim-muted hover:text-bpim-text transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span>{rank}</span>
                      <SortIcon k={rank} sortKey={sortKey} sortOrder={sortOrder} />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {visibleData.map((item) => (
                <ArenaRow
                  key={`${item.title}-${item.difficulty}`}
                  item={item}
                  displayMetric={displayMetric}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-center py-4">
        <CustomPagination
          count={sortedData.length}
          pageSize={PAGE_SIZE}
          page={page}
          onPageChange={(p: number) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          isSticky={true}
        />
      </div>
    </div>
  );
};

export default ArenaAverageTable;
