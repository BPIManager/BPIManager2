import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { RadarSongEntry } from "@/types/stats/radar";
import { getBpiColorStyle } from "@/constants/bpiColor";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";

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
    return [...songs].sort((a, b) =>
      sortOrder === "desc" ? b.bpi - a.bpi : a.bpi - b.bpi,
    );
  }, [songs, sortOrder]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        placement="bottom-sheet"
        disableScrollWrapper
        className="flex flex-col p-0 overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 border-b border-bpim-border px-4 pt-4 pb-3">
          <DialogTitle className="text-base font-bold text-bpim-text">
            {categoryName} - 楽曲リスト ({songs.length})
          </DialogTitle>
        </DialogHeader>

        <div className="shrink-0 px-4 pt-3">
          <Tabs
            value={sortOrder}
            onValueChange={setSortOrder}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="desc"
                className="flex items-center gap-2 text-xs data-[state=active]:bg-bpim-primary"
              >
                <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                BPIが高い順
              </TabsTrigger>
              <TabsTrigger
                value="asc"
                className="flex items-center gap-2 text-xs data-[state=active]:bg-bpim-primary"
              >
                <ArrowUpNarrowWide className="h-3.5 w-3.5" />
                BPIが低い順
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          <div className="flex flex-col gap-2">
            {sortedSongs.map((song) => {
              const style = getBpiColorStyle(song.bpi);
              return (
                <div
                  key={`${song.title}-${song.difficulty}`}
                  className="flex items-center justify-between rounded-lg border border-bpim-border bg-bpim-surface-2/60 p-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-xs font-bold text-bpim-text">
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
                      className="inline-flex min-w-[80px] items-center justify-center rounded-sm border px-2 py-0.5 font-mono text-xs font-bold"
                      style={{
                        borderColor: style.bg,
                        backgroundColor: `${style.bg}22`,
                      }}
                    >
                      {song.bpi.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
