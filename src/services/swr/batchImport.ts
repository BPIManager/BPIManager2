import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

export async function submitBatchImport(
  userId: string,
  fbUser: FirebaseUser,
  version: string,
  csvRows: unknown[],
) {
  const response = await authFetch(
    `${API_PREFIX}/users/${userId}/scores/bulk`,
    "POST",
    fbUser,
    { version, csvRows },
    true,
  );

  if (!response.ok) throw new Error("サーバーエラーが発生しました。");

  return response.json();
}
