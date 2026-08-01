"use client";

import { useEffect, useMemo, useRef } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalScores } from "@/hooks/social/useRivalScores";
import { useAllSongRivalScores } from "@/hooks/allScores/useAllSongRivalScores";
import { useSongRanking } from "@/hooks/stats/useSongRanking";
import { useAllSongRanking } from "@/hooks/allScores/useAllSongRanking";
import type { SongDetailSubject } from "@/utils/songs/songDetailMode";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { FetchErrorState } from "@/components/partials/common/ErrorStates/FetchErrorState";
import { List, type ListImperativeAPI } from "react-window";
import {
  RANKING_ROW_HEIGHT,
  SongRankingListRow,
  SongRankingTableHeader,
} from "@/components/partials/common/Songs/SongRankingListRow";
import type { SongRankingEntry } from "@/types/users/ranking";

interface RivalRankingProps {
  version: string;
  songId: number;
  myScore?: SongDetailSubject;
  /** 全難易度スコア(BPI未計算)の場合に notes を渡す。BPIの代わりにnotes基準の%を表示する */
  notes?: number;
  onNavigate: (userId: string) => void;
}

export const RivalRankingBody = ({
  version,
  songId,
  myScore,
  notes,
  onNavigate,
}: RivalRankingProps) => {
  const { fbUser } = useUser();
  const isAllScores = notes != null;
  const {
    data: mainData,
    isLoading: mainLoading,
    error: mainError,
  } = useRivalScores(isAllScores ? null : songId, version);
  const {
    data: allData,
    isLoading: allLoading,
    error: allError,
  } = useAllSongRivalScores(isAllScores ? songId : null, version);
  const data = isAllScores ? allData : mainData;
  const isLoading = isAllScores ? allLoading : mainLoading;
  const error = isAllScores ? allError : mainError;

  const rankings: SongRankingEntry[] = useMemo(() => {
    type RivalRow = {
      userId: string;
      isSelf?: boolean;
      exScore: number | null;
      bpi?: number | null;
      userName?: string;
      profileImage?: string | null;
    };

    const selfRow: RivalRow | null = myScore
      ? { ...myScore, userId: fbUser?.uid ?? "", isSelf: true }
      : null;

    let rows: RivalRow[];
    if (!data?.rivals) {
      rows = selfRow ? [selfRow] : [];
    } else {
      rows = [...data.rivals];
      if (selfRow && !rows.some((r) => r.userId === fbUser?.uid)) {
        rows.push(selfRow);
      }
    }

    return rows
      .sort((a, b) => (b.exScore || 0) - (a.exScore || 0))
      .map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        userName: row.userName ?? "",
        profileImage: row.profileImage ?? null,
        exScore: row.exScore,
        bpi: row.bpi ?? null,
        isSelf: !!row.isSelf,
      }));
  }, [data, myScore, fbUser?.uid]);

  if (isLoading) {
    return <SectionLoader className="py-8" color="text-bpim-info" />;
  }

  if (error) {
    return <FetchErrorState error={error} className="min-h-64" />;
  }

  const selfExScore = myScore?.exScore ?? undefined;

  return (
    <div className="w-full overflow-hidden rounded-md border border-bpim-border">
      <SongRankingTableHeader
        showDiff={selfExScore !== undefined}
        rateLabel={isAllScores ? "EX / %" : "EX / BPI"}
      />
      <List
        rowCount={rankings.length}
        rowHeight={RANKING_ROW_HEIGHT}
        rowComponent={SongRankingListRow}
        rowProps={{ rankings, selfExScore, onNavigate, notes }}
        style={{ height: "40svh" }}
        className="overscroll-contain custom-scrollbar"
      />
    </div>
  );
};

export const GlobalRankingBody = ({
  version,
  songId,
  myScore,
  notes,
  onNavigate,
}: RivalRankingProps) => {
  const isAllScores = notes != null;
  const {
    data: mainData,
    isLoading: mainLoading,
    isError: mainError,
  } = useSongRanking(isAllScores ? null : songId, version);
  const {
    data: allData,
    isLoading: allLoading,
    isError: allError,
  } = useAllSongRanking(isAllScores ? songId : null, version);
  const data = isAllScores ? allData : mainData;
  const isLoading = isAllScores ? allLoading : mainLoading;
  const isError = isAllScores ? allError : mainError;
  const listRef = useRef<ListImperativeAPI>(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    hasScrolled.current = false;
  }, [songId, version, isAllScores]);

  useEffect(() => {
    if (!data || !listRef.current || hasScrolled.current) return;
    const selfIndex = data.rankings.findIndex((r) => r.isSelf);
    if (selfIndex < 0) return;
    hasScrolled.current = true;
    const timer = setTimeout(() => {
      listRef.current?.scrollToRow({ align: "center", index: selfIndex });
    }, 50);
    return () => clearTimeout(timer);
  }, [data, songId, version, isAllScores]);

  if (isLoading) {
    return <SectionLoader className="py-8" color="text-bpim-info" />;
  }

  if (isError) {
    return <FetchErrorState error={isError} className="min-h-64" />;
  }

  if (!data) return null;

  const { rankings, totalCount, selfRank } = data;
  const selfExScore = myScore?.exScore ?? undefined;

  return (
    <div className="flex flex-col gap-4">
      {selfRank > 0 && (
        <div className="rounded-xl border border-bpim-muted/20 bg-bpim-overlay/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-md text-bpim-muted">全 {totalCount} 人中</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-bpim-muted">現在の順位</span>
              <div className="font-mono text-xl font-bold text-bpim-text">
                <span className="text-bpim-primary">{selfRank}</span>
                <span className="ml-0.5 text-sm">位</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full overflow-hidden rounded-md border border-bpim-border">
        <SongRankingTableHeader
          showDiff={selfExScore !== undefined}
          rateLabel={isAllScores ? "EX / %" : "EX / BPI"}
        />
        <List
          listRef={listRef}
          rowCount={rankings.length}
          rowHeight={RANKING_ROW_HEIGHT}
          rowComponent={SongRankingListRow}
          rowProps={{ rankings, selfExScore, onNavigate, notes }}
          style={{ height: "40svh" }}
          className="overscroll-contain custom-scrollbar"
        />
      </div>
    </div>
  );
};
