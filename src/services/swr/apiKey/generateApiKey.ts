import { User as FirebaseUser } from "firebase/auth";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

export async function generateApiKey(
  url: string,
  fbUser: FirebaseUser | null | undefined,
): Promise<{ key: string }> {
  const res = await authFetch(url, "PUT", fbUser ?? null);
  if (!res.ok) throw new Error("Failed to generate API key");
  return unwrapApiResponse<{ key: string }>(res);
}
