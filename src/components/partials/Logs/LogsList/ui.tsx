import { useState, useMemo } from "react";
import { UpdateLog, useBatchesList } from "@/hooks/batches/useBatchesList";
import { LogsCard } from "../LogsCard/ui";
import { LogsGroupSkeleton } from "../LogsCard/skeleton";
import { NoDataAlert } from "../../DashBoard/NoData";
import { CustomPagination } from "../../Pagination/ui";
import Link from "next/link";
import dayjs from "@/lib/dayjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  userId: string | undefined;
  version: string;
  groupedBy: string;
}

interface GroupedLog {
  date: string;
  logs: UpdateLog[];
  dayTotalUpdates: number;
  dayTotalBpiDelta: number;
}

const PAGE_SIZE = 10;

export const LogsList = ({ userId, version, groupedBy }: Props) => {
  const [page, setPage] = useState(1);
  const { logs, isLoading, isError } = useBatchesList(
    userId,
    version,
    groupedBy,
  );

  const groupedLogs = useMemo(() => {
    if (!logs) return [];

    const groups: Record<string, GroupedLog> = {};

    logs.forEach((log) => {
      const date = dayjs(log.createdAt).tz().format("YYYY-MM-DD");

      if (!groups[date]) {
        groups[date] = {
          date,
          logs: [],
          dayTotalUpdates: 0,
          dayTotalBpiDelta: 0,
        };
      }

      groups[date].logs.push(log);
      groups[date].dayTotalUpdates += log.songCount || 0;
      groups[date].dayTotalBpiDelta += log.diff || 0;
    });

    return Object.values(groups);
  }, [logs]);

  const displayGroups = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return groupedLogs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [groupedLogs, page]);

  if (isError)
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-bpim-danger font-bold">読み込みに失敗しました</p>
      </div>
    );

  if (!isLoading && logs?.length === 0) {
    return <NoDataAlert />;
  }

  return (
    <div className="relative min-h-[50vh] pb-24">
      <div className="relative flex flex-col gap-10 p-4">
        <div
          className="absolute left-10 top-10 bottom-24 w-0.5 bg-bpim-surface-2 hidden md:block"
          aria-hidden="true"
        />

        {isLoading
          ? [...new Array(3)].map((_, i) => <LogsGroupSkeleton key={i} />)
          : displayGroups.map((group) => (
              <div key={group.date} className="relative">
                <div className="relative z-10 mb-4 flex items-center gap-4">
                  <div
                    className="hidden md:block h-3 w-3 shrink-0 rounded-full border-2 border-slate-950 bg-bpim-primary ml-[21px]"
                    aria-hidden="true"
                  />
                  <h2 className="text-xl font-bold tracking-tight text-bpim-text">
                    {group.date}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="px-2 py-0 font-mono text-[10px]"
                  >
                    {group.logs.length} logs
                  </Badge>
                </div>

                <div
                  className={cn(
                    "mb-4 rounded-xl border border-bpim-border bg-white/[0.02] p-4",
                    "md:ml-12",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-bpim-muted uppercase tracking-wider">
                          合計更新件数
                        </span>
                        <span className="text-lg font-bold text-bpim-text">
                          {group.dayTotalUpdates}{" "}
                          <span className="text-xs font-normal text-bpim-muted">
                            songs
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-bpim-muted uppercase tracking-wider">
                          BPI上昇幅計
                        </span>
                        <span
                          className={cn(
                            "text-lg font-bold",
                            group.dayTotalBpiDelta >= 0
                              ? "text-bpim-success"
                              : "text-bpim-danger",
                          )}
                        >
                          {group.dayTotalBpiDelta >= 0 ? "+" : ""}
                          {group.dayTotalBpiDelta.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full border-bpim-border hover:bg-bpim-overlay/50"
                    >
                      <Link
                        href={{
                          pathname: `/users/${userId}/logs/${version}/summary/${group.date}`,
                          query: { groupedBy },
                        }}
                      >
                        詳細を見る
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:ml-12">
                  {group.logs.map((log) => (
                    <LogsCard key={log.batchId} log={log} />
                  ))}
                </div>
              </div>
            ))}
      </div>

      {!isLoading && groupedLogs.length > PAGE_SIZE && (
        <div className="mt-8">
          <CustomPagination
            count={groupedLogs.length}
            pageSize={PAGE_SIZE}
            page={page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};
