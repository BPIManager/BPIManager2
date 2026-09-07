import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";

export interface IidxTowerEntry {
  playDate: string;
  keyCount: number;
  scratchCount: number;
}

export function useIidxTower(userId: string | undefined, version?: string) {
  const base = userId ? `${API_V2_PREFIX}/users/${userId}/iidx-tower` : null;
  const url = base
    ? version
      ? `${base}?version=${encodeURIComponent(version)}`
      : base
    : null;
  // 認証トークンは取得できれば付与する（非公開プロフィール向け）
  return useAuthedSWRV2<IidxTowerEntry[]>(url);
}

export interface IidxTowerCompareResult {
  target: IidxTowerEntry[];
  self: IidxTowerEntry[];
}

export function useIidxTowerCompare(
  targetUserId: string | undefined,
  version?: string,
) {
  const { fbUser } = useUser();
  const base = targetUserId
    ? `${API_V2_PREFIX}/users/${targetUserId}/iidx-tower`
    : null;
  const url = base
    ? version
      ? `${base}?compare=true&version=${encodeURIComponent(version)}`
      : `${base}?compare=true`
    : null;
  return useAuthedSWRV2<IidxTowerCompareResult>(fbUser && url ? url : null);
}
