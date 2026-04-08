import { useEffect, useState } from "react";
import { List, type RowComponentProps } from "react-window";
import { Skeleton } from "@/components/ui/skeleton";
import { SongRow } from "./SongRow";
import type { SongListItem } from "@/types/songs/songInfo";
import type { SortKey } from "@/types/songs/songList";

export const SONG_ROW_HEIGHT = 132;

interface RowProps {
  songs: SongListItem[];
  sortKey: SortKey;
}

function VirtualRow({ index, style, songs, sortKey }: RowComponentProps<RowProps>) {
  const song = songs[index];
  return (
    <div style={{ ...style, paddingBottom: 8 }}>
      <SongRow song={song} sortKey={sortKey} />
    </div>
  );
}

function useListHeight(offset = 420): number {
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const update = () => setHeight(Math.max(400, window.innerHeight - offset));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [offset]);

  return height;
}

interface SongVirtualListProps {
  songs: SongListItem[];
  isLoading: boolean;
  sortKey: SortKey;
}

export function SongVirtualList({ songs, isLoading, sortKey }: SongVirtualListProps) {
  const listHeight = useListHeight();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-bpim-muted">
        条件に一致する楽曲が見つかりませんでした
      </p>
    );
  }

  return (
    <List
      style={{ height: listHeight }}
      rowComponent={VirtualRow}
      rowCount={songs.length}
      rowHeight={SONG_ROW_HEIGHT}
      rowProps={{ songs, sortKey }}
    />
  );
}
