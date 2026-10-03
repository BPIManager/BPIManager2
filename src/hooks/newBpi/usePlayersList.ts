import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

export interface NewBpiPlayerRow {
  userId: string;
  userName: string;
  currentTotal: number;
  fullNewTotal: number | null;
  increaseCount: number;
  decreaseCount: number;
  comparableCount: number;
}

interface PlayersListResponse {
  players: NewBpiPlayerRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PlayersListBpiFilter {
  min?: number;
  max?: number;
}

/**
 * NewBpiComparison の全プレイヤー一覧。ページ単位でのみサーバー側の BPI 再計算を行い、現行総合BPI（キャッシュ値）の高い順に固定ソートする。
 */
export const usePlayersList = (
  page: number,
  pageSize: number = 20,
  bpiFilter?: PlayersListBpiFilter,
) => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (bpiFilter?.min !== undefined) params.set("bpiMin", String(bpiFilter.min));
  if (bpiFilter?.max !== undefined) params.set("bpiMax", String(bpiFilter.max));

  const { data, error, isLoading } = useAuthedSWRV2<PlayersListResponse>(
    `${API_V2_PREFIX}/new-bpi/players?${params.toString()}`,
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  return {
    players: data?.players ?? [],
    totalCount: data?.totalCount ?? 0,
    pageSize: data?.pageSize ?? pageSize,
    isLoading,
    isError: error,
  };
};
