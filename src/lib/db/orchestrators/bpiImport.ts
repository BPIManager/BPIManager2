import { db } from "@/lib/db";
import { lockUserForWrite } from "@/lib/db/shared/userWriteLock";
import { Database, NewAllScores, NewScore, NewTotalBPILog } from "@/types/db";
import { Transaction } from "kysely";
import { scoreWriteRepo } from "@/lib/db/domains/scores/write";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { logBatchRepo } from "@/lib/db/domains/logs/batch";
import { userStatusLogsWriteRepo } from "@/lib/db/domains/userStatusLogs/write";
import { userStatusLogsReadRepo } from "@/lib/db/domains/userStatusLogs/read";
import { BpiCalculator } from "@/lib/bpi";

/**
 * スコアインポート結果を1トランザクションで保存する（scores・logs・userStatusLogs の更新と allScores の追記）。
 *
 * @param params.userId - ユーザー ID
 * @param params.version - バージョン番号
 * @param params.batchId - バッチ ID（インポートのひとまとまりを識別する UUID）
 * @param params.scoreUpdates - 保存する BPI スコアの配列
 * @param params.allScoreUpdates - 保存する全難易度スコアの配列
 * @param params.newTotalBpi - 今回算出した総合 BPI
 * @returns ラチェット適用後に実際に保存した総合BPI（応答にはこちらを使う。newTotalBpi と保存値がずれるため）
 */
export async function saveImportResults(params: {
  userId: string;
  version: string;
  batchId: string;
  scoreUpdates: NewScore[];
  allScoreUpdates: NewAllScores[];
  newTotalBpi: number;
}, existingTrx?: Transaction<Database>): Promise<{ totalBpi: number }> {
  const run = async (trx: Transaction<Database>) => {
    // 同一ユーザーの書き込みを直列化してから、ラチェット基準値などを読む
    await lockUserForWrite(trx, params.userId);
    await logBatchRepo.getLatestBatchIdForUpdate(trx, params.userId, params.version);
    const totalBpi = await executeSaveBpiSystem(trx, params);
    await executeSaveAllLevelHistory(trx, params);
    return { totalBpi };
  };
  // 呼び出し元が読み取りを同じトランザクションで行う場合は、そのトランザクションに参加する
  return existingTrx ? await run(existingTrx) : await db.transaction().execute(run);
}

/**
 * BPIManagerからの引き継ぎインポート
 */
export async function importFromBPIM(params: {
  userId: string;
  scoreUpdates: NewScore[];
  statusLogs: NewTotalBPILog[];
}) {
  return await db.transaction().execute(async (trx) => {
    await scoreWriteRepo.deleteByUser(trx, params.userId);
    await logBatchRepo.deleteByUser(trx, params.userId);
    await userStatusLogsWriteRepo.deleteByUser(trx, params.userId);

    if (params.statusLogs.length > 0) {
      await userStatusLogsWriteRepo.insert(trx, params.statusLogs);
      await logBatchRepo.insert(trx, params.statusLogs);
    }

    if (params.scoreUpdates.length > 0) {
      for (let i = 0; i < params.scoreUpdates.length; i += 1000) {
        await scoreWriteRepo.insert(trx, params.scoreUpdates.slice(i, i + 1000));
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
): Promise<number> {
  const latestLog = await userStatusLogsReadRepo.getLatestArenaRank(
    trx,
    params.userId,
    params.version,
  );

  const currentArenaRank = latestLog?.arenaRank ?? null;
  const previousBest = await userStatusLogsReadRepo.getMaxTotalBpi(
    trx,
    params.userId,
    params.version,
  );
  const totalBpi = BpiCalculator.ratchetTotalBpi(
    previousBest,
    params.newTotalBpi,
  );
  // 書き込むものが無い場合も、応答値は保存されるはずだった値（ラチェット後）と一致させる
  if (params.scoreUpdates.length === 0) return totalBpi;

  // 総合BPIは既知の最高値を下回らないようラチェットする。V2 は未プレイ曲の予測が下がりうるため、プレイ済み曲が下がらなくても総合BPIは下がりうる。
   // src/lib/bpi/index.ts の ratchetTotalBpi 参照。

  await logBatchRepo.insert(trx, {
    userId: params.userId,
    totalBpi,
    version: params.version,
    batchId: params.batchId,
  });

  await userStatusLogsWriteRepo.insert(trx, {
    userId: params.userId,
    totalBpi,
    arenaRank: currentArenaRank,
    version: params.version,
    batchId: params.batchId,
  });

  await scoreWriteRepo.insert(trx, params.scoreUpdates);

  return totalBpi;
}

async function executeSaveAllLevelHistory(
  trx: Transaction<Database>,
  params: { allScoreUpdates: NewAllScores[] },
) {
  await allScoresRepo.insert(trx, params.allScoreUpdates);
}
