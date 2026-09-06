import { User as FirebaseUser } from "firebase/auth";
import type { TicketItem, TicketRecommendResult, ScoreMode } from "@/types/tickets";
import { authFetch } from "@/utils/common/fetch";
import { fetcherV2, unwrapApiResponse } from "@/services/swr/fetchV2";

export async function searchTickets(
  url: string,
  fbUser: FirebaseUser,
  ticketIds: TicketItem[],
  scoreMode: ScoreMode,
): Promise<TicketRecommendResult[]> {
  const res = await authFetch(url, "POST", fbUser, { ticketIds, scoreMode });
  return unwrapApiResponse<TicketRecommendResult[]>(res);
}

export function loadMoreTicketResults(
  url: string,
  fbUser: FirebaseUser,
): Promise<TicketRecommendResult> {
  return fetcherV2([url, fbUser]);
}
