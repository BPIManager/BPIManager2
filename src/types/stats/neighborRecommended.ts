import { RecommendedItem } from "./recommended";

export interface NeighborRecommendedItem extends RecommendedItem {
  /** 近傍プレイヤーの平均 BPI */
  neighborAvgBpi: number | null;
  /** このスコアを持つ近傍プレイヤー数 */
  neighborCount: number;
}

export interface NeighborRecommendedPage {
  weapons: { data: NeighborRecommendedItem[]; total: number };
  potential: { data: NeighborRecommendedItem[]; total: number };
  /** 実際に使用した近傍プレイヤー数 */
  usedNeighbors: number;
}
