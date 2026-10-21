import type { SongDetailSubject } from "@/utils/songs/songDetailMode";
import type { SongCompareTarget } from "@/types/songs/compareTarget";

export interface RankingBodyProps {
  version: string;
  songId: number;
  myScore?: SongDetailSubject;
  /** 比較対象のBPIをその場で計算するための楽曲 */
  song?: SongDetailSubject;
  /** 全難易度スコア(BPI未計算)の場合に notes を渡す。BPIの代わりにnotes基準の%を表示する */
  notes?: number;
  onNavigate: (userId: string) => void;
  highlightUserId?: string;
  compareTargets?: SongCompareTarget[];
}
