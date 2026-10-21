import type { Ref } from "react";
import { List, type ListImperativeAPI } from "react-window";
import {
  RANKING_ROW_HEIGHT,
  SongRankingListRow,
  SongRankingTableHeader,
} from "@/components/partials/common/Songs/SongRankingListRow";
import type { SongRankingEntry } from "@/types/users/ranking";
import { useTranslation } from "@/hooks/common/useTranslation";

interface RankingListProps {
  rankings: SongRankingEntry[];
  listRef: Ref<ListImperativeAPI>;
  onNavigate: (userId: string) => void;
  highlightUserId?: string;
  /** 全難易度スコア(BPI未計算)の場合に渡す。BPIの代わりにnotes基準の%を表示する */
  notes?: number;
}

export const RankingList = ({
  rankings,
  listRef,
  onNavigate,
  highlightUserId,
  notes,
}: RankingListProps) => {
  const selfExScore = rankings.find((r) => r.isSelf)?.exScore ?? undefined;
  return (
    <div className="w-full overflow-hidden rounded-md border border-bpim-border">
      <SongRankingTableHeader
        showDiff={selfExScore !== undefined}
        rateLabel={notes != null ? "EX / %" : "EX / BPI"}
      />
      <List
        listRef={listRef}
        rowCount={rankings.length}
        rowHeight={RANKING_ROW_HEIGHT}
        rowComponent={SongRankingListRow}
        rowProps={{ rankings, selfExScore, onNavigate, notes, highlightUserId }}
        style={{ height: "40svh" }}
        className="overscroll-contain custom-scrollbar"
      />
    </div>
  );
};

interface GlobalRankingViewProps extends RankingListProps {
  totalCount: number;
  displayRank: number;
  highlightedName?: string;
}

export const GlobalRankingView = ({
  totalCount,
  displayRank,
  highlightedName,
  ...listProps
}: GlobalRankingViewProps) => {
  const { t, tFormat } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      {displayRank > 0 && (
        <div className="rounded-xl border border-bpim-muted/20 bg-bpim-overlay/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-md text-bpim-muted">
                {t("ranking.selfRank.outOf")}
                {totalCount}
                {t("ranking.selfRank.people")}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-bpim-muted">
                {highlightedName != null
                  ? tFormat("ranking.selfRank.userLabel", {
                      name: highlightedName,
                    })
                  : t("ranking.selfRank.label")}
              </span>
              <div className="font-mono text-xl font-bold text-bpim-text">
                <span className="text-bpim-primary">{displayRank}</span>
                <span className="ml-0.5 text-sm">
                  {t("ranking.selfRank.suffix")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      <RankingList {...listProps} />
    </div>
  );
};
