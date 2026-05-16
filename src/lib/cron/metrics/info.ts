import fs from "fs/promises";
import path from "path";
import { siteStatsRepo } from "@/lib/db/siteStats";

const OUTPUT_DIR = path.join(process.cwd(), "public/data/info");
const STATS_FILE = path.join(OUTPUT_DIR, "stats.json");
const SONGS_FILE = path.join(OUTPUT_DIR, "songs.json");

/**
 * サイト統計データを集計し、静的 JSON ファイルとして出力する。
 *
 * 出力先:
 * - `public/data/info/stats.json`  - サマリー・日別推移・アリーナランク分布・時間帯別・曜日別
 * - `public/data/info/songs.json`  - ☆12 楽曲別プレイ人口（playerCount 降順の全件）
 */
export async function generateInfoJson() {
  console.log("[Info] Starting site stats JSON generation...");

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const [summary, dailyRegistrations, arenaRankDistribution, versionScoreDistribution, hourlyDistribution, weekdayDistribution] =
    await Promise.all([
      siteStatsRepo.getSummary(),
      siteStatsRepo.getDailyRegistrations(90),
      siteStatsRepo.getArenaRankDistribution(),
      siteStatsRepo.getVersionScoreDistribution(),
      siteStatsRepo.getHourlyDistribution(),
      siteStatsRepo.getWeekdayDistribution(),
    ]);

  await fs.writeFile(
    STATS_FILE,
    JSON.stringify({
      summary,
      dailyRegistrations,
      arenaRankDistribution,
      versionScoreDistribution,
      hourlyDistribution,
      weekdayDistribution,
      generatedAt: new Date().toISOString(),
    }),
  );
  console.log(`[Info] Saved: ${STATS_FILE}`);

  // 全件取得してplayerCount降順で保存（APIでスライス）
  const total = await siteStatsRepo.getSongPopulationTotal();
  const songs = await siteStatsRepo.getSongPopulationPage("top", 0, total || 9999);

  await fs.writeFile(SONGS_FILE, JSON.stringify({ songs, generatedAt: new Date().toISOString() }));
  console.log(`[Info] Saved: ${SONGS_FILE} (${songs.length} songs)`);

  console.log("[Info] Site stats JSON generation completed.");
}
