/** フォロー / フォロワーリストの1ユーザー */
export interface FollowUser {
  userId: string;
  userName: string;
  profileImage: string | null;
  profileText: string | null;
  totalBpi: number | null;
  arenaClass: string | null;
  /** 閲覧者がこのユーザーをフォローしているか */
  isViewerFollowing: boolean;
  /** このユーザーが閲覧者自身か */
  isSelf: boolean;
}
