import { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

export interface ManualScoreUpdateResult {
  songId: number;
  exScore: number;
  bpi: number | null;
  totalBpi: number;
  batchId: string;
}

export async function saveManualScore(
  userId: string,
  params: { songId: number; version: string; exScore: number },
  fbUser: FirebaseUser,
): Promise<{ ok: boolean; message?: string; data?: ManualScoreUpdateResult }> {
  const res = await authFetch(
    `${API_V2_PREFIX}/users/${userId}/scores/manual`,
    "POST",
    fbUser,
    params,
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    return { ok: false, message: data?.errorMessage ?? data?.message };
  }
  return { ok: true, data: data?.body };
}
