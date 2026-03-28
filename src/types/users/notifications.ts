/** DB クエリ結果の通知行（フォロー・追い抜き共通） */
export interface NotificationOvertakenRow {
  type: string;
  timestamp: Date;
  senderName: string;
  senderImage: string | null;
  senderId: string;
  songTitle: string | null;
  songDifficulty: string | null;
  rivalScore: number | null;
  myScore: number | null;
  songId: string | null;
}

/** 通知の1件分 */
export interface NotificationItem {
  /** 通知種別。`"follow"` フォロー通知、`"overtaken"` 抜かれ通知 */
  type: "follow" | "overtaken";
  timestamp: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  /** 抜かれ通知の対象楽曲 ID */
  songId?: number;
  songTitle?: string;
  songDifficulty?: string;
  rivalScore?: number;
  myScore?: number;
}

/** 未読通知件数レスポンス */
export interface NotificationCountResponse {
  total: number;
}
