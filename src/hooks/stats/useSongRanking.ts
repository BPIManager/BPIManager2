import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useSongRankingQueryV2 } from "@/hooks/common/useSongRankingQueryV2";

export const useSongRanking = (
  songId: number | null,
  version: string | null,
) =>
  useSongRankingQueryV2(songId, version, (uid, songId, version) =>
    `${API_V2_PREFIX}/users/${uid}/ranking/song/${songId}?version=${version}`,
  );
