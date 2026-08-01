import { calculateRadar } from "@/lib/radar/calculator";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { BpiCalculator } from "@/lib/bpi";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { usersRepo } from "@/lib/db/domains/users";
import {
  radarCacheRepo,
  type NewUserRadarCache,
} from "@/lib/db/domains/radar";

/** 同時に処理するユーザー数の上限。DB・イベントループへの負荷とジョブ実行時間のバランスを取る。 */
const CONCURRENCY = 10;

/**
 * 各アイテムに対する非同期処理を、指定した同時実行数を超えないよう実行する。
 *
 * @param items - 処理対象の配列
 * @param limit - 同時実行数の上限
 * @param worker - 各アイテムに対する非同期処理
 */
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  async function runNext(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, runNext),
  );
}

/**
 * 全ユーザーのレーダーキャッシュ（`userRadarCache` テーブル）を最新スコアで更新する。
 *
 * 各ユーザーの最新スコアから `calculateRadar` でカテゴリ別 BPI を算出し、
 * 総合 BPI とともに算出結果をメモリ上に集約したうえで、最後にbulk UPSERTで
 * まとめて書き込むことでDBラウンドトリップ数を削減する。
 * スコアが存在しないユーザーはスキップされる。
 * ユーザー数の増加に伴う実行時間の線形増大を避けるため、
 * 読み取り・計算部分は{@link CONCURRENCY}件ずつ並列処理する。
 */
export async function updateAllUserRadarCache() {
  const version = latestVersion;
  const users = await usersRepo.getAllUserIds();
  const total = users.length;
  let done = 0;
  const pendingRows: NewUserRadarCache[] = [];

  await runWithConcurrency(users, CONCURRENCY, async (user) => {
    try {
      const scores = await statsTablesRepo.getLatestScoresWithMusicData(
        user.userId,
        version,
      );

      if (scores.length > 0) {
        const radar = calculateRadar(scores);

        const validBpis = scores
          .map((s) => Number(s.bpi ?? -15))
          .sort((a, b) => b - a);
        const totalBpi = BpiCalculator.calculateTotalBPI(
          validBpis,
          scores.length,
        );

        pendingRows.push({
          userId: user.userId,
          version,
          notes: radar.NOTES.totalBpi.toFixed(2),
          chord: radar.CHORD.totalBpi.toFixed(2),
          peak: radar.PEAK.totalBpi.toFixed(2),
          charge: radar.CHARGE.totalBpi.toFixed(2),
          scratch: radar.SCRATCH.totalBpi.toFixed(2),
          soflan: radar.SOFLAN.totalBpi.toFixed(2),
          totalBpi: totalBpi.toFixed(2),
        });
      }
    } catch (e) {
      process.stdout.write("\r\x1b[K");
      console.error(`[Radar] Failed for user ${user.userId}:`, e);
    } finally {
      done++;
      process.stdout.write(`\r\x1b[K[Radar] Calculating... ${done}/${total}`);
    }
  });

  process.stdout.write("\r\x1b[K");
  console.log(`[Radar] Writing cache for ${pendingRows.length} users...`);
  await radarCacheRepo.bulkUpsert(pendingRows);

  console.log(
    `[Radar] Cache update done: ${pendingRows.length}/${total} users updated`,
  );
}
