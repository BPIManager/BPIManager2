import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import { useBatchRadarGrowthSongs } from "@/hooks/batches/useBatchRadarGrowthSongs";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { RadarCategory } from "@/types/stats/radar";
import { SongsTable } from "./ui";

interface RadarGrowthSongsDialogProps {
  category: RadarCategory | null;
  userId?: string;
  version?: string;
  periodKey?: string;
  type: "batch" | "day" | "week" | "month";
  groupedBy: string;
  onClose: () => void;
}

const RadarGrowthSongsDialog = ({
  category,
  userId,
  version,
  periodKey,
  type,
  groupedBy,
  onClose,
}: RadarGrowthSongsDialogProps) => {
  const { tFormat } = useTranslation();
  const { data, isLoading, isError } = useBatchRadarGrowthSongs(
    userId,
    version,
    periodKey,
    type,
    groupedBy,
    category,
  );

  return (
    <Dialog open={category !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[94vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {category
              ? tFormat("logs.detail.radarGrowth.songs.title", { category })
              : ""}
          </DialogTitle>
        </DialogHeader>
        {isError ? (
          <FetchErrorState error={isError} />
        ) : (
          <SongsTable songs={data?.songs ?? []} isLoading={isLoading} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RadarGrowthSongsDialog;
