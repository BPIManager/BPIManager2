import { User as FirebaseUser } from "firebase/auth";
import type { PatternsPage } from "@/hooks/songs/useSongPatterns";

export async function fetchSongPatternsPage(
  url: string,
  fbUser: FirebaseUser | null,
): Promise<PatternsPage> {
  const token = fbUser ? await fbUser.getIdToken() : null;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch patterns");
  return res.json();
}
