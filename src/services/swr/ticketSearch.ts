import { User as FirebaseUser } from "firebase/auth";
import type { TicketItem, TicketRecommendResult, ScoreMode } from "@/types/tickets";
import { authFetch, fetcher } from "@/utils/common/fetch";

export async function searchTickets(
  url: string,
  fbUser: FirebaseUser,
  ticketIds: TicketItem[],
  scoreMode: ScoreMode,
): Promise<TicketRecommendResult[]> {
  const res = await authFetch(url, "POST", fbUser, { ticketIds, scoreMode });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? `HTTPエラー: ${res.status}`);
  }
  return res.json();
}

export function loadMoreTicketResults(
  url: string,
  fbUser: FirebaseUser,
): Promise<TicketRecommendResult> {
  return fetcher([url, fbUser]);
}
