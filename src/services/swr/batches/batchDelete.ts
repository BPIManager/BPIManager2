import { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

export async function deleteBatch(
  userId: string,
  batchId: string,
  fbUser: FirebaseUser,
): Promise<{ ok: boolean; message?: string }> {
  const res = await authFetch(
    `${API_V2_PREFIX}/users/${userId}/batches/${batchId}`,
    "DELETE",
    fbUser,
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    return { ok: false, message: data?.errorMessage ?? data?.message };
  }
  return { ok: true };
}
