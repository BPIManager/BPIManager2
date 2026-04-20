import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

export interface IidxTowerEntry {
  playDate: string;
  keyCount: number;
  scratchCount: number;
}

export function useIidxTower(userId: string | undefined) {
  const { fbUser } = useUser();
  const url = userId ? `${API_PREFIX}/users/${userId}/iidx-tower` : null;
  // fbUser is passed to attach auth token when available (required for private profiles)
  return useSWR<IidxTowerEntry[]>(url ? [url, fbUser] : null, fetcher);
}

export interface IidxTowerCompareResult {
  target: IidxTowerEntry[];
  self: IidxTowerEntry[];
}

export function useIidxTowerCompare(targetUserId: string | undefined) {
  const { fbUser } = useUser();
  const url = targetUserId
    ? `${API_PREFIX}/users/${targetUserId}/iidx-tower?compare=true`
    : null;
  return useSWR<IidxTowerCompareResult>(
    url && fbUser ? [url, fbUser] : null,
    fetcher,
  );
}
