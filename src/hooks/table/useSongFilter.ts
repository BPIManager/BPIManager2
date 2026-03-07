import { useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Difficulties,
  FilterParamsFrontend,
  SongWithScore,
} from "@/types/songs/withScore";
import { filterSongsFrontend } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";

export const PAGE_SIZE = 20;

export const useSongFilter = (data: SongWithScore[] | undefined) => {
  const router = useRouter();
  const { query, isReady } = router;

  const params = useMemo((): FilterParamsFrontend => {
    if (!isReady) return { search: "", sortKey: "bpi", sortOrder: "desc" };

    return {
      search: (query.search as string) || "",
      sortKey: (query.sortKey as any) || "bpi",
      sortOrder: (query.sortOrder as any) || "desc",
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
    };
  }, [query, isReady]);

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
    const filtered = filterSongsFrontend(data, params);
    return sortSongs(filtered, params);
  }, [data, params]);

  const updateParams = (newParams: Partial<FilterParamsFrontend>) => {
    const nextQuery = { ...router.query };
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
    totalCount: displaySongs.length,
  };
};
