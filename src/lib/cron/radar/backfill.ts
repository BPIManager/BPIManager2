import { latestScoresRepo } from "@/lib/db/domains/scores/latest";
import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { logRadarRepo } from "@/lib/db/domains/logs/radar";
import {
  computeRadarValues,
  ratchetRadarValues,
  type RadarValues,
} from "@/lib/radar/snapshot";
import type { IIDXVersion } from "@/types/iidx/version";

const sameValues = (a: RadarValues | null, b: RadarValues) =>
  !!a &&
  (Object.keys(b) as (keyof RadarValues)[]).every(
    (k) => Math.round(a[k] * 100) === Math.round(b[k] * 100),
  );

/**
 * 1ユーザー×バージョンの全バッチを古い順にたどり、logs のレーダー値（ラチェット後）を埋める・直す。
 * 未算出のバッチはその時点のスコアから算出し、算出済みのバッチも含めて過去最高を下回らないよう単調に補正する
 * （導入直後に履歴の無い状態でラチェットされた値の不連続を解消するため）。何度実行しても結果は同じ。
 *
 * @returns 書き込んだバッチ数
 */
export async function backfillUserVersionRadar(
  userId: string,
  version: string,
  options: { dryRun?: boolean } = {},
): Promise<number> {
  const [batches, maxLogIds, fullMaster, validPairs] = await Promise.all([
    logRadarRepo.listBatches(userId, version),
    latestScoresRepo.getMaxLogIdByBatch(userId, version),
    songMasterRepo.getSongMasterWithDef(),
    songMasterRepo.getFilteredTitleDifficultyPairs(version as IIDXVersion),
  ]);
  const validSongKeys = new Set(validPairs.map((r) => `${r.title}___${r.difficulty}`));

  let running: RadarValues | null = null;
  let written = 0;
  for (const batch of batches) {
    let fresh = batch.values;
    if (!fresh) {
      const untilLogId = maxLogIds.get(batch.batchId);
      // スコアを持たないバッチは直前の値を引き継ぐ
      if (untilLogId === undefined) {
        if (!running) continue;
        fresh = running;
      } else {
        const scores = await latestScoresRepo.getLatestScoresUntilLogId(userId, version, untilLogId);
        fresh = computeRadarValues(scores, fullMaster, validSongKeys);
      }
    }
    running = ratchetRadarValues(running, fresh);
    if (!sameValues(batch.values, running)) {
      if (!options.dryRun) await logRadarRepo.setForBatch(userId, batch.batchId, running);
      written++;
    }
  }
  return written;
}

/**
 * レーダー値が未算出のバッチがあるユーザー×バージョンすべてをバックフィルする。
 *
 * @param options.versions - 対象バージョン（省略時は全バージョン）
 */
export async function backfillLogRadar(
  options: { versions?: string[]; dryRun?: boolean } = {},
) {
  const targets = await logRadarRepo.listUserVersionsWithPending(options.versions);
  let total = 0;
  let done = 0;
  for (const { userId, version } of targets) {
    try {
      total += await backfillUserVersionRadar(userId, version, options);
    } catch (e) {
      console.error(`[LogRadar] Failed for ${userId}/${version}:`, e);
    } finally {
      done++;
      if (done % 100 === 0 || done === targets.length) {
        console.log(`[LogRadar] ${done}/${targets.length} (written ${total})`);
      }
    }
  }
  return { targets: targets.length, written: total };
}
