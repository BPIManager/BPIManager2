import { useIidxTower } from "@/hooks/iidxTower/useIidxTower";
import { IidxTowerCard } from "@/components/partials/DashBoard/IidxTowerCard/ui";
import { IidxTowerCardSkeleton } from "@/components/partials/DashBoard/IidxTowerCard/skeleton";

export const IidxTowerSection = ({
  userId,
  showImportAlert = true,
}: {
  userId: string;
  showImportAlert?: boolean;
}) => {
  const { data, isLoading } = useIidxTower(userId);
  if (isLoading) return <IidxTowerCardSkeleton />;
  return <IidxTowerCard data={data ?? []} showImportAlert={showImportAlert} />;
};
