import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";

export interface IidxTowerEntry {
  playDate: string;
  keyCount: number;
  scratchCount: number;
}

export function useIidxTower(userId: string | undefined, version?: string) {
  const base = userId ? `${API_PREFIX}/users/${userId}/iidx-tower` : null;
  const url = base
    ? version
      ? `${base}?version=${encodeURIComponent(version)}`
      : base
    : null;
  // 認証トークンは取得できれば付与する（非公開プロフィール向け）
  return useAuthedSWR<IidxTowerEntry[]>(url);
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
    ? `${API_PREFIX}/users/${targetUserId}/iidx-tower`
    : null;
  const url = base
    ? version
      ? `${base}?compare=true&version=${encodeURIComponent(version)}`
      : `${base}?compare=true`
    : null;
  return useAuthedSWR<IidxTowerCompareResult>(fbUser && url ? url : null);
}
