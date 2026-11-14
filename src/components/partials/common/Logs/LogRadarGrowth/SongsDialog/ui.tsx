import { HelpTooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DIFF_COLORS as diffColors } from "@/constants/theme/difficultyColors";
import { useTranslation } from "@/hooks/common/useTranslation";
import { cn } from "@/lib/utils";
import type {
  RadarGrowthSong,
  RadarGrowthSongScore,
} from "@/types/logs/radarGrowth";

const formatImpact = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}`;

const ScoreCell = ({
  score,
  isNew,
}: {
  score: RadarGrowthSongScore | null;
  isNew?: boolean;
}) => {
  const { t } = useTranslation();
  if (!score) {
    return (
      <span className="font-mono text-[10px] font-bold text-bpim-subtle">
        {isNew ? t("logs.detail.radarGrowth.songs.new") : "-"}
      </span>
    );
  }
  return (
    <div className="flex flex-col items-end font-mono">
      <span className="text-sm font-bold leading-tight text-bpim-text">{score.exScore}</span>
      <span className="text-[10px] leading-none text-bpim-muted">
        {score.bpi !== null ? score.bpi.toFixed(2) : "-"}
      </span>
    </div>
  );
};

const SongRow = ({ song }: { song: RadarGrowthSong }) => (
  <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_4.5rem] items-center gap-3 border-b border-bpim-border px-3 py-2">
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate text-sm font-bold tracking-tight text-bpim-text">
        {song.title}
      </span>
      <Badge
        className={cn(
          "flex h-3.5 w-fit items-center rounded-sm border-none px-1 text-[9px] text-white",
          diffColors[song.difficulty ?? ""] || "bg-bpim-surface-2",
        )}
      >
        {String(song.difficulty ?? "").charAt(0).toUpperCase()}
      </Badge>
    </div>
    <div className="flex justify-end">
      <ScoreCell score={song.before} isNew />
    </div>
    <div className="flex justify-end">
      <ScoreCell score={song.after} />
    </div>
    <span
      className={cn(
        "text-right font-mono text-sm font-bold",
        song.impact > 0 && "text-bpim-success",
        song.impact < 0 && "text-bpim-danger",
        song.impact === 0 && "text-bpim-subtle",
      )}
    >
      {formatImpact(song.impact)}
    </span>
  </div>
);

export const SongsTable = ({
  songs,
  isLoading,
}: {
  songs: RadarGrowthSong[];
  isLoading: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex max-h-[60dvh] flex-col overflow-y-auto rounded-lg border border-bpim-border">
      <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_4.5rem] items-center gap-3 border-b border-bpim-border bg-bpim-surface-2 px-3 py-2 text-[10px] font-bold uppercase text-bpim-muted">
        <span>{t("logs.detail.radarGrowth.songs.song")}</span>
        <span className="text-right">{t("logs.detail.radarGrowth.before")}</span>
        <span className="text-right">{t("logs.detail.radarGrowth.after")}</span>
        <span className="flex items-center justify-end gap-1">
          {t("logs.detail.radarGrowth.songs.impact")}
          <HelpTooltip align="right">
            {t("logs.detail.radarGrowth.songs.impactHelp")}
          </HelpTooltip>
        </span>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2 p-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <p className="p-6 text-center text-sm text-bpim-muted">
          {t("logs.detail.radarGrowth.songs.empty")}
        </p>
      ) : (
        songs.map((song) => <SongRow key={`${song.songId}-${song.difficulty}`} song={song} />)
      )}
    </div>
  );
};
