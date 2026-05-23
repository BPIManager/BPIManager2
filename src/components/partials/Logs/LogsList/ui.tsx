import { useState, useMemo } from "react";
import { useBatchesList } from "@/hooks/batches/useBatchesList";
import type { UpdateLog } from "@/types/logs/batches";
import { LogsCard } from "../LogsCard/ui";
import { LogsGroupSkeleton } from "../LogsCard/skeleton";
import { NoDataAlert } from "../../DashBoard/NoData/ui";
import { CustomPagination } from "../../Pagination/ui";
import Link from "next/link";
import dayjs from "@/lib/dayjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRightLeft } from "lucide-react";

interface Props {
  userId: string | undefined;
  version: string;
  groupedBy: string;
  granularity: string;
}

interface GroupedLog {
  key: string;
  label: string;
  representativeDate: string;
  logs: UpdateLog[];
  totalUpdates: number;
  totalBpiDelta: number;
}

const PAGE_SIZE = 10;

function getGroupKey(date: Date, granularity: string): string {
  const d = dayjs(date).tz();
  if (granularity === "week") return d.startOf("isoWeek").format("YYYY-MM-DD");
  if (granularity === "month") return d.format("YYYY-MM");
  return d.format("YYYY-MM-DD");
}

function getGroupLabel(key: string, granularity: string): string {
  if (granularity === "week") {
    const start = dayjs.tz(key);
    return `${start.format("YYYY年M月D日")}〜${start.endOf("isoWeek").format("M月D日")}`;
  }
  if (granularity === "month") {
    return dayjs.tz(`${key}-01`).format("YYYY年M月");
  }
  return key;
}

function getSummaryPath(
  userId: string,
  version: string,
  granularity: string,
  representativeDate: string,
): string {
  if (granularity === "week")
    return `/users/${userId}/logs/${version}/summary/week/${representativeDate}`;
  if (granularity === "month")
    return `/users/${userId}/logs/${version}/summary/month/${representativeDate}`;
  return `/users/${userId}/logs/${version}/summary/${representativeDate}`;
}

export const LogsList = ({ userId, version, groupedBy, granularity }: Props) => {
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
      const key = getGroupKey(new Date(log.createdAt), granularity);

      if (!groups[key]) {
        groups[key] = {
          key,
          label: getGroupLabel(key, granularity),
          representativeDate: dayjs(log.createdAt).tz().format("YYYY-MM-DD"),
          logs: [],
          totalUpdates: 0,
          totalBpiDelta: 0,
        };
      }

      groups[key].logs.push(log);
      groups[key].totalUpdates += log.songCount || 0;
      groups[key].totalBpiDelta += log.diff || 0;
    });

    return Object.values(groups);
  }, [logs, granularity]);

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

  if (granularity === "version") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="rounded-xl border border-bpim-border bg-bpim-bg/40 p-6 text-center max-w-md w-full">
          <ArrowRightLeft className="mx-auto mb-3 h-8 w-8 text-bpim-primary" />
          <p className="text-sm text-bpim-muted mb-4">
            現バージョンと前作のスコアを比較します
          </p>
          <Button asChild variant="default" className="w-full">
            <Link
              href={`/users/${userId}/logs/${version}/summary/version`}
            >
              バージョン比較を見る
            </Link>
          </Button>
        </div>
      </div>
    );
  }

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
              <div key={group.key} className="relative">
                <div className="relative z-10 mb-4 flex items-center gap-4">
                  <div
                    className="hidden md:block h-3 w-3 shrink-0 rounded-full border-2 border-slate-950 bg-bpim-primary ml-[21px]"
                    aria-hidden="true"
                  />
                  <h2 className="text-xl font-bold tracking-tight text-bpim-text">
                    {group.label}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="px-2 py-0 font-mono text-[10px]"
                  >
                    {group.logs.length} logs
                  </Badge>
                </div>

                {granularity !== "day" ? (
                  <Link
                    href={{
                      pathname: getSummaryPath(
                        userId ?? "",
                        version,
                        granularity,
                        group.representativeDate,
                      ),
                      query: { groupedBy },
                    }}
                    className="block md:ml-12"
                  >
                    <div
                      className={cn(
                        "rounded-xl border border-bpim-border bg-white/[0.02] p-4",
                        "transition-colors hover:bg-bpim-overlay/30 cursor-pointer",
                      )}
                    >
                      <div className="flex gap-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-bpim-muted uppercase tracking-wider">
                            合計更新件数
                          </span>
                          <span className="text-lg font-bold text-bpim-text">
                            {group.totalUpdates}{" "}
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
                              group.totalBpiDelta >= 0
                                ? "text-bpim-success"
                                : "text-bpim-danger",
                            )}
                          >
                            {group.totalBpiDelta >= 0 ? "+" : ""}
                            {group.totalBpiDelta.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <>
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
                              {group.totalUpdates}{" "}
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
                                group.totalBpiDelta >= 0
                                  ? "text-bpim-success"
                                  : "text-bpim-danger",
                              )}
                            >
                              {group.totalBpiDelta >= 0 ? "+" : ""}
                              {group.totalBpiDelta.toFixed(2)}
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
                              pathname: `/users/${userId}/logs/${version}/summary/${group.representativeDate}`,
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
                  </>
                )}
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
