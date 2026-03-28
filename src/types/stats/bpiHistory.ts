/** 合計 BPI 履歴の1日分 */
export interface BpiHistoryItem {
  /** 日付（ISO 8601 形式） */
  date: string;
  /** 該当日の合計 BPI */
  totalBpi: number;
  /** 更新楽曲数 */
  count: number;
  /** 更新された楽曲タイトル一覧 */
  updatedSongs: string[];
}
