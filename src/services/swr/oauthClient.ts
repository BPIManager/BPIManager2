import { User as FirebaseUser } from "firebase/auth";
import { authFetch } from "@/utils/common/fetch";

export async function issueOAuthClient(
  url: string,
  fbUser: FirebaseUser | null | undefined,
  redirectUris: string[],
) {
  const res = await authFetch(url, "PUT", fbUser ?? null, {
    redirect_uris: redirectUris,
  });
  if (!res.ok) throw new Error("Failed to issue OAuth client");
  return res.json();
}

export async function deleteOAuthClient(
  url: string,
  fbUser: FirebaseUser | null | undefined,
) {
  const res = await authFetch(url, "DELETE", fbUser ?? null);
  if (!res.ok) throw new Error("Failed to delete OAuth client");
}
