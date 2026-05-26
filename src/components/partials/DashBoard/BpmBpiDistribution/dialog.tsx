import type { BpmBandSongEntry } from "@/types/stats/distribution";
import { SongListDialog } from "../Dialogs/songListDialog";
import { useTranslation } from "@/hooks/common/useTranslation";

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
  const { t } = useTranslation();
  return (
    <SongListDialog
      dialogTitle={`BPM ${bandLabel} - ${t("dashboard.songList.songList")} (${songs.length})`}
      songs={songs}
      isOpen={isOpen}
      onClose={onClose}
      showPlayedOnlyToggle
    />
  );
};
