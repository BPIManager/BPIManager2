import { User as FirebaseUser } from "firebase/auth";
import type { PatternsPage } from "@/hooks/songs/useSongPatterns";
import { fetcher } from "@/utils/common/fetch";

export function fetchSongPatternsPage(
  url: string,
  fbUser: FirebaseUser | null,
): Promise<PatternsPage> {
  return fetcher([url, fbUser]);
}
