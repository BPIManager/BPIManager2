import { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useUser } from "@/contexts/users/UserContext";
import { RadarSectionChart } from "@/components/partials/DashBoard/Radar";
import { SONG_ATTRIBUTES_GLOBAL } from "@/constants/songAttributes";
import { Badge } from "@/components/ui/badge";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { buildTextageUrl, buildChartViewerUrl } from "@/utils/songs/links";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { TicketSongResult, ScoreMode } from "@/types/tickets";

function buildRadarData(song: TicketSongResult): Record<string, number> {
  return Object.fromEntries(
    SONG_ATTRIBUTES_GLOBAL.map(({ dbKey, label }) => [
      label,
      (song[dbKey as keyof TicketSongResult] as number | null) ?? 0,
    ]),
  );
}

interface SongCardProps {
  song: TicketSongResult;
  totalBpi: number | null;
  ticketId: string;
  scoreMode: ScoreMode;
}

export function SongCard({ song, totalBpi, ticketId, scoreMode }: SongCardProps) {
  const { fbUser } = useUser();
  const { t } = useTranslation();
  const [showRadar, setShowRadar] = useState(false);
  const [myVote, setMyVote] = useState<"upvote" | "downvote" | null>(song.myVote);
  const [upvoteCount, setUpvoteCount] = useState(song.upvoteCount);
  const [downvoteCount, setDownvoteCount] = useState(song.downvoteCount);

  const radarData = buildRadarData(song);
  const hasAttributes = Object.values(radarData).some((v) => v > 0);
  const bpiGapPositive = song.bpiGap != null && song.bpiGap > 0;
  const isLoggedIn = !!fbUser;

  const handleVote = useCallback(
    async (voteType: "upvote" | "downvote") => {
      if (!fbUser) return;
      const isUndo = myVote === voteType;
      const prev = { myVote, upvoteCount, downvoteCount };

      if (isUndo) {
        setMyVote(null);
        if (voteType === "upvote") setUpvoteCount((n) => n - 1);
        else setDownvoteCount((n) => n - 1);
      } else {
        if (myVote === "upvote") setUpvoteCount((n) => n - 1);
        if (myVote === "downvote") setDownvoteCount((n) => n - 1);
        setMyVote(voteType);
        if (voteType === "upvote") setUpvoteCount((n) => n + 1);
        else setDownvoteCount((n) => n + 1);
      }

      try {
        const token = await fbUser.getIdToken();
        const url = `${API_PREFIX}/songs/${song.songId}/patterns/${ticketId}/vote`;
        const res = await fetch(url, {
          method: isUndo ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: isUndo ? undefined : JSON.stringify({ voteType }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setMyVote(prev.myVote);
        setUpvoteCount(prev.upvoteCount);
        setDownvoteCount(prev.downvoteCount);
      }
    },
    [fbUser, myVote, upvoteCount, downvoteCount, song.songId, ticketId],
  );

  return (
    <div className="rounded-lg border border-bpim-border bg-bpim-surface p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-bpim-muted font-mono">
              {song.difficulty} ☆{song.difficultyLevel}
            </span>
            {bpiGapPositive && (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                {t("tickets.bpiBelowPre")}{song.bpiGap!.toFixed(1)}{t("tickets.bpiBelowSuf")}
              </Badge>
            )}
          </div>
          <p className="font-semibold text-bpim-text text-sm leading-snug truncate">
            {song.title}
          </p>
          <div className="flex items-center gap-1 flex-wrap">
            {buildTextageUrl(song.textage, 1, ticketId) && (
              <div className="inline-flex rounded border border-bpim-border overflow-hidden">
                <a
                  href={buildTextageUrl(song.textage, 1, ticketId)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-bpim-overlay/40 text-bpim-muted hover:text-bpim-text hover:bg-bpim-overlay transition-colors border-r border-bpim-border"
                >
                  textage 1P
                </a>
                <a
                  href={buildTextageUrl(song.textage, 2, ticketId)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-bpim-overlay/40 text-bpim-muted hover:text-bpim-text hover:bg-bpim-overlay transition-colors"
                >
                  2P
                </a>
              </div>
            )}
            {buildChartViewerUrl(song.textage, song.difficulty) && (
              <a
                href={buildChartViewerUrl(song.textage, song.difficulty)!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded border border-bpim-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-bpim-overlay/40 text-bpim-muted hover:text-bpim-text hover:bg-bpim-overlay transition-colors"
              >
                Chart Viewer
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0 gap-1">
          <span className="text-xs text-bpim-muted">{t("tickets.scoreLabel")}</span>
          <span className="font-mono text-sm font-bold text-bpim-text">
            {song.bpi != null ? song.bpi.toFixed(2) : t("tickets.notPlayed")}
          </span>
          {song.exScore != null && (
            <span className="font-mono text-[11px] text-bpim-muted">
              EX: {song.exScore}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-bpim-muted">
        <div className="flex items-center gap-2">
          <span>
            {scoreMode === "relative" ? t("tickets.scoreRelativeShort") : t("tickets.scoreRawShort")}:{" "}
            <span className="font-mono text-bpim-text font-semibold">
              {scoreMode === "relative"
                ? `${song.relativeScore.toFixed(1)}%`
                : song.patternScore.toFixed(1)}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={!isLoggedIn}
              onClick={() => handleVote("upvote")}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors ${
                myVote === "upvote"
                  ? "text-emerald-400"
                  : "text-bpim-muted hover:text-bpim-text"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ThumbsUp className="h-3 w-3" />
              <span className="tabular-nums">{upvoteCount}</span>
            </button>
            <button
              disabled={!isLoggedIn}
              onClick={() => handleVote("downvote")}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors ${
                myVote === "downvote"
                  ? "text-rose-400"
                  : "text-bpim-muted hover:text-bpim-text"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ThumbsDown className="h-3 w-3" />
              <span className="tabular-nums">{downvoteCount}</span>
            </button>
          </div>
        </div>
        {totalBpi != null && song.bpi != null && (
          <span>
            {t("tickets.singleBpi")}{" "}
            <span
              className={`font-mono font-semibold ${bpiGapPositive ? "text-amber-400" : "text-bpim-text"}`}
            >
              {song.bpi.toFixed(2)}
            </span>
          </span>
        )}
      </div>

      {hasAttributes && (
        <button
          className="text-xs text-bpim-primary hover:underline text-left"
          onClick={() => setShowRadar((v) => !v)}
        >
          {showRadar ? t("tickets.hideRadar") : t("tickets.showAttributes")}
        </button>
      )}

      {showRadar && hasAttributes && (
        <div className="w-full">
          <RadarSectionChart
            data={{}}
            rivalData={radarData}
            rivalOnly
            songAttr
            miniHeight={220}
          />
        </div>
      )}
    </div>
  );
}
