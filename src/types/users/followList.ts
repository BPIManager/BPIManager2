/** フォローリスト（一覧表示・Vaulドロワー用） */
export interface FollowListSummary {
  id: number;
  name: string;
  isPublic: boolean;
  createdAt: string;
  memberCount: number;
}

/** フォロー中ユーザー1人と、そのユーザーが所属する自分のリストID一覧 */
export interface FollowingWithLists {
  userId: string;
  userName: string | null;
  profileImage: string | null;
  listIds: number[];
}
