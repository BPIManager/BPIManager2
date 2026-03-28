import { RadarSummaryData } from "@/types/stats/radar";

/** ライバルとの勝敗集計 */
export interface RivalStats {
  /** 勝ち曲数 */
  win: number;
  /** 負け曲数 */
  lose: number;
  /** 引き分け曲数 */
  draw: number;
  /** 比較対象曲数合計 */
  totalCount: number;
}

/** ライバルサマリーの1件分 */
export interface RivalSummaryResult {
  userId: string;
  userName: string;
  profileImage: string | null;
  iidxId: string | null;
  arenaRank: string | null;
  totalBpi: number | null;
  /** ライバルのレーダーチャートデータ */
  radar: RadarSummaryData;
  /** 閲覧者のレーダーチャートデータ */
  viewerRadar: RadarSummaryData;
  stats: RivalStats;
}
