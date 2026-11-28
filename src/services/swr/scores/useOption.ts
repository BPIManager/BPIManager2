import { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

/**
 * 記録の使用オプションを保存する（曲詳細の履歴タブ、#708）。useOption が null なら未設定に戻す
 */
export async function saveUseOption(
  userId: string,
  params: { logId: number; songDomain: "bpi" | "allSongs"; useOption: string | null },
  fbUser: FirebaseUser,
): Promise<{ ok: boolean; message?: string }> {
  const res = await authFetch(`${API_V2_PREFIX}/users/${userId}/scores/use-option`, "PATCH", fbUser, params);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) return { ok: false, message: data?.errorMessage ?? data?.message };
  return { ok: true };
}
