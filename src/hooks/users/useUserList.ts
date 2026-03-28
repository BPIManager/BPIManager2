import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import type { RecommendedUser } from "@/types/users/list";

interface UserListResponse {
  viewer: {
    userId: string;
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
 * @returns ユーザーリストデータ・ローディング状態・エラー・更新関数
 */
export const useUserList = (
  q: string = "",
  page: number = 1,
  sort: string = "totalBpi",
  order: string = "distance",
) => {
  const { fbUser } = useUser();

  const searchParams = new URLSearchParams();
  if (q) searchParams.append("q", q);
  searchParams.append("p", page.toString());
  searchParams.append("s", sort);
  searchParams.append("o", order);

  const { data, error, isLoading, mutate } = useSWR<UserListResponse>(
    fbUser
      ? [
          `${API_PREFIX}/users/${fbUser?.uid}/rivals/suggestions?${searchParams.toString()}`,
          fbUser,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error, mutate };
};
