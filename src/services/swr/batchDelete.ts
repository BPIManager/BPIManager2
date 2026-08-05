import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

export async function deleteBatch(
  userId: string,
  batchId: string,
  fbUser: FirebaseUser,
): Promise<{ ok: boolean; message?: string }> {
  const res = await authFetch(
    `${API_PREFIX}/users/${userId}/batches/${batchId}`,
    "DELETE",
    fbUser,
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, message: data.message };
  }
  return { ok: true };
}
