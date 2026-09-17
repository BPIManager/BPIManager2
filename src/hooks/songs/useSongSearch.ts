import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { latestVersion } from "@/constants/iidx/iidxVersions";

export interface SongSearchResult {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  bpm: string | null;
  releasedVersion: number | null;
}

/**
 * 曲名で楽曲を検索する。`query`が空文字の間はフェッチしない。
 */
export const useSongSearch = (
  query: string,
  options?: { difficultyLevel?: number; version?: string },
) => {
  const trimmed = query.trim();
  const version = options?.version ?? latestVersion;
  const url =
    trimmed.length > 0
      ? `${API_V2_PREFIX}/songs/search?title=${encodeURIComponent(trimmed)}&version=${version}${
          options?.difficultyLevel !== undefined
            ? `&difficultyLevel=${options.difficultyLevel}`
            : ""
        }`
      : null;

  const { data, isLoading, error } = useAuthedSWRV2<SongSearchResult[]>(url, {
    revalidateOnFocus: false,
    dedupingInterval: 300,
  });

  return { songs: data ?? [], isLoading, isError: error };
};
