"use client";

import { useMemo } from "react";
import { useRouter } from "next/router";
import { LuLoader } from "react-icons/lu";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalScores } from "@/hooks/social/useRivalScores";
import { SongWithScore } from "@/types/songs/withScore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="w-full overflow-hidden rounded-md border border-bpim-border bg-bpim-bg/20">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="hover:bg-transparent border-bpim-border">
            <TableHead className="w-[60px] text-[10px] font-bold uppercase tracking-wider">
              Rank
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider">
              Player
            </TableHead>
            <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">
              EX Score
            </TableHead>
            <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">
              BPI
            </TableHead>
            <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">
              Diff
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ranking.map((row, index) => {
            const isSelf = !!row.isSelf;
            const diff = myScore
              ? (row.exScore || 0) - (myScore.exScore || 0)
              : 0;

            return (
              <TableRow
                key={row.userId}
                onClick={() => !isSelf && router.push(`/rivals/${row.userId}`)}
                className={cn(
                  "border-bpim-border transition-colors cursor-pointer",
                  isSelf
                    ? "bg-bpim-primary-dim/30 hover:bg-bpim-primary-dim/40"
                    : "hover:bg-bpim-overlay/50",
                )}
              >
                <TableCell className="py-3">
                  <span
                    className={cn(
                      "font-mono font-bold text-sm",
                      index < 3 ? "text-yellow-500" : "text-bpim-muted",
                    )}
                  >
                    #{index + 1}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-7 w-7 border border-bpim-border">
                      <AvatarImage src={row.profileImage ?? ""} />
                      <AvatarFallback className="text-[10px]">
                        {row.userName?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          "text-sm tracking-tight",
                          isSelf
                            ? "font-bold text-bpim-text"
                            : "font-medium text-bpim-text",
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
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-bpim-text py-3">
                  {row.exScore?.toLocaleString() ?? 0}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-bpim-muted py-3">
                  {row.bpi?.toFixed(2) ?? "-"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono text-xs font-bold py-3",
                    diff > 0
                      ? "text-bpim-danger"
                      : diff < 0
                        ? "text-bpim-success"
                        : "text-bpim-subtle",
                  )}
                >
                  {diff > 0 ? `+${diff}` : diff === 0 ? "-" : diff}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
