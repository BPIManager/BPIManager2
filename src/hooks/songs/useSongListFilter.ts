"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useSongList } from "@/hooks/songs/useSongList";
import { useDebouncedSearch } from "@/hooks/common/useDebouncedSearch";
import { filterAndSortSongs } from "@/utils/songs/songListFilter";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { SONG_ATTRIBUTES } from "@/constants/iidx/songAttributes";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import type { SortKey, SortDir } from "@/types/songs/songList";

const VALID_SORT_KEYS = new Set<string>([
  "title",
  "notes",
  "bpm",
  ...SONG_ATTRIBUTES.map((a) => a.sortKey),
]);
const VALID_DIFFICULTIES: string[] = [...IIDX_DIFFICULTIES];
const DEFAULT_DIFFICULTIES = new Set(IIDX_DIFFICULTIES);
const LEVELS = new Set(["12"]);

function parseDiff(val: string | string[] | undefined): Set<string> {
  if (typeof val !== "string") return new Set(DEFAULT_DIFFICULTIES);
  const parsed = val.split(",").filter((d) => VALID_DIFFICULTIES.includes(d));
  return parsed.length > 0 ? new Set(parsed) : new Set(DEFAULT_DIFFICULTIES);
}

function parseSortKey(val: string | string[] | undefined): SortKey {
  if (typeof val === "string" && VALID_SORT_KEYS.has(val))
    return val as SortKey;
  return "title";
}

function parseSortDir(val: string | string[] | undefined): SortDir {
  if (val === "asc" || val === "desc") return val;
  return "asc";
}

export function useSongListFilter() {
  const router = useRouter();
  const version = (router.query.version as string) || latestVersion;

  const [committedSearch, setCommittedSearch] = useState("");
  const [difficulties, setDifficulties] =
    useState<Set<string>>(DEFAULT_DIFFICULTIES);
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!router.isReady || initializedRef.current) return;
    initializedRef.current = true;
    const q = router.query;
    setCommittedSearch(typeof q.q === "string" ? q.q : "");
    setDifficulties(parseDiff(q.diff));
    setSortKey(parseSortKey(q.sort));
    setSortDir(parseSortDir(q.dir));
    // router.isReadyがtrueになった最初の1回だけURLからの初期化を行いたいため、
    // router自体(毎レンダーで参照が変わりうる)は依存に含めない(initializedRefで二重実行も防止)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady || !initializedRef.current) return;
    const newQuery: Record<string, string> = {};
    if (version !== latestVersion) newQuery.version = version;
    if (committedSearch) newQuery.q = committedSearch;
    newQuery.diff = [...difficulties].join(",");
    newQuery.sort = sortKey;
    newQuery.dir = sortDir;
    router.replace({ query: newQuery }, undefined, { shallow: true });
    // router/versionをフィルタ状態の変化だけで反映させたいため依存に含めない。
    // routerを含めるとrouter.replace自体が引き起こすrouter変化で再実行される
    // フィードバックループになりうる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedSearch, difficulties, sortKey, sortDir]);

  const { songs, isLoading, isError } = useSongList(version);

  const { localSearch, setLocalSearch, isTyping } = useDebouncedSearch(
    committedSearch,
    setCommittedSearch,
    300,
  );

  const handleVersionChange = useCallback(
    (v: string) => {
      router.push({ query: { ...router.query, version: v } }, undefined, {
        shallow: true,
      });
    },
    [router],
  );

  const toggleDifficulty = useCallback((diff: string) => {
    setDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(diff)) {
        next.delete(diff);
      } else {
        next.add(diff);
      }
      return next;
    });
  }, []);

  const handleSortClick = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  const filteredSongs = useMemo(
    () =>
      filterAndSortSongs(
        songs,
        committedSearch,
        LEVELS,
        difficulties,
        sortKey,
        sortDir,
        "global",
      ),
    [songs, committedSearch, difficulties, sortKey, sortDir],
  );

  return {
    version,
    handleVersionChange,
    localSearch,
    setLocalSearch,
    isTyping,
    difficulties,
    toggleDifficulty,
    sortKey,
    sortDir,
    handleSortClick,
    isLoading,
    isError,
    filteredSongs,
    totalCount: songs.length,
  };
}
