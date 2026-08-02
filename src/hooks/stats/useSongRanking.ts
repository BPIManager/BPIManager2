import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { useSongRankingQuery } from "@/hooks/common/useSongRankingQuery";

export const useSongRanking = (
  songId: number | null,
  version: string | null,
) =>
  useSongRankingQuery(songId, version, (uid, songId, version) =>
    `${API_PREFIX}/users/${uid}/ranking/song/${songId}?version=${version}`,
  );
