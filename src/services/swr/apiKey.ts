import { User as FirebaseUser } from "firebase/auth";

export async function generateApiKey(
  url: string,
  fbUser: FirebaseUser | null | undefined,
) {
  const token = await fbUser?.getIdToken();
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to generate API key");
  return res.json();
}
