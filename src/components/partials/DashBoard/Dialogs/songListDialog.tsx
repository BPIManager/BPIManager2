import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { getBpiColorStyle } from "@/constants/bpiColor";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { AppTabsGroup } from "@/components/ui/complex/tabs";

export interface SongListEntry {
  title: string;
  difficulty: string;
  bpi: number;
  exScore?: number | null;
  notes?: number | null;
}

interface Props {
  dialogTitle: string;
  songs: SongListEntry[];
  isOpen: boolean;
  onClose: () => void;
  showPlayedOnlyToggle?: boolean;
}

export const SongListDialog = ({
  dialogTitle,
  songs,
  isOpen,
  onClose,
  showPlayedOnlyToggle = false,
}: Props) => {
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [playedOnly, setPlayedOnly] = useState(false);

  const sortedSongs = useMemo(() => {
    const filtered =
      showPlayedOnlyToggle && playedOnly
        ? songs.filter((s) => s.exScore != null)
        : songs;
    return [...filtered].sort((a, b) =>
      sortOrder === "desc" ? b.bpi - a.bpi : a.bpi - b.bpi,
    );
  }, [songs, sortOrder, playedOnly, showPlayedOnlyToggle]);

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
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="shrink-0 px-4 pt-3 flex items-center justify-between gap-2">
          <Tabs
            value={sortOrder}
            onValueChange={setSortOrder}
            className="w-auto"
          >
            <AppTabsGroup
              visual="minimal"
              iconOnly
              tabs={[
                {
                  value: "desc",
                  label: "BPIが高い順",
                  icon: ArrowDownWideNarrow,
                },
                { value: "asc", label: "BPIが低い順", icon: ArrowUpNarrowWide },
              ]}
            />
          </Tabs>

          {showPlayedOnlyToggle && (
            <div className="flex items-center gap-2">
              <Switch
                id="played-only"
                checked={playedOnly}
                onCheckedChange={setPlayedOnly}
              />
              <Label
                htmlFor="played-only"
                className="text-xs text-bpim-muted cursor-pointer whitespace-nowrap"
              >
                既プレイのみ
              </Label>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          <div className="flex flex-col gap-2">
            {sortedSongs.map((song, i) => {
              const isUnplayed = song.exScore == null;
              const style = getBpiColorStyle(song.bpi);
              const scoreRate =
                song.exScore != null && song.notes != null && song.notes > 0
                  ? (song.exScore / (song.notes * 2)) * 100
                  : null;

              return (
                <div
                  key={`${song.title}-${song.difficulty}-${i}`}
                  className={`flex items-center justify-between rounded-lg border border-bpim-border bg-bpim-surface-2/60 p-3 ${isUnplayed ? "opacity-40" : ""}`}
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
                    {song.exScore != null && (
                      <div className="flex flex-col items-end gap-0">
                        <span className="text-[10px] text-bpim-muted">
                          EX SCORE
                        </span>
                        <span className="font-mono text-xs font-bold text-bpim-text">
                          {song.exScore}
                          {scoreRate != null && (
                            <span className="ml-1 font-normal text-bpim-muted">
                              ({scoreRate.toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    )}

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
