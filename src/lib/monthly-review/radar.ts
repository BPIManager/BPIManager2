import { BpiCalculator } from "@/lib/bpi";
import { ALL_CATEGORIES } from "@/lib/radar/calculator";
import { topElementMap } from "@/constants/iidx/radars/topElements";
import type {
  TopSong,
  TopSongImproved,
  RadarGrowthEntry,
} from "@/types/stats/monthlyReview";
import type { IBpiBasicSongData, IBpiScoreObservation } from "@/types/songs/bpi";

type SongMeta = IBpiBasicSongData & {
  songId: number;
  title: string;
  difficulty: string;
};

function observationsFor(
  exScoreBySong: Map<number, number>,
  songById: Map<number, SongMeta>,
): IBpiScoreObservation[] {
  return Array.from(exScoreBySong.entries()).map(([songId, exScore]) => ({
    songId,
    notes: songById.get(songId)?.notes ?? 0,
    exScore,
  }));
}

export function buildRadarGrowth(
  topImprovedSongs: TopSongImproved[],
  allL12SongMeta: SongMeta[],
  songUpdateDateMap: Map<number, string>,
  viewerPreMonthExScoreMap: Map<number, number>,
  viewerFinalExScoreMap: Map<number, number>,
  /**
   * 比較先バージョンにそのユーザーのデータが1件も無く伸び幅を計算できない場合の
   * フォールバック用リスト（通常はtopBpiSongs）。`topImprovedSongs`が空の
   * ときだけ使い、BPI降順の単純なランキングとして各要素に振り分ける
   * （diff/bpiBefore/bpiAfterは意味を持たないダミー値になる）
   */
  fallbackTopSongs?: TopSong[],
): RadarGrowthEntry[] {
  const songById = new Map(allL12SongMeta.map((s) => [s.songId, s]));
  const elementSongsMap = new Map<string, TopSongImproved[]>();
  ALL_CATEGORIES.forEach((cat) => elementSongsMap.set(cat, []));

  const usingFallback = topImprovedSongs.length === 0 && !!fallbackTopSongs?.length;

  if (usingFallback) {
    for (const song of fallbackTopSongs!) {
      if (song.difficultyLevel !== 12) continue;
      const key = `${song.title}___${song.difficulty}`;
      const cat = topElementMap.get(key);
      if (cat) {
        elementSongsMap.get(cat)!.push({
          ...song,
          bpiBefore: song.bpi,
          bpiAfter: song.bpi,
          diff: 0,
        });
      }
    }
    for (const cat of ALL_CATEGORIES) {
      elementSongsMap.get(cat)!.sort((a, b) => b.bpi - a.bpi);
    }
  } else {
    for (const song of topImprovedSongs) {
      if (song.diff <= 0 || song.difficultyLevel !== 12) continue;
      const key = `${song.title}___${song.difficulty}`;
      const cat = topElementMap.get(key);
      if (cat) elementSongsMap.get(cat)!.push(song);
    }
  }

  const elementSongsMetaMap = new Map<string, SongMeta[]>();
  ALL_CATEGORIES.forEach((cat) => elementSongsMetaMap.set(cat, []));
  for (const s of allL12SongMeta) {
    const key = `${s.title}___${s.difficulty}`;
    const cat = topElementMap.get(key);
    if (cat) elementSongsMetaMap.get(cat)!.push(s);
  }

  // 潜在スキル推定はカテゴリを問わずユーザーの月初/月末それぞれの全観測を使う
  const preMonthObservations = observationsFor(viewerPreMonthExScoreMap, songById);
  const finalObservations = observationsFor(viewerFinalExScoreMap, songById);

  const radarGrowth: RadarGrowthEntry[] = [];
  for (const element of ALL_CATEGORIES) {
    const songs = elementSongsMap.get(element) ?? [];
    const elementSongs = elementSongsMetaMap.get(element) ?? [];
    if (elementSongs.length === 0) continue;

    const elementBpiStart =
      Math.round(
        BpiCalculator.calculateTotalBPI(preMonthObservations, elementSongs) * 100,
      ) / 100;
    const elementBpiEnd =
      Math.round(
        BpiCalculator.calculateTotalBPI(finalObservations, elementSongs) * 100,
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
