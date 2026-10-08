"use client";

import { useState, type CSSProperties } from "react";
import { useSongFilter } from "@/hooks/table/useSongFilter";
import { PAGE_SIZE } from "@/constants/logic/pagination";
import { SongWithRival, SongWithScore } from "@/types/songs/score";

import SongFilterBar from "@/components/partials/common/Songs/Filter/ui";
import SongListSkeleton from "@/components/partials/common/Table/skeleton";
import { NoDataAlert } from "@/components/partials/common/DashBoard/NoData";
import { LoginRequiredCard } from "@/components/partials/common/Auth/LoginRequired/ui";
import CustomPagination from "@/components/partials/common/ListControls/Pagination/ui";
import AdvancedFilterModal from "@/components/partials/common/Songs/AdvancedFilter/ui";
import SongDetailView from "@/components/partials/modal/SongDetail";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import RivalSongItem, {
  rivalRowMinWidth,
} from "@/components/partials/common/Rivals/Table/ui";
import RivalAnalysis from "@/components/partials/common/Rivals/Analysis/ui";
import { useUser } from "@/contexts/users/UserContext";
import { List, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";

type SubTab = "list" | "analysis";

const SubTabBar = ({
  subTab,
  onTabChange,
  tabs,
}: {
  subTab: SubTab;
  onTabChange: (tab: SubTab) => void;
  /** 表示するタブ（複数ターゲット時は分析タブを出さない） */
  tabs: SubTab[];
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1 border-b border-bpim-border px-3 py-2">
      {tabs.map((tab) => {
        const Icon = tab === "list" ? List : BarChart2;
        const label =
          tab === "list" ? t("analyticsTable.songList") : t("analyticsTable.analysis");
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
              subTab === tab
                ? "bg-bpim-primary/15 text-bpim-primary"
                : "text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-text",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
};

interface AnalyticsComparisonTableProps {
  songs: SongWithRival[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
  rivalLabel?: string;
  /** 複数ターゲット比較時の各ターゲット名。2件以上のとき比較列が RIVAL1, RIVAL2... に増える */
  labels?: string[];
  version?: string;
  /** モーダル上でのEXスコア手動保存が成功した際に呼ばれる */
  onScoreSaved?: () => void;
}

const AnalyticsComparisonTable = ({
  songs,
  isLoading,
  error,
  rivalLabel,
  labels,
  version,
  onScoreSaved,
}: AnalyticsComparisonTableProps) => {
  const { t: translate } = useTranslation();
  const { fbUser } = useUser();
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>("list");
  const isMulti = (labels?.length ?? 0) > 1;
  const tabs: SubTab[] = isMulti ? ["list"] : ["list", "analysis"];
  const activeTab: SubTab = isMulti ? "list" : subTab;

  const { params, updateParams, page, setPage, visibleSongs, totalCount } =
    useSongFilter(songs, { isMyPlayed: true, isRivalPlayed: true });

  if (!fbUser) return <LoginRequiredCard />;

  if (!isLoading && error) {
    return <FetchErrorState error={error} />;
  }

  if (activeTab === "analysis") {
    return (
      <div className="mx-auto w-full min-h-svh flex flex-col bg-background">
        <SubTabBar
          subTab={activeTab}
          onTabChange={setSubTab}
          tabs={tabs}
        />
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-xs text-bpim-muted">
            {translate("common.loading")}
          </div>
        ) : (
          <RivalAnalysis
            songs={songs as SongWithRival[] | undefined}
            rivalName={rivalLabel}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-h-svh flex flex-col bg-background">
      <SubTabBar
        subTab={activeTab}
        onTabChange={setSubTab}
        tabs={tabs}
      />

      <SongFilterBar
        withRivals={"full"}
        rivalLabels={labels}
        params={params}
        onParamsChange={updateParams}
        totalCount={totalCount}
        onOpenAdvancedFilter={() => setIsAdvancedOpen(true)}
      />

      {!isLoading && songs && songs.length === 0 && (
        <div className="p-4">
          <NoDataAlert />
        </div>
      )}

      <main className="flex-1">
        {isLoading ? (
          <SongListSkeleton />
        ) : (
          <div className={cn(isMulti && "overflow-x-auto")}>
            <div
              className={cn(
                "w-full p-2 flex flex-col",
                isMulti && "min-w-(--rival-min-sm) lg:min-w-(--rival-min-lg)",
              )}
              style={
                isMulti
                  ? ({
                      "--rival-min-sm": `${rivalRowMinWidth(labels!.length).mobile}px`,
                      "--rival-min-lg": `${rivalRowMinWidth(labels!.length).desktop}px`,
                    } as CSSProperties)
                  : undefined
              }
            >
              {visibleSongs.map((song) => {
                const s = song as SongWithRival;
                return (
                  <RivalSongItem
                    key={`${s.songId}-${s.difficulty}`}
                    song={s}
                    labels={labels}
                    onClick={() => {
                      setSelectedSong(s);
                      setIsDetailOpen(true);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>

      <AdvancedFilterModal
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        params={params}
        onParamsChange={updateParams}
      />

      {isDetailOpen && selectedSong && (
        <SongDetailView
          song={selectedSong}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          userId={fbUser?.uid}
          version={version}
          songDomain="bpi"
          onSaved={onScoreSaved}
        />
      )}

      <CustomPagination
        count={totalCount}
        pageSize={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
};

export default AnalyticsComparisonTable;
