import { InfiniteScrollContainer } from "@/components/partials/common/ListControls/InfiniteScroll/ui";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useNearLoseInfinite } from "@/hooks/stats/useRivalNearLose";
import { NearLoseSongItem } from "@/types/stats/nearLose";
import { NearLoseRankItem } from "./item";
import { useTranslation } from "@/hooks/common/useTranslation";

interface NearLoseListProps {
  userId: string;
  onSelect: (item: NearLoseSongItem) => void;
}

export const NearLoseList = ({ userId, onSelect }: NearLoseListProps) => {
  const { version, levels, diffs } = useStatsFilter();
  const { t } = useTranslation();
  const res = useNearLoseInfinite(userId, version, levels, diffs);

  return (
    <InfiniteScrollContainer
      {...res}
      emptyMessage={t("dashboard.ranking.noSongs")}
      renderItem={(item, _i) => (
        <NearLoseRankItem
          key={`${item.songId}-${item.rival.userId}`}
          item={item}
          onClick={() => onSelect(item)}
        />
      )}
    />
  );
};
