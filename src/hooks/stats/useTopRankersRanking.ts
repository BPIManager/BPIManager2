import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import type { TopRankersRankingResponse } from "@/types/users/ranking";

/** 県別（トップランカー）の1位保持数ランキングを取得する */
export const useTopRankersRanking = (params: {
  version: string;
  /** eagateのpref_id（0=全国） */
  area: string;
  levels: number[];
  difficulties: string[];
}) => {
  const { fbUser } = useUser();
  const { version, area, levels, difficulties } = params;

  const query = new URLSearchParams({ version, area });
  if (levels.length > 0) query.set("levels", levels.join(","));
  if (difficulties.length > 0) query.set("difficulties", difficulties.join(","));

  const { data, isLoading, error } = useAuthedSWRV2<TopRankersRankingResponse>(
    fbUser
      ? `${API_V2_PREFIX}/users/${fbUser.uid}/ranking/top-rankers?${query.toString()}`
      : null,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
