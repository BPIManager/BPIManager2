import { User as FirebaseUser } from "firebase/auth";
import type { PatternsPage } from "@/hooks/songs/useSongPatterns";
import { fetcherV2 } from "@/services/swr/fetchV2";

export function fetchSongPatternsPage(
  url: string,
  fbUser: FirebaseUser | null,
): Promise<PatternsPage> {
  return fetcherV2([url, fbUser]);
}
