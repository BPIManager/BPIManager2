import { User as FirebaseUser } from "firebase/auth";
import type { TicketItem, TicketRecommendResult, ScoreMode } from "@/types/tickets";

export async function searchTickets(
  url: string,
  fbUser: FirebaseUser,
  ticketIds: TicketItem[],
  scoreMode: ScoreMode,
): Promise<TicketRecommendResult[]> {
  const token = await fbUser.getIdToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ticketIds, scoreMode }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? `HTTPエラー: ${res.status}`);
  }
  return res.json();
}

export async function loadMoreTicketResults(
  url: string,
  fbUser: FirebaseUser,
): Promise<TicketRecommendResult> {
  const token = await fbUser.getIdToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`HTTPエラー: ${res.status}`);
  return res.json();
}
