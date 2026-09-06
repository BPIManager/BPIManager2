import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { fetcherV2 } from "@/services/swr/fetchV2";
import { useState } from "react";
import useSWR from "swr";
import type { SongPlayerEntry, SongPopulationResponse } from "@/types/siteStats";

export function useSongPopulation(order: "top" | "bottom") {
  const [songs, setSongs] = useState<SongPlayerEntry[]>([]);
  const [offset, setOffset] = useState(0);
  const PAGE = 10;

  const url = `${API_V2_PREFIX}/site/songs/popular?order=${order}&offset=${offset}&limit=${PAGE}`;

  const { data, isLoading } = useSWR<SongPopulationResponse>(url, fetcherV2, {
    revalidateOnFocus: false,
    onSuccess(res) {
      setSongs((prev) => {
        const existingIds = new Set(prev.map((s) => s.songId));
        const next = res.songs.filter((s) => !existingIds.has(s.songId));
        return offset === 0 ? res.songs : [...prev, ...next];
      });
    },
  });

  const loadMore = () => setOffset((o) => o + PAGE);
  const hasMore = data ? data.hasMore : false;
  const total = data?.total ?? 0;

  return { songs, isLoading, loadMore, hasMore, total };
}
