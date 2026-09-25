"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, LucideHistory, Users } from "lucide-react";
import type { SongDetailSubject } from "@/utils/songs/songDetailMode";
import { hasBpiData } from "@/utils/songs/songDetailMode";
import { BpiCalculator } from "@/lib/bpi";
import { getRankDetail } from "@/constants/iidx/rankBorders";
import { useUser } from "@/contexts/users/UserContext";
import { useManualScoreUpdate } from "@/hooks/scores/useManualScoreUpdate";
import SongDetailModalView from "./ui";

interface SongDetailViewProps {
  song: SongDetailSubject | null;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "stats" | "history" | "rivals";
  /** EXスコアの手動編集を有効にする場合、対象ユーザーIDとバージョンを渡す */
  userId?: string;
  version?: string;
  /**
   * `song.songId`がどちらの楽曲ドメイン由来か。`songs`/`songDef`ドメイン
   * （BPI計算対象、☆11/12）は`"bpi"`、`allSongs`ドメイン（全難易度、
   * ☆1-12）は`"allSongs"`を渡す。両ドメインで`songId`の値が異なるため、
   * 手動編集を有効にするにはこの指定が必須。
   */
  songDomain?: "bpi" | "allSongs";
  /** 手動保存が成功した際に呼ばれる（呼び出し元でのデータ再取得等に使う） */
  onSaved?: () => void;
}

const SongDetailView = ({
  song,
  isOpen,
  onClose,
  defaultTab,
  userId,
  version,
  songDomain,
  onSaved,
}: SongDetailViewProps) => {
  // 全難易度スコア(BPI未計算)にはStatisticsタブを表示しない
  const fullSong = song && hasBpiData(song) ? song : null;
  const [tab, setTab] = useState<string>(
    defaultTab || (fullSong ? "stats" : "history"),
  );
  const tabs = fullSong
    ? [
        { value: "stats", label: "Statistics", icon: LineChart },
        { value: "history", label: "History", icon: LucideHistory },
        { value: "rivals", label: "Rivals", icon: Users },
      ]
    : [
        { value: "history", label: "History", icon: LucideHistory },
        { value: "rivals", label: "Rivals", icon: Users },
      ];

  const { fbUser } = useUser();
  const { save, isSaving } = useManualScoreUpdate(userId ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [draftExScore, setDraftExScore] = useState<number | null>(null);
  // 保存成功後の表示用。`song` propは呼び出し元の一覧データがそのまま
  // 渡ってくるだけで、保存後に呼び出し元がmutateしてもこのモーダル自身の
  // propは（再オープンするまで）更新されないため、保存直後の値をここに
  // 保持して表示する
  const [savedOverride, setSavedOverride] = useState<{
    exScore: number;
    bpi: number | null;
  } | null>(null);

  // 別の曲に切り替わったら編集状態・保存済みオーバーライドをリセットする
  const [lastSongId, setLastSongId] = useState(song?.songId);
  if (song?.songId !== lastSongId) {
    setLastSongId(song?.songId);
    setIsEditing(false);
    setDraftExScore(null);
    setSavedOverride(null);
  }

  // 手動編集を許可するのは、呼び出し元がsongDomainを指定しており
  // （☆10以下の全難易度曲も編集対象になり得るため`fullSong`は問わない）、
  // 自分自身のプロフィールを見ている場合のみ
  const canEdit =
    !!userId && !!version && !!songDomain && fbUser?.uid === userId;

  const maxScore = song ? song.notes * 2 : 0;
  const currentEx = savedOverride?.exScore ?? (song ? song.exScore || 0 : 0);
  const displayEx =
    isEditing && draftExScore != null ? draftExScore : currentEx;

  const rankInfo = useMemo(
    () => getRankDetail(displayEx, maxScore),
    [displayEx, maxScore],
  );

  const draftBpi = useMemo(() => {
    if (isEditing && fullSong && draftExScore != null) {
      return BpiCalculator.calc(draftExScore, fullSong);
    }
    return savedOverride?.bpi ?? fullSong?.bpi ?? null;
  }, [fullSong, isEditing, draftExScore, savedOverride]);

  // 編集中・保存直後のスコアをStatisticsタブのチャートにも反映する
  const displaySong = useMemo(() => {
    if (!fullSong) return null;
    if (isEditing && draftExScore != null) {
      return { ...fullSong, exScore: draftExScore, bpi: draftBpi };
    }
    if (savedOverride) {
      return { ...fullSong, exScore: savedOverride.exScore, bpi: savedOverride.bpi };
    }
    return fullSong;
  }, [fullSong, isEditing, draftExScore, draftBpi, savedOverride]);

  const bpiInfo = useMemo(() => {
    if (!fullSong) return { next: 0 as number | string, diff: 0 };
    if (draftBpi == null) return { next: "-", diff: 0 };
    const nextTargetBpi = Math.ceil((draftBpi + 0.01) / 10) * 10;
    const targetScore = BpiCalculator.calcFromBPI(
      nextTargetBpi,
      fullSong,
      true,
    );
    if (targetScore === null) return { next: "-", diff: 0 };
    return { next: nextTargetBpi, diff: targetScore - displayEx };
  }, [fullSong, draftBpi, displayEx]);

  const startEditing = () => {
    if (!canEdit) return;
    setDraftExScore(currentEx);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraftExScore(null);
  };

  const canSave =
    isEditing &&
    draftExScore != null &&
    draftExScore > currentEx &&
    draftExScore <= maxScore;

  // 保存中に対象(曲・ユーザー・バージョン等)が切り替わった場合、非同期結果を
  // 誤って現在表示中の対象へ適用しないようにするための最新値の参照
  const targetRef = useRef({ userId, version, songDomain, songId: song?.songId });
  useEffect(() => {
    targetRef.current = { userId, version, songDomain, songId: song?.songId };
  });

  const handleSave = async () => {
    if (!canSave || !song || !version || !songDomain || draftExScore == null)
      return;
    const requestedTarget = targetRef.current;
    const result = await save({
      songId: song.songId,
      songDomain,
      version,
      exScore: draftExScore,
    });
    if (
      requestedTarget.userId !== targetRef.current.userId ||
      requestedTarget.version !== targetRef.current.version ||
      requestedTarget.songDomain !== targetRef.current.songDomain ||
      requestedTarget.songId !== targetRef.current.songId
    ) {
      return;
    }
    if (result) {
      setSavedOverride({ exScore: result.exScore, bpi: result.bpi });
      setIsEditing(false);
      setDraftExScore(null);
      onSaved?.();
    }
  };

  if (!song) return null;

  return (
    <SongDetailModalView
      song={song}
      fullSong={fullSong}
      displaySong={displaySong}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          cancelEditing();
          onClose();
        }
      }}
      tab={tab}
      onTabChange={setTab}
      tabs={tabs}
      edit={{
        canEdit,
        isEditing,
        draftExScore,
        onDraftExScoreChange: setDraftExScore,
        isSaving,
        canSave,
        onStartEditing: startEditing,
        onCancelEditing: cancelEditing,
        onSave: handleSave,
      }}
      display={{ maxScore, displayEx, rankInfo, draftBpi, bpiInfo }}
    />
  );
};

export default SongDetailView;
