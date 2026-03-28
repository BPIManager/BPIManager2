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
import { CustomPagination } from "../../Pagination/ui";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

const RANKS = ["A1", "A2", "A3", "A4", "A5"] as const;

export const RANK_THRESHOLDS = [
  {
    label: "MAX-",
    ratio: 17 / 18,
    bg: "bg-orange-500",
    text: "text-slate-950",
  },
  { label: "AAA", ratio: 8 / 9, bg: "bg-yellow-400", text: "text-black" },
  { label: "AA", ratio: 7 / 9, bg: "bg-green-400", text: "text-slate-900" },
  { label: "A", ratio: 6 / 9, bg: "bg-bpim-primary", text: "text-slate-900" },
  { label: "B", ratio: 5 / 9, bg: "bg-slate-500", text: "text-bpim-text" },
  { label: "C", ratio: 4 / 9, bg: "bg-bpim-overlay", text: "text-bpim-text" },
  { label: "D", ratio: 3 / 9, bg: "bg-slate-700", text: "text-bpim-text" },
  { label: "E", ratio: 2 / 9, bg: "bg-bpim-surface-2", text: "text-bpim-text" },
  { label: "F", ratio: 0, bg: "bg-bpim-bg", text: "text-bpim-muted" },
] as const;

type SortKey = "title" | (typeof RANKS)[number];
type SortOrder = "asc" | "desc";

export const getRankInfo = (rate: number) => {
  const ratio = rate / 100;
  const rank = RANK_THRESHOLDS.find((t) => ratio >= t.ratio);
  return rank || RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
};

export const ArenaAverageTable = ({ data }: { data: ArenaAverageData[] }) => {
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

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
        valA = a.averages[sortKey]?.rate ?? -1;
        valB = b.averages[sortKey]?.rate ?? -1;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortKey, sortOrder]);

  const visibleData = useMemo(() => {
    return sortedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [sortedData, page]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k)
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3 text-bpim-primary" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-bpim-primary" />
    );
  };

  const ArenaRow = memo(({ item }: { item: ArenaAverageData }) => (
    <TableRow className="group border-bpim-border hover:bg-bpim-overlay/50">
      <TableCell className="sticky left-0 z-10 min-w-[200px] max-w-[250px] bg-bpim-bg p-3 shadow-[2px_0_5px_rgba(0,0,0,0.3)] group-hover:bg-bpim-bg transition-colors">
        <div className="flex flex-col gap-0.5">
          <span className="truncate text-xs font-bold text-bpim-text">
            {item.title}
          </span>
          <span className="text-[10px] font-medium text-bpim-muted uppercase tracking-tighter">
            {item.difficulty}
          </span>
        </div>
      </TableCell>

      {RANKS.map((rankName) => {
        const stats = item.averages[rankName];
        if (!stats) {
          return (
            <TableCell key={rankName} className="text-center text-bpim-subtle">
              -
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
              <span className="font-mono text-xs font-black leading-tight">
                {Math.round(stats.avgExScore)}
              </span>
              <span className="font-mono text-[9px] font-bold opacity-70">
                {stats.rate.toFixed(1)}%
              </span>
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  ));

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
                    楽曲名 <SortIcon k="title" />
                  </div>
                </TableHead>

                {RANKS.map((rank) => (
                  <TableHead
                    key={rank}
                    onClick={() => handleSort(rank)}
                    className="min-w-[85px] cursor-pointer text-center px-2 py-3 text-[10px] font-black uppercase tracking-widest text-bpim-muted hover:text-bpim-text transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span>{rank}</span>
                      <SortIcon k={rank} />
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
