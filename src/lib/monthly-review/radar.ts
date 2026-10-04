import { BpiCalculator } from "@/lib/bpi";
import dayjs from "@/lib/dayjs";
import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
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

/**
 * 月内の実スコア更新履歴を月初のスコアから時系列に再生し、この要素の総合BPIの月初からの伸びを日別に返す。
 * 開始・終了値と同じ観測集合（全曲）で計算するため、最終点は totalDiff と一致する。
 */
function buildElementTimelineFromHistory(
  ownerInMonthHistory: {
    songId: number;
    exScore: number | null;
    lastPlayed: Date | string;
  }[],
  elementSongIds: Set<number>,
  elementSongs: SongMeta[],
  elementBpiStart: number,
  preMonthExScoreMap: Map<number, number>,
  songById: Map<number, SongMeta>,
): { date: string; cumDiff: number }[] {
  const byDate = new Map<string, typeof ownerInMonthHistory>();
  for (const entry of ownerInMonthHistory) {
    const dateStr = dayjs(entry.lastPlayed as Parameters<typeof dayjs>[0])
      .tz()
      .format("YYYY-MM-DD");
    const arr = byDate.get(dateStr) ?? [];
    arr.push(entry);
    byDate.set(dateStr, arr);
  }

  const scoreMap = new Map(preMonthExScoreMap);
  const timeline: { date: string; cumDiff: number }[] = [];
  for (const date of Array.from(byDate.keys()).sort()) {
    const updates = byDate.get(date)!;
    for (const update of updates) {
      if (update.exScore != null) scoreMap.set(update.songId, Number(update.exScore));
    }
    if (!updates.some((u) => elementSongIds.has(u.songId))) continue;
    const currentBpi =
      Math.round(
        BpiCalculator.calculateTotalBPI(
          observationsFor(scoreMap, songById),
          elementSongs,
        ) * 100,
      ) / 100;
    timeline.push({
      date,
      cumDiff: Math.round((currentBpi - elementBpiStart) * 100) / 100,
    });
  }
  return timeline;
}

export function buildRadarGrowth(
  topImprovedSongs: TopSongImproved[],
  allL12SongMeta: SongMeta[],
  viewerPreMonthExScoreMap: Map<number, number>,
  viewerFinalExScoreMap: Map<number, number>,
  /**
   * 伸び幅を計算できない場合のフォールバック用リスト（通常は topBpiSongs）。topImprovedSongs が空のときのみ使う。
   * BPI 降順の単純ランキングのため、diff/bpiBefore/bpiAfter は意味を持たないダミー値になる。
   */
  fallbackTopSongs?: TopSong[],
  /** フォールバック時の「純粋な成長推移」再計算用（省略時は空扱い） */
  ownerInMonthHistory?: { songId: number; exScore: number | null; lastPlayed: Date | string }[],
): RadarGrowthEntry[] {
  const songById = new Map(allL12SongMeta.map((s) => [s.songId, s]));
  const elementSongsMap = new Map<string, TopSongImproved[]>();
  ALL_RADAR_CATEGORIES.forEach((cat) => elementSongsMap.set(cat, []));

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
    for (const cat of ALL_RADAR_CATEGORIES) {
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
  ALL_RADAR_CATEGORIES.forEach((cat) => elementSongsMetaMap.set(cat, []));
  for (const s of allL12SongMeta) {
    const key = `${s.title}___${s.difficulty}`;
    const cat = topElementMap.get(key);
    if (cat) elementSongsMetaMap.get(cat)!.push(s);
  }

  // 潜在スキル推定はカテゴリを問わずユーザーの月初/月末それぞれの全観測を使う
  const preMonthObservations = observationsFor(viewerPreMonthExScoreMap, songById);
  const finalObservations = observationsFor(viewerFinalExScoreMap, songById);

  const radarGrowth: RadarGrowthEntry[] = [];
  for (const element of ALL_RADAR_CATEGORIES) {
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

    const timeline = buildElementTimelineFromHistory(
      ownerInMonthHistory ?? [],
      new Set(elementSongs.map((s) => s.songId)),
      elementSongs,
      elementBpiStart,
      viewerPreMonthExScoreMap,
      songById,
    );

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
