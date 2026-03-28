import { SongWithScore, RivalScore } from "@/types/songs/score";

/** ライバルにギリギリ負けている楽曲の1件分 */
export interface NearLoseSongItem extends SongWithScore {
  /** 最接近ライバルのスコア情報とユーザー情報 */
  rival: RivalScore & {
    userId: string;
    userName: string;
    profileImage: string | null;
    exScore: number;
  };
  /** ライバルとのEXスコア差分（正値 = ライバルが上） */
  exDiff: number;
}
