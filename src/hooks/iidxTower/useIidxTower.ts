import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

export interface IidxTowerEntry {
  playDate: string;
  keyCount: number;
  scratchCount: number;
}

export function useIidxTower(userId: string | undefined, version?: string) {
  const { fbUser } = useUser();
  const base = userId ? `${API_PREFIX}/users/${userId}/iidx-tower` : null;
  const url = base
    ? version
      ? `${base}?version=${encodeURIComponent(version)}`
      : base
    : null;
  // fbUser is passed to attach auth token when available (required for private profiles)
  return useSWR<IidxTowerEntry[]>(url ? [url, fbUser] : null, fetcher);
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
  return useSWR<IidxTowerCompareResult>(
    url && fbUser ? [url, fbUser] : null,
    fetcher,
  );
}
