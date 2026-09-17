import { User as FirebaseUser } from "firebase/auth";
import { authFetch } from "@/utils/common/fetch";

export async function deleteOAuthClient(
  url: string,
  fbUser: FirebaseUser | null | undefined,
) {
  const res = await authFetch(url, "DELETE", fbUser ?? null);
  if (!res.ok) throw new Error("Failed to delete OAuth client");
}
