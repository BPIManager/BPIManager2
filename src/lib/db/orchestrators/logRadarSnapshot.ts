import type { Transaction } from "kysely";
import type { Database } from "@/types/db";
import { latestScoresRepo } from "@/lib/db/domains/scores/latest";
import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { logRadarRepo } from "@/lib/db/domains/logs/radar";
import {
  computeRadarValues,
  ratchetRadarValues,
  type RadarValues,
} from "@/lib/radar/snapshot";
import type { IIDXVersion } from "@/types/iidx/version";

/**
 * バッチ保存後のスコアからレーダー6カテゴリ値を算出し、過去最高を下回らないようラチェットして logs に保存する。
 * 呼び出し元のトランザクションに参加する（logs 行とスコアが書き込み済みであること）。
 * 算出に失敗してもインポート自体は成功させ、その場合は値を保存しない（未算出=NULL のまま）。
 *
 * @returns 保存したラチェット後の値（算出に失敗した場合は null）
 */
export async function saveRadarSnapshot(
  trx: Transaction<Database>,
  params: { userId: string; version: string; batchId: string },
): Promise<RadarValues | null> {
  const { userId, version, batchId } = params;

  let fresh: RadarValues;
  try {
    const latestScores = await latestScoresRepo.getLatestScores(userId, version, trx);
    const [fullMaster, validPairs] = await Promise.all([
      songMasterRepo.getSongMasterWithDef(),
      songMasterRepo.getFilteredTitleDifficultyPairs(version as IIDXVersion),
    ]);
    const validSongKeys = new Set(validPairs.map((r) => `${r.title}___${r.difficulty}`));
    fresh = computeRadarValues(latestScores, fullMaster, validSongKeys);
  } catch (error) {
    console.error("[saveRadarSnapshot] failed to compute radar", error);
    return null;
  }

  const previousBest = await logRadarRepo.getMax(userId, version, trx);
  const values = ratchetRadarValues(previousBest, fresh);
  await logRadarRepo.setForBatch(userId, batchId, values, trx);
  return values;
}
