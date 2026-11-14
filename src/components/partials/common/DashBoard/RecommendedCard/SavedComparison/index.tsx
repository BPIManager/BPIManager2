import { useMemo } from "react";
import { Lock } from "lucide-react";
import { useAnalyticsComparison } from "@/hooks/analytics/useAnalyticsComparison";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useTranslation } from "@/hooks/common/useTranslation";
import { pickBehindSongs } from "@/lib/dashboard/rankingTabs";
import type { SavedTarget } from "@/types/analytics/saved";
import type { SongWithScore } from "@/types/songs/score";
import { PanelMessage, SavedComparisonList } from "./ui";

interface SavedComparisonPanelProps {
  /** ダッシュボードに出すターゲット（保存済み比較の複数ターゲットから選択済み） */
  target: SavedTarget | undefined;
  onSelect: (song: SongWithScore) => void;
}

const SavedComparisonPanel = ({ target, onSelect }: SavedComparisonPanelProps) => {
  const { t } = useTranslation();
  const { version, levels, diffs } = useStatsFilter();
  const accessible = !!target && target.accessible;
  const { songs, isLoading, error } = useAnalyticsComparison(
    accessible ? target : null,
    version,
  );

  const rows = useMemo(() => {
    const levelNums = levels.map(Number);
    return pickBehindSongs(songs ?? []).filter(
      (s) =>
        levelNums.includes(s.difficultyLevel) &&
        (diffs as string[]).includes(s.difficulty),
    );
  }, [songs, levels, diffs]);

  if (!target) return null;
  if (!target.accessible) {
    return (
      <PanelMessage icon={<Lock className="h-4 w-4" />}>
        {t("analytics.saved.inaccessible")}
      </PanelMessage>
    );
  }

  return (
    <SavedComparisonList
      label={target.label}
      rows={rows}
      isLoading={isLoading}
      isError={!!error}
      onSelect={onSelect}
    />
  );
};

export default SavedComparisonPanel;
