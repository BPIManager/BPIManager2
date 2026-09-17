import { DashCard } from "@/components/ui/dashcard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getRankInfo } from "@/components/partials/common/Charts/ArenaAverage/ui";
import { useTranslation } from "@/hooks/common/useTranslation";
import { ARENA_MOCK_DATA } from "../mocks";

const RANK_COLUMNS = ["A1", "A3", "A5"] as const;

export const MockArenaAverage = () => {
  const { t } = useTranslation();

  return (
    <DashCard>
      <h3 className="mb-4 text-xs font-bold uppercase text-bpim-muted">
        {t("login.showcase.arena.chartTitle")}
      </h3>
      <div className="overflow-hidden rounded-lg border border-bpim-border">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-bpim-border hover:bg-transparent">
              <TableHead className="bg-bpim-bg px-2 py-2 text-[9px] font-black uppercase tracking-widest text-bpim-muted">
                {t("arenaAverage.songTitle")}
              </TableHead>
              {RANK_COLUMNS.map((rank) => (
                <TableHead
                  key={rank}
                  className="px-1 py-2 text-center text-[9px] font-black uppercase tracking-widest text-bpim-muted"
                >
                  {rank}
                </TableHead>
              ))}
              <TableHead className="border-l border-bpim-primary/30 bg-bpim-primary/8 px-2 py-2 text-center text-[9px] font-black uppercase tracking-widest text-bpim-primary">
                {t("login.showcase.arena.myScore")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ARENA_MOCK_DATA.map((row) => {
              const myRate = (row.you / row.maxScore) * 100;
              const myRankInfo = getRankInfo(myRate);
              return (
                <TableRow
                  key={row.title}
                  className="border-bpim-border hover:bg-bpim-overlay/50"
                >
                  <TableCell className="p-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="truncate text-[11px] font-bold text-bpim-text">
                        {row.title}
                      </span>
                      <span className="text-[9px] font-medium uppercase tracking-tighter text-bpim-muted">
                        {row.difficulty}
                      </span>
                    </div>
                  </TableCell>
                  {RANK_COLUMNS.map((rank) => {
                    const avgScore = row.ranks[rank];
                    const rate = (avgScore / row.maxScore) * 100;
                    const rankInfo = getRankInfo(rate);
                    return (
                      <TableCell
                        key={rank}
                        className={cn(
                          "px-1 py-1.5 text-center",
                          rankInfo.bg,
                          rankInfo.text,
                        )}
                      >
                        <div className="flex flex-col items-center gap-0">
                          <span className="font-mono text-[11px] font-black leading-tight">
                            {avgScore}
                          </span>
                          <span className="font-mono text-[8px] font-bold opacity-70">
                            {rate.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell
                    className={cn(
                      "border-l border-bpim-primary/30 px-1 py-1.5 text-center",
                      myRankInfo.bg,
                      myRankInfo.text,
                    )}
                  >
                    <div className="flex flex-col items-center gap-0">
                      <span className="font-mono text-[11px] font-black leading-tight">
                        {row.you}
                      </span>
                      <span className="font-mono text-[8px] font-bold opacity-70">
                        {myRate.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </DashCard>
  );
};
