import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import type { IIDXVersion } from "@/types/iidx/version";
import { SongWithScore } from "@/types/songs/score";

export async function fetchScoresForVersion(
  userId: string,
  version: IIDXVersion,
  token: string,
): Promise<SongWithScore[]> {
  const url = `${API_PREFIX}/users/${userId}/scores?version=${version}&asOf=latest`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`v${version} の取得に失敗しました`);
  return res.json();
}
