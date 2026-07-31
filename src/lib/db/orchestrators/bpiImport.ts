import { db } from "@/lib/db";
import { Database, NewAllScores, NewScore, NewTotalBPILog } from "@/types/db";
import { Transaction } from "kysely";
import { scoresRepo } from "@/lib/db/scores";
import { allScoresRepo } from "@/lib/db/allScores";
import { navigationRepo } from "@/lib/db/logs/navigation";
import { userStatusLogsRepo } from "@/lib/db/userStatusLogs";

/**
 * スコアインポート結果をトランザクション内で保存する。
 *
 * `scores`・`logs`・`userStatusLogs` の更新と、`allScores` の追記を一括で行う。
 *
 * @param params.userId - ユーザー ID
 * @param params.version - バージョン番号
 * @param params.batchId - バッチ ID（インポートのひとまとまりを識別する UUID）
 * @param params.scoreUpdates - 保存する BPI スコアの配列
 * @param params.allScoreUpdates - 保存する全難易度スコアの配列
 * @param params.newTotalBpi - 今回算出した総合 BPI
 */
export async function saveImportResults(params: {
  userId: string;
  version: string;
  batchId: string;
  scoreUpdates: NewScore[];
  allScoreUpdates: NewAllScores[];
  newTotalBpi: number;
}) {
  return await db.transaction().execute(async (trx) => {
    await executeSaveBpiSystem(trx, params);
    await executeSaveAllLevelHistory(trx, params);
  });
}

/**
 * BPIManagerからの引き継ぎインポート
 */
export async function importFromBPIM(params: {
  userId: string;
  scoreUpdates: NewScore[];
  statusLogs: NewTotalBPILog[];
  finalTotalBpi: number;
}) {
  return await db.transaction().execute(async (trx) => {
    await scoresRepo.deleteByUser(trx, params.userId);
    await navigationRepo.deleteByUser(trx, params.userId);
    await userStatusLogsRepo.deleteByUser(trx, params.userId);

    if (params.statusLogs.length > 0) {
      await userStatusLogsRepo.insert(trx, params.statusLogs);
      await navigationRepo.insert(trx, params.statusLogs);
    }

    if (params.scoreUpdates.length > 0) {
      for (let i = 0; i < params.scoreUpdates.length; i += 1000) {
        await scoresRepo.insert(trx, params.scoreUpdates.slice(i, i + 1000));
      }
    }
  });
}

/**
 * 共通保存ロジック
 */
async function executeSaveBpiSystem(
  trx: Transaction<Database>,
  params: {
    userId: string;
    version: string;
    batchId: string;
    scoreUpdates: NewScore[];
    newTotalBpi: number;
  },
) {
  const latestLog = await userStatusLogsRepo.getLatestArenaRank(
    trx,
    params.userId,
    params.version,
  );

  const currentArenaRank = latestLog?.arenaRank ?? null;
  if (params.scoreUpdates.length > 0) {
    await navigationRepo.insert(trx, {
      userId: params.userId,
      totalBpi: params.newTotalBpi,
      version: params.version,
      batchId: params.batchId,
    });

    await userStatusLogsRepo.insert(trx, {
      userId: params.userId,
      totalBpi: params.newTotalBpi,
      arenaRank: currentArenaRank,
      version: params.version,
      batchId: params.batchId,
    });

    await scoresRepo.insert(trx, params.scoreUpdates);
  }
}

async function executeSaveAllLevelHistory(
  trx: Transaction<Database>,
  params: { allScoreUpdates: NewAllScores[] },
) {
  await allScoresRepo.insert(trx, params.allScoreUpdates);
}
