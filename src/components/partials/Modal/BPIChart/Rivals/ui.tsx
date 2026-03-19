"use client";

import { useMemo } from "react";
import { useRouter } from "next/router";
import { LuLoader } from "react-icons/lu";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalScores } from "@/hooks/social/useRivalScores";
import { SongWithScore } from "@/types/songs/withScore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
      <div className="flex justify-center py-8">
        <LuLoader className="h-8 w-8 animate-spin text-bpim-info" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-md border border-bpim-border">
      <table className="w-full caption-bottom text-sm">
        <thead className="sticky top-0 z-10 bg-bpim-surface-2">
          <tr className="border-b border-bpim-border">
            <th className="w-[56px] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
              Rank
            </th>
            <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
              Player
            </th>
            <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
              EX Score
            </th>
            <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
              BPI
            </th>
            <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
              Diff
            </th>
          </tr>
        </thead>
      </table>

      <div className="max-h-[320px] overflow-y-auto overscroll-contain">
        <table className="w-full text-sm">
          <tbody>
            {ranking.map((row, index) => {
              const isSelf = !!row.isSelf;
              const diff = myScore
                ? (row.exScore || 0) - (myScore.exScore || 0)
                : 0;

              return (
                <tr
                  key={row.userId}
                  onClick={() =>
                    !isSelf && router.push(`/rivals/${row.userId}`)
                  }
                  className={cn(
                    "border-b border-bpim-border transition-colors",
                    isSelf
                      ? "bg-bpim-primary-dim/30 hover:bg-bpim-primary-dim/40"
                      : "cursor-pointer hover:bg-bpim-overlay/50",
                    index === ranking.length - 1 && "border-b-0",
                  )}
                >
                  <td className="w-[56px] px-3 py-3">
                    <span
                      className={cn(
                        "font-mono text-sm font-bold",
                        index < 3 ? "text-yellow-500" : "text-bpim-muted",
                      )}
                    >
                      #{index + 1}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 shrink-0 border border-bpim-border">
                        <AvatarImage src={row.profileImage ?? ""} />
                        <AvatarFallback className="text-[10px]">
                          {row.userName?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "truncate text-sm tracking-tight text-bpim-text",
                          isSelf ? "font-bold" : "font-medium",
                        )}
                      >
                        {row.userName}
                        {isSelf && (
                          <span className="ml-1 text-[10px] text-bpim-primary">
                            (あなた)
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-right font-mono font-bold text-bpim-text">
                    {row.exScore?.toLocaleString() ?? 0}
                  </td>

                  <td className="px-3 py-3 text-right font-mono text-xs text-bpim-muted">
                    {row.bpi?.toFixed(2) ?? "-"}
                  </td>

                  <td
                    className={cn(
                      "px-3 py-3 text-right font-mono text-xs font-bold",
                      diff > 0
                        ? "text-bpim-danger"
                        : diff < 0
                          ? "text-bpim-success"
                          : "text-bpim-subtle",
                    )}
                  >
                    {diff > 0 ? `+${diff}` : diff === 0 ? "-" : diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
