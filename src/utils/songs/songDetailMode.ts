import type { SongWithScore } from "@/types/songs/score";
import type { AllSongWithScore } from "@/types/songs/allSongs";

/**
 * 曲詳細モーダルが表示できる対象。
 * メインスコア(BPI計算済み)と全難易度スコア(BPI未計算)の両方を扱う。
 */
export type SongDetailSubject = SongWithScore | AllSongWithScore;

/** BPI計算済みのメインスコアかどうか。全難易度スコアにはbpiフィールドが存在しない */
export const hasBpiData = (song: SongDetailSubject): song is SongWithScore =>
  "bpi" in song;
