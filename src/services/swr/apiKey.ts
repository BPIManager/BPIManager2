import { User as FirebaseUser } from "firebase/auth";
import { authFetch } from "@/utils/common/fetch";

export async function generateApiKey(
  url: string,
  fbUser: FirebaseUser | null | undefined,
) {
  const res = await authFetch(url, "PUT", fbUser ?? null);
  if (!res.ok) throw new Error("Failed to generate API key");
  return res.json();
}
