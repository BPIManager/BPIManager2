import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { useUser } from "@/contexts/users/UserContext";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import type { RadarFilterKey, RadarFilterRange, RecommendedUser } from "@/types/users/list";

interface UserListResponse {
  viewer: {
    userId: string;
    version: string;
    totalBpi: number;
    radar: Record<string, number>;
  };
  users: RecommendedUser[];
}

/**
 * フォロー候補ユーザー一覧を取得する。
 *
 * @param q - 検索クエリ文字列（デフォルト: `""`）
 * @param page - ページ番号（デフォルト: `1`）
 * @param sort - ソートキー（デフォルト: `"totalBpi"`）
 * @param order - 並び順（デフォルト: `"distance"` = レーダー距離順）
 * @param version - 対象バージョン（デフォルト: `latestVersion`）
 * @param filters - レーダーカテゴリ・総合BPIのmin/max範囲絞り込み（全条件AND）
 */
export const useUserList = (
  q: string = "",
  page: number = 1,
  sort: string = "totalBpi",
  order: string = "distance",
  seed?: number,
  version: string = latestVersion,
  filters: Partial<Record<RadarFilterKey, RadarFilterRange>> = {},
) => {
  const { fbUser } = useUser();

  const searchParams = new URLSearchParams();
  if (q) searchParams.append("q", q);
  searchParams.append("p", page.toString());
  searchParams.append("s", sort);
  searchParams.append("o", order);
  searchParams.append("v", version);
  if (seed !== undefined) searchParams.append("seed", seed.toString());
  for (const [key, range] of Object.entries(filters)) {
    if (!range) continue;
    if (range.min !== undefined) searchParams.append(`${key}Min`, range.min.toString());
    if (range.max !== undefined) searchParams.append(`${key}Max`, range.max.toString());
  }

  const { data, error, isLoading, mutate } = useAuthedSWRV2<UserListResponse>(
    fbUser
      ? `${API_V2_PREFIX}/users/${fbUser.uid}/rivals/suggestions?${searchParams.toString()}`
      : null,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error, mutate };
};
