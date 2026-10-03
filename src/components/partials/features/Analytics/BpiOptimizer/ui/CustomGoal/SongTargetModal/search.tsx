
import { Search, CircleDashed } from "lucide-react";
import type { SongRow } from "@/components/partials/features/Analytics/BpiOptimizer/ui/CustomGoal/SongTargetModal/types";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";

import type { RadarCategory } from "@/types/stats/radar";

import { RADAR_LABELS } from "../../shared";
import DifficultyBadge from "../../DifficultyBadge";
import { type SongSearchResult, type BpmBand } from "@/hooks/songs/useSongSearch";
import { useTranslation } from "@/hooks/common/useTranslation";
import { SearchMode, SEARCH_MODES, BPM_BANDS, SongSortOrder, SONG_SORT_ORDERS } from "@/components/partials/features/Analytics/BpiOptimizer/ui/CustomGoal/SongTargetModal/types";

export interface SongSearchStepProps {
  query: string;
  setQuery: (value: string) => void;
  searchMode: SearchMode;
  setSearchMode: (value: SearchMode) => void;
  radarCategory: RadarCategory | null;
  setRadarCategory: (value: RadarCategory | null) => void;
  bpmBand: BpmBand | null;
  setBpmBand: (value: BpmBand | null) => void;
  sortOrder: SongSortOrder;
  setSortOrder: (value: SongSortOrder) => void;
  hasBrowseSelection: boolean;
  isLoading: boolean;
  displaySongRows: SongRow[];
  setSelectedSong: (value: SongSearchResult | null) => void;
  t: ReturnType<typeof useTranslation>["t"];
}

/** 曲の検索・絞り込み・一覧（曲を選ぶ段階）。 */
export const SongSearchStep = ({
  query,
  setQuery,
  searchMode,
  setSearchMode,
  radarCategory,
  setRadarCategory,
  bpmBand,
  setBpmBand,
  sortOrder,
  setSortOrder,
  hasBrowseSelection,
  isLoading,
  displaySongRows,
  setSelectedSong,
  t,
}: SongSearchStepProps) => {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 gap-1 rounded-lg bg-bpim-overlay/30 p-1">
        {SEARCH_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setSearchMode(mode)}
            className={cn(
              "flex-1 truncate rounded-md py-1.5 text-[11px] font-bold transition-colors",
              searchMode === mode
                ? "bg-bpim-primary text-white"
                : "text-bpim-muted hover:text-bpim-text",
            )}
          >
            {t(`optimizer.customGoal.searchMode.${mode}`)}
          </button>
        ))}
      </div>

      {searchMode === "title" && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bpim-muted" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("optimizer.customGoal.searchPlaceholder")}
            className="pl-8 h-9"
          />
        </div>
      )}

      {searchMode === "radar" && (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {ALL_RADAR_CATEGORIES.map((cat) => (
              <Button
                key={cat}
                type="button"
                variant={radarCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setRadarCategory(cat)}
              >
                {RADAR_LABELS[cat]}
              </Button>
            ))}
          </div>
          {radarCategory != null && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bpim-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("optimizer.customGoal.filterByTitle")}
                className="pl-8 h-9"
              />
            </div>
          )}
        </div>
      )}

      {searchMode === "bpm" && (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {BPM_BANDS.map((band) => (
              <Button
                key={band}
                type="button"
                variant={bpmBand === band ? "default" : "outline"}
                size="sm"
                onClick={() => setBpmBand(band)}
              >
                {t(`optimizer.customGoal.bpmBand.${band}`)}
              </Button>
            ))}
          </div>
          {bpmBand != null && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bpim-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("optimizer.customGoal.filterByTitle")}
                className="pl-8 h-9"
              />
            </div>
          )}
        </div>
      )}

      {hasBrowseSelection && (
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {SONG_SORT_ORDERS.map((order) => (
            <Button
              key={order}
              type="button"
              variant={sortOrder === order ? "default" : "outline"}
              size="sm"
              onClick={() => setSortOrder(order)}
            >
              {t(`optimizer.customGoal.sortOrder.${order}`)}
            </Button>
          ))}
        </div>
      )}

      <div className="flex min-w-0 max-h-72 flex-col gap-1 overflow-x-hidden overflow-y-auto custom-scrollbar">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <CircleDashed className="h-4 w-4 animate-spin text-bpim-muted" />
          </div>
        )}
        {!isLoading &&
          hasBrowseSelection &&
          displaySongRows.length === 0 && (
            <p className="py-8 text-center text-xs text-bpim-subtle">
              {t("optimizer.customGoal.noResults")}
            </p>
          )}
        {displaySongRows.map(({ song, currentEx, currentBpi }) => (
          <button
            key={`${song.songId}`}
            onClick={() => setSelectedSong(song)}
            className="flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-bpim-overlay/50 transition-colors"
          >
            <DifficultyBadge difficulty={song.difficulty} size="xs" />
            <span className="min-w-0 flex-1 truncate text-sm text-bpim-text">
              {song.title}
            </span>
            <div className="flex w-14 shrink-0 flex-col items-end gap-0.5">
              <span className="font-mono text-xs font-bold text-bpim-text">
                {currentEx != null ? currentEx : "-"}
              </span>
              <span className="font-mono text-[10px] text-bpim-muted">
                {currentBpi != null ? `BPI ${currentBpi.toFixed(2)}` : "-"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
