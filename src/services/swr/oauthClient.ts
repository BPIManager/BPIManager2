import { User as FirebaseUser } from "firebase/auth";

export async function issueOAuthClient(
  url: string,
  fbUser: FirebaseUser | null | undefined,
  redirectUris: string[],
) {
  const token = await fbUser?.getIdToken();
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ redirect_uris: redirectUris }),
  });
  if (!res.ok) throw new Error("Failed to issue OAuth client");
  return res.json();
}

export async function deleteOAuthClient(
  url: string,
  fbUser: FirebaseUser | null | undefined,
) {
  const token = await fbUser?.getIdToken();
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete OAuth client");
}
