import { useState, useCallback } from "react";
import useSWRMutation from "swr/mutation";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import type { TicketItem, TicketRecommendResult, TicketSortKey, ScoreMode } from "@/types/tickets";

export interface TicketCardState {
  result: TicketRecommendResult;
  sortKey: TicketSortKey;
  isLoadingMore: boolean;
  allItems: TicketRecommendResult["items"];
  hasMore: boolean;
  offset: number;
}

function parseTicketCsv(csv: string): TicketItem[] {
  const lines = csv.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const result: TicketItem[] = [];
  for (const line of lines) {
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const ticketId = parts[0].trim();
    const expiresAt = parts[1].trim();
    if (!/^\d+$/.test(ticketId)) continue;
    result.push({ ticketId, expiresAt });
  }
  return result;
}

export function useTicketSearch() {
  const { user, fbUser } = useUser();
  const [csvInput, setCsvInput] = useState("");
  const [scoreMode, setScoreMode] = useState<ScoreMode>("relative");
  const [cardStates, setCardStates] = useState<Map<string, TicketCardState>>(new Map());
  const [orderedTicketIds, setOrderedTicketIds] = useState<string[]>([]);
  const [lastTickets, setLastTickets] = useState<TicketItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const key = user ? `${API_PREFIX}/users/${user.userId}/tickets/recommend` : null;

  const { trigger, isMutating, error: swrError } = useSWRMutation(
    key,
    async (
      url: string,
      { arg }: { arg: { ticketIds: TicketItem[]; scoreMode: ScoreMode } },
    ): Promise<TicketRecommendResult[]> => {
      const token = await fbUser!.getIdToken();
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arg),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? `HTTPエラー: ${res.status}`);
      }
      return res.json();
    },
  );

  const applyResults = useCallback((results: TicketRecommendResult[]) => {
    const newStates = new Map<string, TicketCardState>();
    const ids: string[] = [];
    for (const result of results) {
      newStates.set(result.ticketId, {
        result,
        sortKey: "patternScore",
        isLoadingMore: false,
        allItems: result.items,
        hasMore: result.hasMore,
        offset: result.items.length,
      });
      ids.push(result.ticketId);
    }
    setCardStates(newStates);
    setOrderedTicketIds(ids);
  }, []);

  const handleSearch = useCallback(async () => {
    const tickets = parseTicketCsv(csvInput);
    if (tickets.length === 0) {
      setParseError("有効なチケット番号が見つかりません。CSVフォーマットを確認してください。");
      return;
    }
    setParseError(null);
    setLastTickets(tickets);
    const results = await trigger({ ticketIds: tickets, scoreMode });
    if (results) applyResults(results);
  }, [csvInput, scoreMode, trigger, applyResults]);

  const handleScoreModeChange = useCallback(
    async (mode: ScoreMode) => {
      setScoreMode(mode);
      if (lastTickets.length > 0) {
        const results = await trigger({ ticketIds: lastTickets, scoreMode: mode });
        if (results) applyResults(results);
      }
    },
    [lastTickets, trigger, applyResults],
  );

  const handleLoadMore = useCallback(
    async (ticketId: string) => {
      if (!user || !fbUser) return;
      const state = cardStates.get(ticketId);
      if (!state) return;

      setCardStates((prev) => {
        const next = new Map(prev);
        const s = next.get(ticketId);
        if (s) next.set(ticketId, { ...s, isLoadingMore: true });
        return next;
      });

      try {
        const token = await fbUser.getIdToken();
        const params = new URLSearchParams({
          ticketId,
          expiresAt: state.result.expiresAt,
          offset: String(state.offset),
          scoreMode,
        });
        const res = await fetch(
          `${API_PREFIX}/users/${user.userId}/tickets/recommend?${params}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error(`HTTPエラー: ${res.status}`);
        const data: TicketRecommendResult = await res.json();

        setCardStates((prev) => {
          const next = new Map(prev);
          const s = next.get(ticketId);
          if (!s) return next;
          next.set(ticketId, {
            ...s,
            allItems: [...s.allItems, ...data.items],
            hasMore: data.hasMore,
            offset: s.offset + data.items.length,
            isLoadingMore: false,
          });
          return next;
        });
      } catch {
        setCardStates((prev) => {
          const next = new Map(prev);
          const s = next.get(ticketId);
          if (s) next.set(ticketId, { ...s, isLoadingMore: false });
          return next;
        });
      }
    },
    [user, fbUser, cardStates, scoreMode],
  );

  const handleSortChange = useCallback((ticketId: string, sortKey: TicketSortKey) => {
    setCardStates((prev) => {
      const next = new Map(prev);
      const s = next.get(ticketId);
      if (s) next.set(ticketId, { ...s, sortKey });
      return next;
    });
  }, []);

  const error = parseError ?? (swrError instanceof Error ? swrError.message : null);

  return {
    csvInput,
    setCsvInput,
    scoreMode,
    handleScoreModeChange,
    isLoading: isMutating,
    error,
    cardStates,
    orderedTicketIds,
    handleSearch,
    handleLoadMore,
    handleSortChange,
  };
}
