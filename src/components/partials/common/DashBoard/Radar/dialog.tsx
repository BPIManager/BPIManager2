import type { RadarSongEntry } from "@/types/stats/radar";
import { SongListDialog } from "../Dialogs/songListDialog";
import { useTranslation } from "@/hooks/common/useTranslation";

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
  const { t } = useTranslation();
  return (
    <SongListDialog
      dialogTitle={`${categoryName} - ${t("dashboard.songList.songList")}`}
      songs={songs}
      isOpen={isOpen}
      onClose={onClose}
      showPlayedOnlyToggle
    />
  );
};
