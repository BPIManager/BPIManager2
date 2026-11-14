import type { AnalyticsTarget } from "./index";

/** 保存済み比較のターゲット。参照先が非公開かつ未承認の場合は accessible=false で label は空になる */
export type SavedTarget = AnalyticsTarget & { accessible: boolean };

export interface SavedComparison {
  id: number;
  name: string;
  targets: SavedTarget[];
  createdAt: string;
  updatedAt: string;
}

/** ダッシュボードのランキングタブ設定の1件。key は組み込みタブ名または `saved:<id>` */
export interface RankingTabSetting {
  key: string;
  visible: boolean;
  /** 保存済み比較に複数ターゲットがある場合に表示するターゲットの index */
  targetIndex?: number;
}
