"use client";

import { useState, useMemo, useCallback } from "react";
import { AllScoreFilterParams, AllSongWithScore } from "@/types/songs/allSongs";
import { useAllScores } from "./useAllScores";
import { ALL_DIFFICULTIES, ALL_LEVELS } from "@/constants/levels";

import { PAGE_SIZE } from "@/constants/pagination";
export { PAGE_SIZE };

function filterLocal(
  songs: AllSongWithScore[],
  params: AllScoreFilterParams,
): AllSongWithScore[] {
  return songs.filter((s) => {
    if (
      params.search &&
      !s.title.toLowerCase().includes(params.search.toLowerCase())
    )
      return false;
    if (params.levels?.length && !params.levels.includes(s.difficultyLevel))
      return false;
    if (
      params.difficulties?.length &&
      !params.difficulties.includes(s.difficulty)
    )
      return false;
    if (
      params.clearStates?.length &&
      !params.clearStates.includes(s.clearState ?? "")
    )
      return false;
    return true;
  });
}

function sortLocal(
  songs: AllSongWithScore[],
  params: AllScoreFilterParams,
): AllSongWithScore[] {
  const order = params.sortOrder === "asc" ? 1 : -1;
  return [...songs].sort((a, b) => {
    switch (params.sortKey) {
      case "title":
        return a.title.localeCompare(b.title) * order;
      case "exScore":
        return ((a.exScore ?? -1) - (b.exScore ?? -1)) * order;
      case "updatedAt": {
        const at = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
        const bt = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
        return (at - bt) * order;
      }
      case "scoreRate": {
        const at = ((a.exScore ?? 0) / a.notes) * 2;
        const bt = ((b.exScore ?? 0) / b.notes) * 2;
        return (at - bt) * order;
      }
      case "level":
      default:
        return (
          (a.difficultyLevel - b.difficultyLevel) * order ||
          a.title.localeCompare(b.title)
        );
    }
  });
}

/**
 * 全バージョン楽曲一覧のローカルフィルター・ソート・ページングを管理するフック。
 * フィルター条件変更時はページを 1 に自動リセットする。
 *
 * @param userId - 対象ユーザー ID（未定義の場合はデータ取得しない）
 * @returns フィルターパラメータ・更新関数・ページング情報・表示楽曲配列
 */
export function useAllSongsFilter(userId: string | undefined) {
  const [params, setParams] = useState<AllScoreFilterParams>({
    sortKey: "level",
    sortOrder: "desc",
    levels: [...ALL_LEVELS],
    difficulties: [...ALL_DIFFICULTIES],
  });
  const [page, setPage] = useState(1);

  const { songs, isLoading, error } = useAllScores(userId);

  const updateParams = useCallback((p: Partial<AllScoreFilterParams>) => {
    setParams((prev) => ({ ...prev, ...p }));
    setPage(1);
  }, []);

  const displaySongs = useMemo(() => {
    if (!songs) return [];
    const hasFilter =
      (params.search?.trim() || "") !== "" ||
      (params.levels?.length ?? 0) > 0 ||
      (params.difficulties?.length ?? 0) > 0 ||
      (params.clearStates?.length ?? 0) > 0;

    const filtered = hasFilter ? filterLocal(songs, params) : songs;
    return sortLocal(filtered, params);
  }, [songs, params]);

  const totalCount = displaySongs.length;
  const visibleSongs = displaySongs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return {
    params,
    updateParams,
    page,
    setPage,
    visibleSongs,
    totalCount,
    isLoading,
    error,
  };
}
