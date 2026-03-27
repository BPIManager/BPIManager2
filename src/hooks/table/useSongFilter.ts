import { useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Difficulties,
  FilterParamsFrontend,
  SongWithScore,
} from "@/types/songs/withScore";
import { filterSongsFrontend } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";

import { PAGE_SIZE } from "@/constants/pagination";
export { PAGE_SIZE };

const toFilterKey = (q: Record<string, any>) => {
  const { page: _page, ...rest } = q;
  return JSON.stringify(rest);
};

export const useSongFilter = (data: SongWithScore[] | undefined) => {
  const router = useRouter();
  const { query, isReady } = router;

  const params = useMemo((): FilterParamsFrontend => {
    if (!isReady) return { search: "", sortKey: "bpi", sortOrder: "desc" };

    return {
      search: (query.search as string) || "",
      sortKey: (query.sortKey as any) || "bpi",
      sortOrder: (query.sortOrder as any) || "desc",
      compareVersion: (query.compareVersion as string) || undefined,
      levels: query.levels
        ? (query.levels as string).split(",").map(Number)
        : [],
      difficulties: query.difficulties
        ? ((query.difficulties as string).split(",") as Difficulties[])
        : [],
      bpmMin: query.bpmMin ? Number(query.bpmMin) : undefined,
      bpmMax: query.bpmMax ? Number(query.bpmMax) : undefined,
      isSofran: query.isSofran === "true",
      since: query.since as FilterParamsFrontend["since"],
      until: query.until as string,
      versions: query.versions
        ? (query.versions as string).split(",").map(Number)
        : [],
      clearStates: query.clearStates
        ? (query.clearStates as string).split(",")
        : [],
      isMyPlayed:
        query.isMyPlayed === undefined
          ? undefined
          : query.isMyPlayed === "true",
      isRivalPlayed:
        query.isRivalPlayed === undefined
          ? undefined
          : query.isRivalPlayed === "true",
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
        const rs = s as any;
        return params.isRivalPlayed
          ? rs.rival?.exScore !== null
          : rs.rival?.exScore === null;
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
