"use client";

import { useMemo, useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { useBpiOptimizerMemos } from "@/hooks/analytics/useOptimizeMemo";
import { useUserScores } from "@/hooks/table/useUserScores";
import type { StepSortOrder } from "@/components/partials/common/OptimizerGoalCard";
import OptimizerProgressCard from "./ui";

const OptimizerProgressSection = ({ userId }: { userId: string }) => {
  const { fbUser } = useUser();
  const { memos, isMemosLoading } = useBpiOptimizerMemos(userId, fbUser);
  const { songs, isLoading: isScoresLoading } = useUserScores(userId);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sortOrder, setSortOrder] = useState<StepSortOrder>("added");

  const currentScores = useMemo(() => {
    const map = new Map<number, number | null>();
    songs?.forEach((song) => {
      map.set(song.songId, song.exScore);
    });
    return map;
  }, [songs]);

  return (
    <OptimizerProgressCard
      isLoading={isMemosLoading || isScoresLoading}
      memos={memos}
      currentScores={currentScores}
      selectedIndex={selectedIndex}
      onSelectIndex={setSelectedIndex}
      sortOrder={sortOrder}
      onSortOrderChange={setSortOrder}
    />
  );
};

export default OptimizerProgressSection;
