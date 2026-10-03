import { useMemo } from "react";
import { SongWithScore } from "@/types/songs/score";

/**
 * useCompareScores 系が返す別バージョンの比較データを、表示中の楽曲へ songId-difficulty をキーにマージする。
 * /my/[version] と /my/all/[version] で共通のため切り出す。
 *
 * @param songs - フィルタ前の全楽曲配列
 * @param visibleSongs - ページング後の表示対象楽曲配列
 * @param compareData - 比較先バージョンのスコア配列
 * @param compareVersion - 比較先バージョン（"none" または未指定ならマージしない）
 */
export const useMergedCompareSongs = (
  songs: SongWithScore[] | undefined,
  visibleSongs: SongWithScore[],
  compareData: SongWithScore[] | undefined,
  compareVersion: string | undefined,
) => {
  const mergedSongs = useMemo(() => {
    if (!songs || !compareData || !compareVersion || compareVersion === "none") {
      return songs;
    }
    const compareMap = new Map(
      compareData.map((s) => [`${s.songId}-${s.difficulty}`, s]),
    );
    return songs.map((song) => {
      const key = `${song.songId}-${song.difficulty}`;
      const cmp = compareMap.get(key);
      if (!cmp) return song;
      const prevEx = cmp.rival?.exScore ?? null;
      const prevBpi = cmp.rival?.bpi ?? null;
      return {
        ...song,
        rival: cmp.rival ?? null,
        exDiff:
          song.exScore !== null && prevEx !== null
            ? song.exScore - prevEx
            : undefined,
        bpiDiff:
          song.bpi != null && prevBpi !== null
            ? Math.round((song.bpi - prevBpi) * 100) / 100
            : undefined,
      };
    });
  }, [songs, compareData, compareVersion]);

  const mergedVisible = useMemo(() => {
    if (!mergedSongs) return visibleSongs;
    const mergedMap = new Map(
      mergedSongs.map((s) => [`${s.songId}-${s.difficulty}`, s]),
    );
    return visibleSongs.map(
      (s) => mergedMap.get(`${s.songId}-${s.difficulty}`) ?? s,
    );
  }, [visibleSongs, mergedSongs]);

  return { mergedSongs, mergedVisible };
};
