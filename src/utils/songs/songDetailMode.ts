import type { SongWithScore } from "@/types/songs/score";

/**
 * 曲詳細モーダルが表示できる対象。
 * メインスコア(BPI計算済み)と全難易度スコア(BPI未計算)の両方を扱う。
 */
export type SongDetailSubject = SongWithScore;

/** BPI計算済みのメインスコアかどうか。全難易度スコアには`bpi`キー自体が存在しない */
export const hasBpiData = (song: SongDetailSubject): boolean => "bpi" in song;
