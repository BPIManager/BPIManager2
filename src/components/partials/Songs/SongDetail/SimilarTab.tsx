import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { RadarSectionChart } from "@/components/partials/DashBoard/Radar/index";
import { DifficultyBadge } from "@/components/partials/Songs/DifficultyBadge";
import { useSimilarSongs } from "@/hooks/songs/useSimilarSongs";
import { buildRadarData } from "@/utils/songs/songListFilter";
import type { SimilarSongItem } from "@/types/songs/songInfo";

function SimilarSongRow({ song }: { song: SimilarSongItem }) {
  return (
    <Link
      href={`/songs/${song.songId}/notes`}
      className="flex items-center gap-3 rounded-lg border border-bpim-border bg-bpim-surface px-4 py-3 hover:bg-bpim-overlay/60 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-bpim-text truncate">
          {song.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <DifficultyBadge
            difficulty={song.difficulty}
            level={song.difficultyLevel}
          />
          <span className="text-xs text-bpim-muted font-mono">
            {song.notes} notes
          </span>
          <span className="text-xs text-bpim-muted font-mono">
            BPM {song.bpm}
          </span>
          <span className="text-[10px] font-mono text-bpim-muted/60">
            dist {song.distance.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="w-[100px] shrink-0">
        <RadarSectionChart
          data={{}}
          rivalData={buildRadarData(song, "global")}
          rivalOnly
          isMini
          songAttr
        />
      </div>
    </Link>
  );
}

interface SimilarTabProps {
  songId: number;
  version: string;
}

export function SimilarTab({ songId, version }: SimilarTabProps) {
  const { similar, isLoading } = useSimilarSongs(songId, version, 15, "global");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      {similar.length === 0 ? (
        <p className="py-8 text-center text-sm text-bpim-muted">
          類似楽曲データが見つかりませんでした
        </p>
      ) : (
        similar.map((s) => <SimilarSongRow key={s.songId} song={s} />)
      )}
    </div>
  );
}
