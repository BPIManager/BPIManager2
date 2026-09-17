import { User as FirebaseUser } from "firebase/auth";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

export async function issueOAuthClient(
  url: string,
  fbUser: FirebaseUser | null | undefined,
  redirectUris: string[],
): Promise<{ clientId: string; clientSecret: string; redirectUris: string[] }> {
  const res = await authFetch(url, "PUT", fbUser ?? null, {
    redirect_uris: redirectUris,
  });
  if (!res.ok) throw new Error("Failed to issue OAuth client");
  return unwrapApiResponse(res);
}
