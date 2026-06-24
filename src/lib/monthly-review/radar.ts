import { BpiCalculator } from "@/lib/bpi";
import { ALL_CATEGORIES } from "@/lib/radar/calculator";
import type { RadarCategory } from "@/types/stats/radar";
import topElements from "@/constants/iidx/radars/topElements.json";
import type { TopSongImproved, RadarGrowthEntry } from "@/types/stats/monthlyReview";

export const topElementMap = new Map<string, RadarCategory>(
  (
    topElements as { title: string; difficulty: string; top: RadarCategory }[]
  ).map((e) => [`${e.title}___${e.difficulty}`, e.top]),
);

type SongMeta = { songId: number; title: string; difficulty: string };

export function buildRadarGrowth(
  topImprovedSongs: TopSongImproved[],
  allL12SongMeta: SongMeta[],
  songUpdateDateMap: Map<number, string>,
  viewerPreMonthBpiMap: Map<number, number>,
  viewerFinalBpiMap: Map<number, number>,
): RadarGrowthEntry[] {
  const elementSongsMap = new Map<string, TopSongImproved[]>();
  ALL_CATEGORIES.forEach((cat) => elementSongsMap.set(cat, []));

  for (const song of topImprovedSongs) {
    if (song.diff <= 0 || song.difficultyLevel !== 12) continue;
    const key = `${song.title}___${song.difficulty}`;
    const cat = topElementMap.get(key);
    if (cat) elementSongsMap.get(cat)!.push(song);
  }

  const elementSongIdsMap = new Map<string, number[]>();
  ALL_CATEGORIES.forEach((cat) => elementSongIdsMap.set(cat, []));
  for (const s of allL12SongMeta) {
    const key = `${s.title}___${s.difficulty}`;
    const cat = topElementMap.get(key);
    if (cat) elementSongIdsMap.get(cat)!.push(s.songId);
  }

  const radarGrowth: RadarGrowthEntry[] = [];
  for (const element of ALL_CATEGORIES) {
    const songs = elementSongsMap.get(element) ?? [];
    const elementSongIds = elementSongIdsMap.get(element) ?? [];
    if (elementSongIds.length === 0) continue;

    const elementSongCount = elementSongIds.length;
    const startBpis = elementSongIds.map(
      (id) => viewerPreMonthBpiMap.get(id) ?? -15,
    );
    const endBpis = elementSongIds.map(
      (id) =>
        viewerFinalBpiMap.get(id) ?? viewerPreMonthBpiMap.get(id) ?? -15,
    );
    const elementBpiStart =
      Math.round(
        BpiCalculator.calculateTotalBPI(startBpis, elementSongCount) * 100,
      ) / 100;
    const elementBpiEnd =
      Math.round(
        BpiCalculator.calculateTotalBPI(endBpis, elementSongCount) * 100,
      ) / 100;
    const totalDiff =
      Math.round((elementBpiEnd - elementBpiStart) * 100) / 100;

    const dailyDiffMap = new Map<string, number>();
    for (const song of songs) {
      const date = songUpdateDateMap.get(song.songId);
      if (date)
        dailyDiffMap.set(date, (dailyDiffMap.get(date) ?? 0) + song.diff);
    }
    const sortedDates = Array.from(dailyDiffMap.keys()).sort();
    let cumDiff = 0;
    const timeline: { date: string; cumDiff: number }[] = [];
    for (const date of sortedDates) {
      cumDiff += dailyDiffMap.get(date) ?? 0;
      timeline.push({ date, cumDiff: Math.round(cumDiff * 100) / 100 });
    }

    radarGrowth.push({
      element,
      totalDiff,
      bpiStart: elementBpiStart,
      bpiEnd: elementBpiEnd,
      songs,
      timeline,
    });
  }

  return radarGrowth;
}
