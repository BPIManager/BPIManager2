import { useState } from "react";
import { useTranslation } from "@/hooks/common/useTranslation";
import { ChevronDown } from "lucide-react";
import type { RivalSongHighlight } from "@/types/stats/monthlyReview";
import { SONG_PAGE } from "./constants";
import { SongRow } from "./SongRow";

export function RivalSongs({
  songs,
  baseDelay,
}: {
  songs: RivalSongHighlight[];
  baseDelay: number;
}) {
  const [visible, setVisible] = useState(SONG_PAGE);
  const { tFormat } = useTranslation();
  return (
    <div
      className="mt-4 flex flex-col gap-2 border-t pt-4"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      {songs.slice(0, visible).map((song, j) => (
        <SongRow
          key={song.songId}
          song={song}
          delay={baseDelay + j * 0.05 + 0.15}
        />
      ))}
      {visible < songs.length && (
        <button
          onClick={() => setVisible((v) => v + SONG_PAGE)}
          className="mt-1 flex items-center gap-1 text-[10px] font-bold transition-colors"
          style={{ color: "rgba(255,255,255,0.25)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.25)")
          }
        >
          <ChevronDown className="h-3 w-3" />
          {tFormat("monthlyReview.rivals.seeMoreSongs", { count: String(songs.length - visible) })}
        </button>
      )}
    </div>
  );
}
