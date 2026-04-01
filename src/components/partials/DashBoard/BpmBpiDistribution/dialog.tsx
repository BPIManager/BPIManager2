import type { BpmBandSongEntry } from "@/types/stats/distribution";
import { SongListDialog } from "../Dialogs/songListDialog";

interface Props {
  bandLabel: string;
  songs: BpmBandSongEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export const BpmBandSongsDialog = ({
  bandLabel,
  songs,
  isOpen,
  onClose,
}: Props) => {
  return (
    <SongListDialog
      dialogTitle={`BPM ${bandLabel} - 楽曲リスト (${songs.length})`}
      songs={songs}
      isOpen={isOpen}
      onClose={onClose}
      showPlayedOnlyToggle
    />
  );
};
