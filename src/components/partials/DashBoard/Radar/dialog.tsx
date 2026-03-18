import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { RadarSongEntry } from "@/types/stats/radar";
import { LuArrowDownWideNarrow, LuArrowUpNarrowWide } from "react-icons/lu";
import { getBpiColorStyle } from "@/constants/bpiColor";

interface Props {
  categoryName: string;
  songs: RadarSongEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export const RadarCategorySongsDialog = ({
  categoryName,
  songs,
  isOpen,
  onClose,
}: Props) => {
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      return sortOrder === "desc" ? b.bpi - a.bpi : a.bpi - b.bpi;
    });
  }, [songs, sortOrder]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80svh] overflow-hidden border-white/20 bg-bpim-bg p-0 sm:max-w-md">
        <DialogHeader className="border-b border-bpim-border p-4">
          <DialogTitle className="text-base font-bold text-white">
            {categoryName} - 楽曲リスト ({songs.length})
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-4">
          <Tabs
            value={sortOrder}
            onValueChange={setSortOrder}
            className="w-full"
          >
            <TabsList className="mb-4 grid w-full grid-cols-2 rounded-md bg-white/5 p-1 text-bpim-muted">
              <TabsTrigger
                value="desc"
                className="flex items-center gap-2 text-xs data-[state=active]:bg-bpim-primary data-[state=active]:text-white"
              >
                <LuArrowDownWideNarrow className="h-3.5 w-3.5" />
                BPIが高い順
              </TabsTrigger>
              <TabsTrigger
                value="asc"
                className="flex items-center gap-2 text-xs data-[state=active]:bg-bpim-primary data-[state=active]:text-white"
              >
                <LuArrowUpNarrowWide className="h-3.5 w-3.5" />
                BPIが低い順
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col gap-2">
              {sortedSongs.map((song) => {
                const style = getBpiColorStyle(song.bpi);
                return (
                  <div
                    key={`${song.title}-${song.difficulty}`}
                    className="flex items-center justify-between rounded-lg border border-bpim-border bg-white/5 p-3"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-xs font-bold text-white">
                        {song.title}
                      </span>
                      <span className="text-[10px] text-bpim-muted">
                        {song.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-0">
                        <span className="text-[10px] text-bpim-muted">
                          EX SCORE
                        </span>
                        <span className="font-mono text-xs font-bold text-bpim-text">
                          {song.exScore}
                        </span>
                      </div>

                      <div
                        className="inline-flex min-w-[80px] items-center justify-center rounded-sm border px-2 py-0.5 font-mono text-xs font-bold transition-colors"
                        style={{
                          borderColor: style.bg,
                          color: style.color,
                        }}
                      >
                        {song.bpi.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
