import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

export async function deleteAccount(
  userId: string,
  fbUser: FirebaseUser,
  confirmUserName: string,
): Promise<{ ok: boolean; message?: string }> {
  const token = await fbUser.getIdToken();
  const res = await fetch(`${API_PREFIX}/users/${userId}/account`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ confirmUserName }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, message: data.message };
  }
  return { ok: true };
}
