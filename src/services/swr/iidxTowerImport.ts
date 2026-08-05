import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

export async function submitTowerImport(
  userId: string,
  fbUser: FirebaseUser,
  version: string,
  rows: unknown[],
) {
  const response = await authFetch(
    `${API_PREFIX}/users/${userId}/iidx-tower`,
    "POST",
    fbUser,
    { version, rows },
    true,
  );

  if (!response.ok) throw new Error("サーバーエラーが発生しました。");

  return response.json();
}
