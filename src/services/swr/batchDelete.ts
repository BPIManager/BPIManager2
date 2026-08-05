import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

export async function deleteBatch(
  userId: string,
  batchId: string,
  fbUser: FirebaseUser,
): Promise<{ ok: boolean; message?: string }> {
  const token = await fbUser.getIdToken();
  const res = await fetch(`${API_PREFIX}/users/${userId}/batches/${batchId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, message: data.message };
  }
  return { ok: true };
}
