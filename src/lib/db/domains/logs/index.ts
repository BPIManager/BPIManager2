export { navigationRepo } from "./navigation";

import { navigationRepo } from "./navigation";
import { deleteBatch } from "@/lib/db/orchestrators/batchDeletion";

/**
 * `logs` テーブル（バッチ単位のスコア更新ログ）の日付ナビゲーション・
 * バッチ検索を担当するリポジトリのファサードオブジェクト。
 *
 * 後方互換性維持のために `navigationRepo` を統合している。
 * 新規コードでは個別のリポジトリを直接使用することを推奨する。
 */
export const logsRepo = {
  getJstRange: navigationRepo.getJstRange.bind(navigationRepo),
  getRangeNavigation: navigationRepo.getRangeNavigation.bind(navigationRepo),
  getBatchNavigation: navigationRepo.getBatchNavigation.bind(navigationRepo),
  findBatchById: navigationRepo.findBatchById.bind(navigationRepo),
  findBatchByIdAndUser: navigationRepo.findBatchByIdAndUser.bind(navigationRepo),
  findBatchesInRange: navigationRepo.findBatchesInRange.bind(navigationRepo),
  deleteBatch,
  insert: navigationRepo.insert.bind(navigationRepo),
  deleteByUser: navigationRepo.deleteByUser.bind(navigationRepo),
  getLatestTotalBpi: navigationRepo.getLatestTotalBpi.bind(navigationRepo),
  getUserIdsOrderedByBpiDistance:
    navigationRepo.getUserIdsOrderedByBpiDistance.bind(navigationRepo),
};
