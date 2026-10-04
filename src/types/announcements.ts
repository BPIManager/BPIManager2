export interface Announcement {
  id: number;
  title: string;
  body: string;
  linkUrl: string | null;
  /** ISO 8601 形式の公開日時 */
  publishedAt: string;
  /** 未ログイン時は常に false */
  isRead: boolean;
}

export interface AnnouncementsResponse {
  items: Announcement[];
  unreadCount: number;
}
