import { db } from "@/lib/db";
import { calculateRadar } from "@/lib/radar/calculator";
import { latestVersion } from "@/constants/latestVersion";
import { BpiCalculator } from "@/lib/bpi";
import { statsRepo } from "@/lib/db/stats";

/**
 * 全ユーザーのレーダーキャッシュ（`userRadarCache` テーブル）を最新スコアで更新する。
 *
 * 各ユーザーの最新スコアから `calculateRadar` でカテゴリ別 BPI を算出し、
 * 総合 BPI とともに `userRadarCache` に UPSERT する。
 * スコアが存在しないユーザーはスキップされる。
 */
export async function updateAllUserRadarCache() {
  const version = latestVersion;
  const users = await db.selectFrom("users").select("userId").execute();
  const total = users.length;
  let updated = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    process.stdout.write(`\r\x1b[K[Radar] Updating cache... ${i + 1}/${total}`);
    try {
      const scores = await statsRepo.getLatestScoresWithMusicData(
        user.userId,
        version,
      );

      if (scores.length === 0) continue;

      const radar = calculateRadar(scores);

      const validBpis = scores
        .map((s) => Number(s.bpi ?? -15))
        .sort((a, b) => b - a);
      const totalBpi = BpiCalculator.calculateTotalBPI(
        validBpis,
        scores.length,
      );

      const data = {
        notes: radar.NOTES.totalBpi.toFixed(2),
        chord: radar.CHORD.totalBpi.toFixed(2),
        peak: radar.PEAK.totalBpi.toFixed(2),
        charge: radar.CHARGE.totalBpi.toFixed(2),
        scratch: radar.SCRATCH.totalBpi.toFixed(2),
        soflan: radar.SOFLAN.totalBpi.toFixed(2),
        totalBpi: totalBpi.toFixed(2),
      };

      await db
        .insertInto("userRadarCache")
        .values({
          userId: user.userId,
          version: version,
          ...data,
        })
        .onDuplicateKeyUpdate({
          ...data,
          updatedAt: new Date(),
        })
        .execute();

      updated++;
    } catch (e) {
      process.stdout.write("\r\x1b[K");
      console.error(`[Radar] Failed for user ${user.userId}:`, e);
    }
  }

  process.stdout.write("\r\x1b[K");
  console.log(`[Radar] Cache update done: ${updated}/${total} users updated`);
}
