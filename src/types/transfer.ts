/** BPIManager（旧アプリ）のスコア履歴エントリ */
export interface BpimScoreHistoryItem {
  title: string;
  difficulty: string;
  exScore: number;
  updatedAt: string;
}

/** BPIManager（旧アプリ）のスコアメタ情報（クリア種別・ミスカウント） */
export interface BpimScoreMeta {
  title: string;
  difficulty: string;
  clearState: number | string | undefined;
  missCount: number | null | undefined;
}

/**
 * BPIManager（旧アプリ）からエクスポートされるスコアデータの形式。
 * `scoresHistory` に全履歴、`scores` に最新メタ情報を持つ。
 */
export interface BpimScoreData {
  scoresHistory: BpimScoreHistoryItem[];
  scores: Record<string, BpimScoreMeta>;
}
