import fs from "fs/promises";
import path from "path";
import { siteStatsOverviewRepo } from "@/lib/db/aggregates/siteStats/overview";
import { siteStatsDistributionRepo } from "@/lib/db/aggregates/siteStats/distribution";
import { siteStatsActivityDistributionRepo } from "@/lib/db/aggregates/siteStats/activityDistribution";
import { siteStatsSongPopulationRepo } from "@/lib/db/aggregates/siteStats/songPopulation";

const OUTPUT_DIR = path.join(process.cwd(), "public/data/info");
const STATS_FILE = path.join(OUTPUT_DIR, "stats.json");
const SONGS_FILE = path.join(OUTPUT_DIR, "songs.json");

/**
 * サイト統計を集計し静的 JSON として出力する。stats.json（サマリー・推移・分布等）と songs.json（☆12 楽曲別プレイ人口）。
 * 出力先は public/data/info/ 配下。
 */
export async function generateInfoJson() {
  console.log("[Info] Starting site stats JSON generation...");

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const [
    summary,
    dailyRegistrations,
    arenaRankDistribution,
    areaDistribution,
    versionScoreDistribution,
    hourlyDistribution,
    weekdayDistribution,
    totalBpiHistogram,
  ] = await Promise.all([
    siteStatsOverviewRepo.getSummary(),
    siteStatsOverviewRepo.getDailyRegistrations(90),
    siteStatsDistributionRepo.getArenaRankDistributionByVersion(),
    siteStatsDistributionRepo.getAreaDistributionByVersion(),
    siteStatsDistributionRepo.getVersionScoreDistribution(),
    siteStatsActivityDistributionRepo.getHourlyDistribution(),
    siteStatsActivityDistributionRepo.getWeekdayDistribution(),
    siteStatsDistributionRepo.getTotalBpiHistogramByVersion(),
  ]);

  await fs.writeFile(
    STATS_FILE,
    JSON.stringify({
      summary,
      dailyRegistrations,
      arenaRankDistribution,
      areaDistribution,
      versionScoreDistribution,
      hourlyDistribution,
      weekdayDistribution,
      totalBpiHistogram,
      generatedAt: new Date().toISOString(),
    }),
  );
  console.log(`[Info] Saved: ${STATS_FILE}`);

  // 全件取得してplayerCount降順で保存（APIでスライス）
  const total = await siteStatsSongPopulationRepo.getSongPopulationTotal();
  const songs = await siteStatsSongPopulationRepo.getSongPopulationPage(
    "top",
    0,
    total || 9999,
  );

  await fs.writeFile(SONGS_FILE, JSON.stringify({ songs, generatedAt: new Date().toISOString() }));
  console.log(`[Info] Saved: ${SONGS_FILE} (${songs.length} songs)`);

  console.log("[Info] Site stats JSON generation completed.");
}
