import { useMemo } from "react";
import { BpiCalculator } from "@/lib/bpi";
import type { SongWithRival } from "@/types/songs/score";
import type { RadarCategory } from "@/types/stats/radar";
import { ALL_RADAR_CATEGORIES } from "@/constants/radars";
import type { ScatterPoint } from "@/hooks/metrics/useArenaAnalysis";

export interface RivalDiffPoint {
  title: string;
  difficulty: string;
  diff: number;
  myBpi: number;
  rivalBpi: number;
  radarCategory: RadarCategory | undefined;
}

export interface RivalCategoryStat {
  cat: RadarCategory;
  myTotal: number | null;
  rivalTotal: number | null;
  songCount: number;
}

export function useRivalAnalysis(
  songs: SongWithRival[] | undefined,
  selectedCategories: Set<RadarCategory>,
) {
  const allSelected = selectedCategories.size === ALL_RADAR_CATEGORIES.length;

  // 両者ともBPIが存在する楽曲のみ対象
  const eligibleSongs = useMemo(() => {
    if (!songs) return [];
    return songs.filter(
      (s) => s.bpi !== null && s.rival?.bpi !== null && s.rival?.bpi !== undefined,
    );
  }, [songs]);

  const scatterPoints = useMemo((): ScatterPoint[] => {
    return eligibleSongs
      .filter((s) => {
        const cat = s.radarTop as RadarCategory | undefined;
        if (!allSelected && (!cat || !selectedCategories.has(cat))) return false;
        if (allSelected && cat && !selectedCategories.has(cat)) return false;
        return true;
      })
      .map((s) => ({
        title: s.title,
        difficulty: s.difficulty,
        bpi: s.rival!.bpi!,   // X軸: ライバルBPI
        userBpi: s.bpi!,       // Y軸: 自分のBPI
        rate:
          s.notes > 0 && s.exScore !== null
            ? (s.exScore / (s.notes * 2)) * 100
            : 0,
        notes: s.notes,
        count: 1,
        radarCategory: s.radarTop as RadarCategory | undefined,
      }));
  }, [eligibleSongs, selectedCategories, allSelected]);

  const axisDomain = useMemo((): [number, number] => {
    if (scatterPoints.length === 0) return [-15, 100];
    const allBpis = scatterPoints.flatMap((p) => [p.bpi, p.userBpi]);
    const min = Math.max(Math.floor(Math.min(...allBpis) / 10) * 10 - 10, -15);
    const max = Math.ceil(Math.max(...allBpis) / 10) * 10 + 10;
    return [min, max];
  }, [scatterPoints]);

  const winCount = useMemo(
    () => scatterPoints.filter((p) => p.userBpi > p.bpi).length,
    [scatterPoints],
  );
  const lossCount = useMemo(
    () => scatterPoints.filter((p) => p.userBpi < p.bpi).length,
    [scatterPoints],
  );

  const avgBpiDiff = useMemo(() => {
    if (scatterPoints.length === 0) return null;
    return (
      scatterPoints.reduce((sum, p) => sum + (p.userBpi - p.bpi), 0) /
      scatterPoints.length
    );
  }, [scatterPoints]);

  const topWins = useMemo(
    (): RivalDiffPoint[] =>
      [...scatterPoints]
        .filter((p) => p.userBpi > p.bpi)
        .sort((a, b) => b.userBpi - b.bpi - (a.userBpi - a.bpi))
        .slice(0, 10)
        .map((p) => ({
          title: p.title,
          difficulty: p.difficulty,
          diff: p.userBpi - p.bpi,
          myBpi: p.userBpi,
          rivalBpi: p.bpi,
          radarCategory: p.radarCategory,
        })),
    [scatterPoints],
  );

  const topLosses = useMemo(
    (): RivalDiffPoint[] =>
      [...scatterPoints]
        .filter((p) => p.userBpi < p.bpi)
        .sort((a, b) => b.bpi - b.userBpi - (a.bpi - a.userBpi))
        .slice(0, 10)
        .map((p) => ({
          title: p.title,
          difficulty: p.difficulty,
          diff: p.bpi - p.userBpi,
          myBpi: p.userBpi,
          rivalBpi: p.bpi,
          radarCategory: p.radarCategory,
        })),
    [scatterPoints],
  );

  // カテゴリ別総合BPI（selectedCategoriesフィルタ無視・常に全カテゴリ）
  const categoryStats = useMemo(
    (): RivalCategoryStat[] =>
      ALL_RADAR_CATEGORIES.map((cat) => {
        const catSongs = eligibleSongs.filter(
          (s) => (s.radarTop as RadarCategory | undefined) === cat,
        );
        const myBpis = catSongs.map((s) => s.bpi!).sort((a, b) => b - a);
        const rivalBpis = catSongs
          .map((s) => s.rival!.bpi!)
          .sort((a, b) => b - a);
        const myTotal =
          myBpis.length > 0
            ? BpiCalculator.calculateTotalBPI(myBpis, myBpis.length)
            : null;
        const rivalTotal =
          rivalBpis.length > 0
            ? BpiCalculator.calculateTotalBPI(rivalBpis, rivalBpis.length)
            : null;
        return { cat, myTotal, rivalTotal, songCount: catSongs.length };
      }),
    [eligibleSongs],
  );

  return {
    scatterPoints,
    axisDomain,
    winCount,
    lossCount,
    avgBpiDiff,
    topWins,
    topLosses,
    categoryStats,
  };
}
