import { User as FirebaseUser } from "firebase/auth";
import type { PatternsPage } from "@/types/songs/patterns";
import { fetcherV2 } from "@/services/swr/fetchV2";

export function fetchSongPatternsPage(
  url: string,
  fbUser: FirebaseUser | null,
): Promise<PatternsPage> {
  return fetcherV2([url, fbUser]);
}
