import { db } from "@/lib/db";
import { scoresRepo } from "@/lib/db/domains/scores";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";
import { BpiCalculator } from "@/lib/bpi";
import { getManualBatchPrefix, mintManualBatchId } from "@/lib/scores/manualBatchId";

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
 * CSVインポート（`saveImportResults`）とは別の経路。`logs`の現在の最新
 * batchIdが当日の手動編集プレフィックス（{@link getManualBatchPrefix}）と
 * 一致する場合はそれをそのまま使い回し、同日内の複数回の手動保存を
 * `logs`/`userStatusLogs`/`scores`/`allScores`それぞれ1行にまとめて
 * レコード増加を抑える（各`upsertManual`/`upsertManualBatch`が
 * 「現在も最新の行である場合のみUPDATE」を判定する）。
 *
 * 一致しない場合（間にCSVインポート等が挟まった場合）は
 * {@link mintManualBatchId} で新しい一意なbatchIdを発行する。
 * `logs.batchId`にはUNIQUE制約があるため、決定的な（サフィックス無しの）
 * IDをそのまま使い回してINSERTすると、既に別の行で使用済みの場合に
 * 重複キーエラーになるため。
 *
 * `score`（BPI計算対象、☆11/12）・`allScore`（全難易度履歴）はそれぞれ
 * 独立に「改善時のみ」呼び出し元が渡す（CSVバッチインポートと同じ方針）。
 * `score`が無い場合（☆10以下の楽曲）は`logs`/`userStatusLogs`（総合BPI）
 * には一切触れない。
 *
 * @param params.userId - ユーザー ID
 * @param params.version - バージョン番号
 * @param params.score - 保存する単曲スコア（改善が無ければ呼び出し元は渡さない）
 * @param params.allScore - 全難易度履歴側のスコア（改善が無ければ呼び出し元は渡さない）
 * @param params.newTotalBpi - 今回算出した総合BPI（`score`がある場合のみ必須、ratchet適用前）
 * @returns 実際に保存した総合BPI（`score`が無ければ`null`）と、使用したbatchId
 */
export async function saveManualScoreUpdate(params: {
  userId: string;
  version: string;
  score?: ManualScoreInput;
  allScore?: ManualAllScoreInput;
  newTotalBpi?: number;
}): Promise<{ totalBpi: number | null; batchId: string }> {
  const { userId, version, score, allScore, newTotalBpi } = params;

  const prefix = getManualBatchPrefix(userId, version);
  const currentLatestBatchId = await navigationRepo.getLatestBatchId(
    userId,
    version,
  );
  const batchId = currentLatestBatchId?.startsWith(prefix)
    ? currentLatestBatchId
    : mintManualBatchId(userId, version);

  const lastPlayed = new Date();

  return await db.transaction().execute(async (trx) => {
    let totalBpi: number | null = null;

    // `scores.batchId`は`logs.batchId`への外部キーのため、`logs`側の行を
    // 先に用意してから`scores`へ書き込む必要がある（CSVインポート
    // `executeSaveBpiSystem`と同じ順序）。
    if (score) {
      const latestLog = await userStatusLogsRepo.getLatestArenaRank(
        trx,
        userId,
        version,
      );
      const currentArenaRank = latestLog?.arenaRank ?? null;

      const previousBest = await userStatusLogsRepo.getMaxTotalBpi(
        trx,
        userId,
        version,
      );
      totalBpi = BpiCalculator.ratchetTotalBpi(
        previousBest,
        newTotalBpi ?? previousBest ?? -15,
      );

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
    }

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

    return { totalBpi, batchId };
  });
}
