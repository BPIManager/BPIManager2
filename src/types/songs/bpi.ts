/**
 * BPI 計算に必要な楽曲の基本データ。
 */
export interface IBpiBasicSongData {
  /** 曲名（省略可） */
  title?: string;
  /** 曲ID。総合BPI計算（{@link IBpiScoreObservation} との突き合わせ）にのみ必要 */
  songId?: number;
  /** ノーツ数 */
  notes: number;
  /** 皆伝平均スコア */
  kaidenAvg: number | null;
  /** 世界レコードスコア */
  wrScore: number | null;
  /** 補正係数（省略時はデフォルト値 1.175 を使用） */
  coef?: number | null;
  /** ALS推定の位置パラメータ。未収録・ALS対象外の曲は null */
  mu?: number | null;
  /** ALS推定の弁別力パラメータ。未収録・ALS対象外の曲は null */
  sigma?: number | null;
  /** 曲ごとのALS残差分散。未収録なら全曲共通のresidualRmse^2にフォールバック */
  residualVar?: number | null;
}

/** 総合BPI計算に使う1曲分の実測観測（プレイ済みスコア）。 */
export interface IBpiScoreObservation {
  songId: number;
  notes: number;
  exScore: number;
}
