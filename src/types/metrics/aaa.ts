/** AAA テーブルのグループ化基準。`"target"` はターゲット BPI 基準、`"self"` はユーザー BPI 基準 */
export type GroupingMode = "target" | "self";

/** AAA / Max- 達成に必要なスコア情報 */
export interface AAATableTarget {
  /** 目標EXスコア */
  exScore: number;
  /** 目標 BPI */
  targetBpi: number;
  /** 現在スコアとの差分 */
  diff: number;
}

/** AAA テーブルの1楽曲分のデータ */
export interface AAATableItem {
  songId: number;
  title: string;
  difficulty: string;
  releasedVersion: number;
  /** ノーツ数 */
  notes: number;
  /** 最大スコア（notes × 2） */
  maxScore: number;
  /** AAA / Max- それぞれの目標スコア情報 */
  targets: {
    aaa: AAATableTarget;
    maxMinus: AAATableTarget;
  };
  /** ユーザーの現在スコア情報 */
  user: {
    exScore: number;
    bpi: number;
    isAaa: boolean;
    isMaxMinus: boolean;
  };
}
