"use client";

import { useMemo } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalScores } from "@/hooks/social/useRivalScores";
import { SongWithScore } from "@/types/songs/score";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { SectionLoader } from "@/components/ui/loading-spinner";

interface RivalRankingProps {
  version: string;
  songId: number;
  myScore?: SongWithScore;
}

export const RivalRankingBody = ({
  version,
  songId,
  myScore,
}: RivalRankingProps) => {
  const { fbUser } = useUser();
  const router = useRouter();
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
    return (
      <SectionLoader className="py-8" color="text-bpim-info" />
    );
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
              onClick={() => !isSelf && router.push(`/rivals/${row.userId}`)}
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
