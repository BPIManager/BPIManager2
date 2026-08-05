import { API_PREFIX } from "@/constants/logic/apiEndpoints";

export async function submitTowerImport(
  userId: string,
  idToken: string,
  version: string,
  rows: unknown[],
) {
  const response = await fetch(`${API_PREFIX}/users/${userId}/iidx-tower`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ version, rows }),
  });

  if (!response.ok) throw new Error("サーバーエラーが発生しました。");

  return response.json();
}
