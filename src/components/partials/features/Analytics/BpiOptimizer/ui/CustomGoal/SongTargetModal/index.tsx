import { useEffect, useMemo, useState } from "react";
import { SongSearchStep } from "./search";
import { SongEditStep } from "./edit";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { getRankDetail } from "@/constants/iidx/rankBorders";

import { BpiCalculator } from "@/lib/bpi";

import type { RadarCategory } from "@/types/stats/radar";


import { useSongSearch, type SongSearchResult, type BpmBand } from "@/hooks/songs/useSongSearch";
import { useTranslation } from "@/hooks/common/useTranslation";
import { SearchMode, SongSortOrder, CustomGoalTargetInput } from "@/components/partials/features/Analytics/BpiOptimizer/ui/CustomGoal/SongTargetModal/types";
import { toBpiSongData, scoreRate } from "@/components/partials/features/Analytics/BpiOptimizer/ui/CustomGoal/SongTargetModal/quickOptions";

export const SongTargetModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialTarget,
  currentScores,
  difficultyLevel = 12,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (target: CustomGoalTargetInput) => void;
  initialTarget?: CustomGoalTargetInput;
  currentScores: Map<number, number | null>;
  difficultyLevel?: number;
}) => {
  const { t, tFormat } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("title");
  const [radarCategory, setRadarCategory] = useState<RadarCategory | null>(
    null,
  );
  const [bpmBand, setBpmBand] = useState<BpmBand | null>(null);
  const [sortOrder, setSortOrder] = useState<SongSortOrder>("title");
  const [selectedSong, setSelectedSong] = useState<SongSearchResult | null>(
    null,
  );
  const [exScoreInput, setExScoreInput] = useState("");

  // モーダルを開くたびに前回の入力を消し、初期値(編集時)で作り直す
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) return;
    if (initialTarget) {
      setSelectedSong({
        songId: initialTarget.songId,
        title: initialTarget.title,
        difficulty: initialTarget.difficulty,
        difficultyLevel: initialTarget.difficultyLevel,
        notes: initialTarget.notes,
        bpm: null,
        releasedVersion: null,
        wrScore: initialTarget.wrScore,
        kaidenAvg: initialTarget.kaidenAvg,
        coef: initialTarget.coef,
        mu: initialTarget.mu,
        sigma: initialTarget.sigma,
        residualVar: initialTarget.residualVar,
      });
      setExScoreInput(String(initialTarget.toExScore));
    } else {
      setSelectedSong(null);
      setExScoreInput("");
    }
    setQuery("");
    setDebouncedQuery("");
    setSearchMode("title");
    setRadarCategory(null);
    setBpmBand(null);
    setSortOrder("title");
  }, [isOpen, initialTarget]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { songs, isLoading } = useSongSearch(
    searchMode === "title" ? debouncedQuery : "",
    {
      difficultyLevel,
      radarCategory:
        searchMode === "radar" ? (radarCategory ?? undefined) : undefined,
      bpmBand: searchMode === "bpm" ? (bpmBand ?? undefined) : undefined,
      enabled: isOpen,
    },
  );
  const hasBrowseSelection =
    searchMode === "title"
      ? true
      : searchMode === "radar"
        ? radarCategory != null
        : bpmBand != null;
  const titleFilter = debouncedQuery.trim().toLowerCase();
  const filteredSongs =
    searchMode === "title" || titleFilter.length === 0
      ? songs
      : songs.filter((song) => song.title.toLowerCase().includes(titleFilter));

  const displaySongRows = useMemo(() => {
    const rows = filteredSongs.map((song) => {
      const currentEx = currentScores.get(song.songId) ?? null;
      const currentBpi =
        currentEx != null ? BpiCalculator.calc(currentEx, toBpiSongData(song)) : null;
      return { song, currentEx, currentBpi };
    });
    if (sortOrder === "title") return rows;
    // 未プレイ曲(currentBpi=null)は順位が付けられないため並び替え対象外にし、常に末尾へ
    return rows.sort((a, b) => {
      if (a.currentBpi == null && b.currentBpi == null) return 0;
      if (a.currentBpi == null) return 1;
      if (b.currentBpi == null) return -1;
      return sortOrder === "bpiDesc"
        ? b.currentBpi - a.currentBpi
        : a.currentBpi - b.currentBpi;
    });
  }, [filteredSongs, sortOrder, currentScores]);

  const maxScore = selectedSong ? selectedSong.notes * 2 : null;
  const exScoreNum = parseInt(exScoreInput, 10);
  const currentExScore = selectedSong
    ? (currentScores.get(selectedSong.songId) ?? null)
    : null;
  const isExScoreValid =
    !isNaN(exScoreNum) &&
    exScoreNum >= 0 &&
    (maxScore == null || exScoreNum <= maxScore) &&
    (currentExScore == null || exScoreNum >= currentExScore);
  const enteredRate =
    selectedSong && !isNaN(exScoreNum)
      ? scoreRate(exScoreNum, selectedSong.notes)
      : null;
  const rankDetail =
    selectedSong && !isNaN(exScoreNum)
      ? getRankDetail(exScoreNum, selectedSong.notes * 2)
      : null;
  const rankDetailText = rankDetail
    ? rankDetail.label === "MAX-"
      ? `MAX - ${rankDetail.shortage}`
      : `${rankDetail.label} + ${rankDetail.surplus}`
    : null;
  const enteredBpi =
    selectedSong && !isNaN(exScoreNum)
      ? BpiCalculator.calc(exScoreNum, toBpiSongData(selectedSong))
      : null;
  const diffFromCurrent =
    selectedSong && !isNaN(exScoreNum)
      ? exScoreNum - (currentExScore ?? 0)
      : null;

  const handleConfirm = () => {
    if (!selectedSong || !isExScoreValid) return;
    onConfirm({
      songId: selectedSong.songId,
      title: selectedSong.title,
      difficulty: selectedSong.difficulty,
      difficultyLevel: selectedSong.difficultyLevel,
      notes: selectedSong.notes,
      toExScore: exScoreNum,
      wrScore: selectedSong.wrScore,
      kaidenAvg: selectedSong.kaidenAvg,
      coef: selectedSong.coef,
      mu: selectedSong.mu,
      sigma: selectedSong.sigma,
      residualVar: selectedSong.residualVar,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] sm:max-w-md border-bpim-border bg-bpim-bg">
        <DialogHeader>
          <DialogTitle>
            {selectedSong
              ? t("optimizer.customGoal.scoreStepTitle")
              : t("optimizer.customGoal.searchStepTitle")}
          </DialogTitle>
        </DialogHeader>

        {!selectedSong ? (
          <SongSearchStep
            query={query}
            setQuery={setQuery}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            radarCategory={radarCategory}
            setRadarCategory={setRadarCategory}
            bpmBand={bpmBand}
            setBpmBand={setBpmBand}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            hasBrowseSelection={hasBrowseSelection}
            isLoading={isLoading}
            displaySongRows={displaySongRows}
            setSelectedSong={setSelectedSong}
            t={t}
          />
        ) : (
          <SongEditStep
            selectedSong={selectedSong}
            setSelectedSong={setSelectedSong}
            exScoreInput={exScoreInput}
            setExScoreInput={setExScoreInput}
            currentExScore={currentExScore}
            maxScore={maxScore}
            enteredRate={enteredRate}
            enteredBpi={enteredBpi}
            diffFromCurrent={diffFromCurrent}
            rankDetailText={rankDetailText}
            t={t}
            tFormat={tFormat}
          />
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("optimizer.customGoal.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSong || !isExScoreValid}
          >
            {initialTarget
              ? t("optimizer.customGoal.updateTarget")
              : t("optimizer.customGoal.addTarget")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SongTargetModal;
