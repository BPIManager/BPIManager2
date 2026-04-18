/** バッチ更新のトップスコア情報 */
export interface TopScore {
  /** 楽曲タイトル */
  title: string;
  /** BPI 値 */
  bpi: number;
  /** クリア状態 */
  clearState: string;
}

/** スコア更新ログの1件分 */
export interface UpdateLog {
  id: number;
  batchId: string;
  /** IIDX バージョン番号 */
  version: string;
  /** バッチ時点の合計 BPI */
  totalBpi: number;
  /** 更新された楽曲数 */
  songCount: number;
  /** 前回バッチとの BPI 差分 */
  diff: number;
  createdAt: string;
  /** 上位スコア一覧 */
  topScores: TopScore[];
}
