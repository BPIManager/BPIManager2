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
