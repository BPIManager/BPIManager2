import { useIidxTower } from "@/hooks/iidxTower/useIidxTower";
import { IidxTowerCard } from "@/components/partials/DashBoard/IidxTowerCard/ui";
import { IidxTowerCardSkeleton } from "@/components/partials/DashBoard/IidxTowerCard/skeleton";
import { useStatsFilter } from "@/contexts/stats/FilterContext";

export const IidxTowerSection = ({
  userId,
  showImportAlert = true,
}: {
  userId: string;
  showImportAlert?: boolean;
}) => {
  const { version } = useStatsFilter();
  const { data, isLoading } = useIidxTower(userId, version);
  if (isLoading) return <IidxTowerCardSkeleton />;
  return <IidxTowerCard data={data ?? []} showImportAlert={showImportAlert} />;
};
