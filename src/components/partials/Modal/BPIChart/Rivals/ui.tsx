"use client";

import { useEffect, useMemo, useRef } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalScores } from "@/hooks/social/useRivalScores";
import { useSongRanking } from "@/hooks/stats/useSongRanking";
import { SongWithScore } from "@/types/songs/score";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { List, ListImperativeAPI } from "react-window";
import { SongRankingEntry } from "@/types/users/ranking";

interface RivalRankingProps {
  version: string;
  songId: number;
  myScore?: SongWithScore;
  onNavigate: (userId: string) => void;
}

export const RivalRankingBody = ({
  version,
  songId,
  myScore,
  onNavigate,
}: RivalRankingProps) => {
  const { fbUser } = useUser();
  const { data, isLoading } = useRivalScores(songId, version);

  const ranking = useMemo(() => {
    if (!data?.rivals) return myScore ? [{ ...myScore, isSelf: true }] : [];

    const combined = [...data.rivals];
    if (myScore && !combined.some((r) => r.userId === fbUser?.uid)) {
      combined.push({ ...myScore, isSelf: true });
    }
    return combined.sort((a, b) => (b.exScore || 0) - (a.exScore || 0));
  }, [data, myScore, fbUser?.uid]);

  if (isLoading) {
    return <SectionLoader className="py-8" color="text-bpim-info" />;
  }

  return (
    <div className="w-full overflow-hidden rounded-md border border-bpim-border">
      <div className="grid grid-cols-[40px_1fr_auto_52px] items-center border-b border-bpim-border bg-bpim-surface-2 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
          #
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
          Player
        </span>
        <span className="mr-2 text-right text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
          EX / BPI
        </span>
        <span className="text-right text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
          Diff
        </span>
      </div>

      <div className="max-h-[40svh] overflow-y-auto overscroll-contain custom-scrollbar">
        {ranking.map((row, index) => {
          const isSelf = !!row.isSelf;
          const diff = myScore
            ? (row.exScore || 0) - (myScore.exScore || 0)
            : 0;

          return (
            <div
              key={row.userId}
              onClick={() => !isSelf && onNavigate(row.userId)}
              className={cn(
                "grid grid-cols-[40px_1fr_auto_52px] items-center border-b border-bpim-border px-3 py-2.5 transition-colors last:border-b-0",
                isSelf
                  ? "bg-bpim-primary-dim/30 hover:bg-bpim-primary-dim/40"
                  : "cursor-pointer hover:bg-bpim-overlay/50",
              )}
            >
              <span
                className={cn(
                  "font-mono text-xs font-bold",
                  index < 3 ? "text-yellow-500" : "text-bpim-muted",
                )}
              >
                #{index + 1}
              </span>

              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-6 w-6 shrink-0 border border-bpim-border">
                  <AvatarImage src={row.profileImage ?? ""} />
                  <AvatarFallback className="text-[9px]">
                    {row.userName?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate text-xs tracking-tight text-bpim-text",
                      isSelf ? "font-bold" : "font-medium",
                    )}
                  >
                    {row.userName}
                  </p>
                  {isSelf && (
                    <p className="text-[9px] font-bold leading-none text-bpim-primary">
                      あなた
                    </p>
                  )}
                </div>
              </div>

              <div className="mr-2 flex flex-col items-end gap-0.5">
                <span className="font-mono text-xs font-bold text-bpim-text">
                  {row.exScore ?? 0}
                </span>
                <span className="font-mono text-[10px] text-bpim-muted">
                  {row.bpi?.toFixed(1) ?? "-"}
                </span>
              </div>

              <span
                className={cn(
                  "text-right font-mono text-xs font-bold",
                  diff > 0
                    ? "text-bpim-danger"
                    : diff < 0
                      ? "text-bpim-success"
                      : "text-bpim-subtle",
                )}
              >
                {diff > 0 ? `+${diff}` : diff === 0 ? "-" : diff}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ITEM_HEIGHT = 48;

interface GlobalRowProps {
  rankings: SongRankingEntry[];
  myScore?: SongWithScore;
  onNavigate: (userId: string) => void;
}

const GlobalRow = ({
  index,
  style,
  rankings,
  myScore,
  onNavigate,
}: GlobalRowProps & {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
}) => {
  const row = rankings[index];
  if (!row) return null;
  const isSelf = row.isSelf;
  const diff = myScore ? (row.exScore || 0) - (myScore.exScore || 0) : 0;

  return (
    <div
      style={style}
      onClick={() => !isSelf && onNavigate(row.userId)}
      className={cn(
        "grid grid-cols-[40px_1fr_auto_52px] items-center border-b border-bpim-border px-3 transition-colors last:border-b-0",
        isSelf
          ? "bg-bpim-primary-dim/30 hover:bg-bpim-primary-dim/40"
          : "cursor-pointer hover:bg-bpim-overlay/50",
      )}
    >
      <span
        className={cn(
          "font-mono text-xs font-bold",
          row.rank <= 3 ? "text-yellow-500" : "text-bpim-muted",
        )}
      >
        #{row.rank}
      </span>

      <div className="flex min-w-0 items-center gap-2">
        <Avatar className="h-6 w-6 shrink-0 border border-bpim-border">
          <AvatarImage src={row.profileImage ?? ""} />
          <AvatarFallback className="text-[9px]">
            {row.userName?.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-xs tracking-tight text-bpim-text",
              isSelf ? "font-bold" : "font-medium",
            )}
          >
            {row.userName === "-" ? "非公開ユーザー" : row.userName}
          </p>
          {isSelf && (
            <p className="text-[9px] font-bold leading-none text-bpim-primary">
              あなた
            </p>
          )}
        </div>
      </div>

      <div className="mr-2 flex flex-col items-end gap-0.5">
        <span className="font-mono text-xs font-bold text-bpim-text">
          {row.exScore ?? 0}
        </span>
        <span className="font-mono text-[10px] text-bpim-muted">
          {row.bpi?.toFixed(1) ?? "-"}
        </span>
      </div>

      <span
        className={cn(
          "text-right font-mono text-xs font-bold",
          diff > 0
            ? "text-bpim-danger"
            : diff < 0
              ? "text-bpim-success"
              : "text-bpim-subtle",
        )}
      >
        {diff > 0 ? `+${diff}` : diff === 0 ? "-" : diff}
      </span>
    </div>
  );
};
GlobalRow.displayName = "GlobalRow";

export const GlobalRankingBody = ({
  version,
  songId,
  myScore,
  onNavigate,
}: RivalRankingProps) => {
  const { data, isLoading } = useSongRanking(songId, version);
  const listRef = useRef<ListImperativeAPI>(null);

  useEffect(() => {
    if (!data || !listRef.current) return;
    const selfIndex = data.rankings.findIndex((r) => r.isSelf);
    if (selfIndex < 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToRow({ align: "center", index: selfIndex });
    }, 50);
    return () => clearTimeout(timer);
  }, [data]);

  if (isLoading) {
    return <SectionLoader className="py-8" color="text-bpim-info" />;
  }

  if (!data) return null;

  const { rankings, totalCount, selfRank } = data;

  return (
    <div className="flex flex-col gap-4">
      {selfRank > 0 && (
        <div className="rounded-xl border border-bpim-muted/20 bg-bpim-overlay/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-md text-bpim-muted">全 {totalCount} 人中</p>
            </div>
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

      <div className="w-full overflow-hidden rounded-md border border-bpim-border">
        <div className="grid grid-cols-[40px_1fr_auto_52px] items-center border-b border-bpim-border bg-bpim-surface-2 px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
            #
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
            Player
          </span>
          <span className="mr-2 text-right text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
            EX / BPI
          </span>
          <span className="text-right text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
            Diff
          </span>
        </div>

        <List
          listRef={listRef}
          rowCount={rankings.length}
          rowHeight={ITEM_HEIGHT}
          rowComponent={GlobalRow}
          rowProps={{ rankings, myScore, onNavigate }}
          style={{ height: "40svh" }}
          className="overscroll-contain custom-scrollbar"
        />
      </div>
    </div>
  );
};
