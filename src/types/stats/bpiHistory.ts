/** 更新された1楽曲分の新旧スコア比較 */
export interface BpiHistoryUpdatedSong {
  /** 楽曲タイトル（難易度サフィックス付き、例: "冥[A]"） */
  title: string;
  /** 更新前のEXスコア（初回プレイの場合は `null`） */
  prevExScore: number | null;
  /** 更新後のEXスコア */
  newExScore: number;
  /** 更新前のBPI（初回プレイの場合は `null`） */
  prevBpi: number | null;
  /** 更新後のBPI */
  newBpi: number;
}

/** 合計 BPI 履歴の1日分 */
export interface BpiHistoryItem {
  /** 日付（ISO 8601 形式） */
  date: string;
  /** 該当日の合計 BPI */
  totalBpi: number;
  /** 更新楽曲数 */
  count: number;
  /** 更新された楽曲の新旧スコア比較一覧 */
  updatedSongs: BpiHistoryUpdatedSong[];
}
