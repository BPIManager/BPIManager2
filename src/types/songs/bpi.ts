/**
 * BPI 計算に必要な楽曲の基本データ。
 */
export interface IBpiBasicSongData {
  /** 曲名（省略可） */
  title?: string;
  /** ノーツ数 */
  notes: number;
  /** 皆伝平均スコア */
  kaidenAvg: number | null;
  /** 世界レコードスコア */
  wrScore: number | null;
  /** 補正係数（省略時はデフォルト値 1.175 を使用） */
  coef?: number | null;
}
