import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

export async function deleteAccount(
  userId: string,
  fbUser: FirebaseUser,
  confirmUserName: string,
): Promise<{ ok: boolean; message?: string }> {
  const res = await authFetch(
    `${API_PREFIX}/users/${userId}/account`,
    "DELETE",
    fbUser,
    { confirmUserName },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, message: data.message };
  }
  return { ok: true };
}
