import { SongWithScore } from "@/types/songs/score";

/** おすすめ楽曲の1件分（伸びしろ・ポテンシャル情報を含む） */
export interface RecommendedItem extends SongWithScore {
  /** 現在スコア */
  current: {
    exScore: number | null;
    bpi: number | null;
    clearState: string | null;
  };
  /** 前回からの差分 */
  diff: { exScore: number; bpi: number };
  /** EXスコア差分 */
  exDiff: number;
  /** BPI 差分 */
  bpiDiff: number;
}
