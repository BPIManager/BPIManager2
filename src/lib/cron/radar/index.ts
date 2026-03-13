import { db } from "@/lib/db";
import { calculateRadar } from "@/lib/radar/calculator";
import { latestVersion } from "@/constants/latestVersion";
import { BpiCalculator } from "@/lib/bpi";
import { statsRepo } from "@/lib/db/stats";

export async function updateAllUserRadarCache() {
  const version = latestVersion;

  console.log(`Starting radar cache update for version: ${version}`);

  const users = await db.selectFrom("users").select("userId").execute();
  console.log(`Found ${users.length} users.`);

  for (const user of users) {
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

      console.log(`Updated cache for user: ${user.userId}`);
    } catch (e) {
      console.error(`Failed to update user ${user.userId}:`, e);
    }
  }

  console.log("Radar cache update completed.");
}
