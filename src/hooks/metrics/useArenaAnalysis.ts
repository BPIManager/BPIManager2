import { useMemo } from "react";
import { BpiCalculator } from "@/lib/bpi";
import { useUser } from "@/contexts/users/UserContext";
import { useUserScores } from "@/hooks/table/useUserScores";
import type { ArenaAverageData } from "@/types/metrics/arena";
import type { RadarCategory } from "@/types/stats/radar";
import {
  ALL_RADAR_CATEGORIES,
  RADAR_COLORS,
  ARENA_RANK_COLORS,
} from "@/constants/radars";

export { RADAR_COLORS, ARENA_RANK_COLORS } from "@/constants/radars";

export const getBpiBarColor = (bpi: number): string => {
  if (bpi >= 50) return "#facc15";
  if (bpi >= 20) return "#4ade80";
  if (bpi >= 0) return "#60a5fa";
  return "#64748b";
};

export interface ArenaSongPoint {
  title: string;
  difficulty: string;
  bpi: number;
  rate: number;
  notes: number;
  count: number;
  radarCategory: RadarCategory | undefined;
}

export interface ScatterPoint extends ArenaSongPoint {
  userBpi: number;
}

export function useArenaAnalysis(
  data: ArenaAverageData[],
  rank: string,
  version: string,
  selectedCategories: Set<RadarCategory>,
) {
  const { user } = useUser();
  const { songs: userSongs, isLoading: userLoading } = useUserScores(
    user?.userId,
    version,
  );

  const rankColor = ARENA_RANK_COLORS[rank] ?? "#94a3b8";

  const userBpiMap = useMemo(() => {
    if (!userSongs) return new Map<string, number | null>();
    return new Map(
      userSongs.map((s) => [`${s.title}[${s.difficulty}]`, s.bpi]),
    );
  }, [userSongs]);

  const allCategoriesSelected = selectedCategories.size === ALL_RADAR_CATEGORIES.length;

  const songsWithArenaBpi = useMemo((): ArenaSongPoint[] => {
    const result: ArenaSongPoint[] = [];
    for (const item of data) {
      const stats = item.averages[rank];
      if (!stats || stats.avgBpi === undefined) continue;
      const cat = item.radarCategory as RadarCategory | undefined;
      // When not all categories selected: only include songs with a matching category
      if (!allCategoriesSelected && (!cat || !selectedCategories.has(cat))) continue;
      // When all selected: include everything (uncategorized songs too)
      if (allCategoriesSelected && cat && !selectedCategories.has(cat)) continue;
      result.push({
        title: item.title,
        difficulty: item.difficulty,
        bpi: stats.avgBpi,
        rate: stats.rate,
        notes: item.notes,
        count: stats.count,
        radarCategory: cat,
      });
    }
    return result;
  }, [data, rank, selectedCategories, allCategoriesSelected]);

  const scatterPoints = useMemo((): ScatterPoint[] => {
    if (!userSongs) return [];
    const result: ScatterPoint[] = [];
    for (const s of songsWithArenaBpi) {
      const userBpi = userBpiMap.get(`${s.title}[${s.difficulty}]`);
      if (userBpi === undefined || userBpi === null) continue;
      result.push({ ...s, userBpi });
    }
    return result;
  }, [songsWithArenaBpi, userBpiMap, userSongs]);

  const totalBpi = useMemo(() => {
    if (songsWithArenaBpi.length === 0) return null;
    const sorted = songsWithArenaBpi.map((s) => s.bpi).sort((a, b) => b - a);
    return BpiCalculator.calculateTotalBPI(sorted, data.length);
  }, [songsWithArenaBpi, data.length]);

  const avgRate = useMemo(() => {
    if (songsWithArenaBpi.length === 0) return null;
    return (
      songsWithArenaBpi.reduce((sum, s) => sum + s.rate, 0) /
      songsWithArenaBpi.length
    );
  }, [songsWithArenaBpi]);

  const avgBpi = useMemo(() => {
    if (songsWithArenaBpi.length === 0) return null;
    return (
      songsWithArenaBpi.reduce((sum, s) => sum + s.bpi, 0) /
      songsWithArenaBpi.length
    );
  }, [songsWithArenaBpi]);

  const topSongs = useMemo(
    () => [...songsWithArenaBpi].sort((a, b) => b.bpi - a.bpi).slice(0, 15),
    [songsWithArenaBpi],
  );

  const bottomSongs = useMemo(
    () => [...songsWithArenaBpi].sort((a, b) => a.bpi - b.bpi).slice(0, 10),
    [songsWithArenaBpi],
  );

  const maxAbsBpi = useMemo(
    () => Math.max(...songsWithArenaBpi.map((s) => Math.abs(s.bpi)), 1),
    [songsWithArenaBpi],
  );

  const scatterAxisDomain = useMemo((): [number, number] => {
    if (scatterPoints.length === 0) return [-15, 100];
    const allBpis = scatterPoints.flatMap((p) => [p.bpi, p.userBpi]);
    const min = Math.max(Math.floor(Math.min(...allBpis) / 10) * 10 - 10, -15);
    const max = Math.ceil(Math.max(...allBpis) / 10) * 10 + 10;
    return [min, max];
  }, [scatterPoints]);

  // Per-category total BPI comparison (ignores selectedCategories filter — always shows all 6)
  const categoryBpiStats = useMemo(() => {
    return ALL_RADAR_CATEGORIES.map((cat) => {
      const arenaSongs: { title: string; difficulty: string; bpi: number }[] = [];
      for (const item of data) {
        const stats = item.averages[rank];
        if (!stats || stats.avgBpi === undefined) continue;
        if ((item.radarCategory as RadarCategory | undefined) !== cat) continue;
        arenaSongs.push({ title: item.title, difficulty: item.difficulty, bpi: stats.avgBpi });
      }

      const arenaTotal =
        arenaSongs.length > 0
          ? BpiCalculator.calculateTotalBPI(
              arenaSongs.map((s) => s.bpi).sort((a, b) => b - a),
              arenaSongs.length,
            )
          : null;

      const userBpisInCat: number[] = [];
      for (const s of arenaSongs) {
        const ub = userBpiMap.get(`${s.title}[${s.difficulty}]`);
        if (ub !== undefined && ub !== null) userBpisInCat.push(ub);
      }

      const userTotal =
        userBpisInCat.length > 0
          ? BpiCalculator.calculateTotalBPI(
              [...userBpisInCat].sort((a, b) => b - a),
              arenaSongs.length,
            )
          : null;

      return { cat, arenaTotal, userTotal, songCount: arenaSongs.length };
    });
  }, [data, rank, userBpiMap]);

  return {
    user,
    userLoading,
    rankColor,
    songsWithArenaBpi,
    scatterPoints,
    totalBpi,
    avgRate,
    avgBpi,
    topSongs,
    bottomSongs,
    maxAbsBpi,
    scatterAxisDomain,
    categoryBpiStats,
  };
}
