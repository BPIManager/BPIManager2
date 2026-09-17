import { User as FirebaseUser } from "firebase/auth";
import type { TicketRecommendResult } from "@/types/tickets";
import { fetcherV2 } from "@/services/swr/fetchV2";

export function loadMoreTicketResults(
  url: string,
  fbUser: FirebaseUser,
): Promise<TicketRecommendResult> {
  return fetcherV2([url, fbUser]);
}
