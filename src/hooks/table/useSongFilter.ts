import { useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import {
  FilterParamsFrontend,
  SongWithScore,
} from "@/types/songs/score";
import { filterSongsFrontend } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";

import { PAGE_SIZE } from "@/constants/pagination";
import { IidxDifficulty } from "@/types/iidx/difficulty";
export { PAGE_SIZE };

const toFilterKey = (q: ParsedUrlQuery) => {
  const { page: _page, ...rest } = q;
  return JSON.stringify(rest);
};

/**
 * URL クエリパラメータと連動した楽曲フィルター・ソート・ページングを管理するフック。
 * フィルター条件変更時はページを 1 に自動リセットする。
 *
 * @param data - フィルタリング対象の全楽曲スコア配列
 * @returns フィルターパラメータ・更新関数・ページング情報・表示楽曲配列
 */
export const useSongFilter = (data: SongWithScore[] | undefined) => {
  const router = useRouter();
  const { query, isReady } = router;

  const params = useMemo((): FilterParamsFrontend => {
    if (!isReady) return { search: "", sortKey: "bpi", sortOrder: "desc" };

    const q = query as Record<string, string | undefined>;
    return {
      search: q.search || "",
      sortKey: (q.sortKey as FilterParamsFrontend["sortKey"]) || "bpi",
      sortOrder: (q.sortOrder as FilterParamsFrontend["sortOrder"]) || "desc",
      compareVersion: q.compareVersion || undefined,
      levels: q.levels ? q.levels.split(",").map(Number) : [],
      difficulties: q.difficulties
        ? (q.difficulties.split(",") as IidxDifficulty[])
        : [],
      bpmMin: q.bpmMin ? Number(q.bpmMin) : undefined,
      bpmMax: q.bpmMax ? Number(q.bpmMax) : undefined,
      isSofran: q.isSofran === "true",
      since: q.since,
      until: q.until,
      versions: q.versions ? q.versions.split(",").map(Number) : [],
      clearStates: q.clearStates ? q.clearStates.split(",") : [],
      isMyPlayed:
        q.isMyPlayed === undefined ? undefined : q.isMyPlayed === "true",
      isRivalPlayed:
        q.isRivalPlayed === undefined ? undefined : q.isRivalPlayed === "true",
    };
  }, [query, isReady]);

  const prevFilterKey = useRef<string | null>(null);
  useEffect(() => {
    if (!isReady) return;
    const key = toFilterKey(query);
    if (prevFilterKey.current === null) {
      prevFilterKey.current = key;
      return;
    }
    if (prevFilterKey.current !== key && query.page !== undefined) {
      prevFilterKey.current = key;
      const { page: _page, ...rest } = query;
      router.replace({ query: rest }, undefined, { shallow: true });
    } else {
      prevFilterKey.current = key;
    }
  }, [isReady, query]);

  const page = useMemo(() => Number(query.page) || 1, [query.page]);

  const displaySongs = useMemo(() => {
    if (!data) return [];
    const hasFilter =
      params.search?.trim() !== "" ||
      (params.levels?.length ?? 0) > 0 ||
      (params.difficulties?.length ?? 0) > 0 ||
      (params.versions?.length ?? 0) > 0 ||
      params.bpmMin !== undefined ||
      params.bpmMax !== undefined ||
      params.isSofran ||
      params.since !== undefined ||
      params.until !== undefined;

    if (!hasFilter) {
      return [];
    }
    let filtered = filterSongsFrontend(data, params);
    if (params.isMyPlayed !== undefined) {
      filtered = filtered.filter((s) =>
        params.isMyPlayed ? s.exScore !== null : s.exScore === null,
      );
    }

    if (params.isRivalPlayed !== undefined) {
      filtered = filtered.filter((s) => {
        return params.isRivalPlayed
          ? s.rival?.exScore !== null
          : s.rival?.exScore === null;
      });
    }
    return sortSongs(filtered, params);
  }, [data, params]);

  const totalCount = displaySongs.length;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  useEffect(() => {
    if (!isReady || totalCount === 0) return;
    if (page > totalPages) {
      router.replace({ query: { ...query, page: totalPages } }, undefined, {
        shallow: true,
      });
    }
  }, [totalPages, page, isReady]);

  const updateParams = (newParams: Partial<FilterParamsFrontend>) => {
    const nextQuery = { ...router.query };
    delete nextQuery.page;
    Object.entries(newParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) nextQuery[key] = value.join(",");
        else delete nextQuery[key];
      } else if (value === "" || value === undefined || value === null) {
        delete nextQuery[key];
      } else {
        nextQuery[key] = String(value);
      }
    });

    router.push({ query: nextQuery }, undefined, { shallow: true });
  };

  const setPage = (newPage: number) => {
    router.push({ query: { ...query, page: newPage } }, undefined, {
      shallow: true,
    });
  };

  const visibleSongs = useMemo(() => {
    const startRange = (page - 1) * PAGE_SIZE;
    return displaySongs.slice(startRange, startRange + PAGE_SIZE);
  }, [displaySongs, page]);

  return {
    params,
    updateParams,
    page,
    setPage,
    displaySongs,
    visibleSongs,
    totalCount,
    totalPages,
  };
};
