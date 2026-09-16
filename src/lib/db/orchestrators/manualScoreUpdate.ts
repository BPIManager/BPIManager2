import { db } from "@/lib/db";
import { scoresRepo } from "@/lib/db/domains/scores";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";
import { BpiCalculator } from "@/lib/bpi";
import { getManualBatchId } from "@/lib/scores/manualBatchId";

interface ManualScoreInput {
  songId: number;
  definitionId: number;
  exScore: number;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
}

interface ManualAllScoreInput {
  songId: number;
  exScore: number;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
}

/**
 * 画面からの手動スコア編集をトランザクション内で保存する。
 *
 * CSVインポート（`saveImportResults`）とは別の経路。決定的batchId
 * （{@link getManualBatchId}）を使い、同日内の複数回の手動保存を
 * `logs`/`userStatusLogs`/`scores`/`allScores`それぞれ1行にまとめて
 * レコード増加を抑える（各`upsertManual`/`upsertManualBatch`が
 * 「現在も最新の行である場合のみUPDATE」を判定する）。
 *
 * @param params.userId - ユーザー ID
 * @param params.version - バージョン番号
 * @param params.score - 保存する単曲スコア
 * @param params.allScore - 全難易度履歴側にも書き込む場合のスコア（改善時のみ呼び出し元が渡す）
 * @param params.newTotalBpi - 今回算出した総合BPI（ratchet適用前）
 * @returns 実際に保存した総合BPIと、使用したbatchId
 */
export async function saveManualScoreUpdate(params: {
  userId: string;
  version: string;
  score: ManualScoreInput;
  allScore?: ManualAllScoreInput;
  newTotalBpi: number;
}): Promise<{ totalBpi: number; batchId: string }> {
  const { userId, version, score, allScore, newTotalBpi } = params;
  const batchId = getManualBatchId(userId, version);
  const lastPlayed = new Date();

  return await db.transaction().execute(async (trx) => {
    const latestLog = await userStatusLogsRepo.getLatestArenaRank(
      trx,
      userId,
      version,
    );
    const currentArenaRank = latestLog?.arenaRank ?? null;

    await scoresRepo.upsertManual(trx, {
      userId,
      songId: score.songId,
      definitionId: score.definitionId,
      version,
      batchId,
      exScore: score.exScore,
      bpi: score.bpi,
      clearState: score.clearState,
      missCount: score.missCount,
      lastPlayed,
    });

    if (allScore) {
      await allScoresRepo.upsertManual(trx, {
        userId,
        songId: allScore.songId,
        version,
        batchId,
        exScore: allScore.exScore,
        bpi: allScore.bpi,
        clearState: allScore.clearState,
        missCount: allScore.missCount,
        lastPlayed,
      });
    }

    const previousBest = await userStatusLogsRepo.getMaxTotalBpi(
      trx,
      userId,
      version,
    );
    const totalBpi = BpiCalculator.ratchetTotalBpi(previousBest, newTotalBpi);

    await navigationRepo.upsertManualBatch(trx, {
      userId,
      version,
      batchId,
      totalBpi,
    });
    await userStatusLogsRepo.upsertManualBatch(trx, {
      userId,
      version,
      batchId,
      totalBpi,
      arenaRank: currentArenaRank,
    });

    return { totalBpi, batchId };
  });
}
