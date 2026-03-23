import { API_PREFIX } from "@/constants/apiEndpoints";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";
import type { SongDefinitionRecord } from "@/pages/api/v1/songs/[songId]/definitions";

export const useSongDefinitions = (songId: number | null | undefined) => {
  const { data, error, isLoading } = useSWR<SongDefinitionRecord[]>(
    songId != null ? `${API_PREFIX}/songs/${songId}/definitions` : null,
    fetcher,
  );

  return {
    definitions: data,
    isLoading,
    isError: error,
  };
};
