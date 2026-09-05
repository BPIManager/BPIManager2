import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

export interface NewBpiPlayerRow {
  userId: string;
  userName: string;
  currentTotal: number;
  hybridTotal: number;
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
 * issue #299〜304検証用「全プレイヤー」一覧。ページ単位でのみサーバー側の
 * BPI再計算を行う(計算量を抑えるため、全公開ユーザー分を一度に読み込まない)。
 * 現行総合BPI(userRadarCacheキャッシュ値)が高い順に固定でソートされる。
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

  const { data, error, isLoading } = useAuthedSWR<PlayersListResponse>(
    `${API_PREFIX}/new-bpi/players?${params.toString()}`,
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
