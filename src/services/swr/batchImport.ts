import { API_PREFIX } from "@/constants/logic/apiEndpoints";

export async function submitBatchImport(
  userId: string,
  idToken: string,
  version: string,
  csvRows: unknown[],
) {
  const response = await fetch(`${API_PREFIX}/users/${userId}/scores/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ version, csvRows }),
  });

  if (!response.ok) throw new Error("サーバーエラーが発生しました。");

  return response.json();
}
