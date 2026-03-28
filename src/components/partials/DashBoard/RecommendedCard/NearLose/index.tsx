import { InfiniteScrollContainer } from "@/components/partials/InfiniteScroll/ui";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useNearLoseInfinite, NearLoseSongItem } from "@/hooks/stats/useRivalNearLose";
import { NearLoseRankItem } from "./item";

interface NearLoseListProps {
  userId: string;
  onSelect: (item: NearLoseSongItem) => void;
}

export const NearLoseList = ({ userId, onSelect }: NearLoseListProps) => {
  const { version, levels, diffs } = useStatsFilter();
  const res = useNearLoseInfinite(userId, version, levels, diffs);

  return (
    <InfiniteScrollContainer
      {...res}
      emptyMessage="対象の楽曲が見つかりませんでした"
      renderItem={(item, i) => (
        <NearLoseRankItem
          key={`${item.songId}-${item.rival.userId}`}
          item={item}
          rank={i + 1}
          onClick={() => onSelect(item)}
        />
      )}
    />
  );
};
