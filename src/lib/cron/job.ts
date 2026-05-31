import cron from "node-cron";
import { generateArenaJson } from "./metrics";
import { generateInfoJson } from "./metrics/info";
import { fetchOfficialArenaDistribution } from "./fetchOfficialArena";
import { updateAllUserRadarCache } from "./radar";
import { generateUserSitemap } from "./sitemaps";
import { invalidateArenaAveragesCache } from "@/lib/cache/arenaAverages";

async function performDailyTask() {
  console.log("--- Executing Daily Task (Database sync, etc.) ---");
  try {
    await generateUserSitemap();
    console.log("--- Daily Task completed successfully. ---");
  } catch (err) {
    console.error("--- Daily Task failed! ---", err);
  }
}

/**
 * サーバー起動時に呼び出す Cron ジョブのセットアップ関数。
 *
 * 以下のタスクを登録する:
 * - 起動時に `performDailyTask`（ユーザーサイトマップ生成）を即時実行
 * - Arena JSON が存在しない場合は起動時に即時生成
 * - 起動時にレーダーキャッシュを即時更新
 * - 毎日 02:00 UTC に `performDailyTask` を実行
 * - 毎日 04:00 UTC に `generateArenaJson` を実行
 * - 12 時間ごとに `updateAllUserRadarCache` を実行
 */
export async function setupArenaService() {
  performDailyTask();

  console.log("--- Initial Arena JSON generation starting... ---");
  generateArenaJson()
    .then(() => console.log("--- Initial Arena generation success. ---"))
    .catch((err) =>
      console.error("--- Initial Arena generation failed! ---", err),
    );

  console.log("--- Initial Info JSON generation starting... ---");
  generateInfoJson()
    .then(() => console.log("--- Initial Info generation success. ---"))
    .catch((err) =>
      console.error("--- Initial Info generation failed! ---", err),
    );

  console.log("--- Initial Radar Cache update starting... ---");
  updateAllUserRadarCache()
    .then(() => console.log("--- Initial Radar Cache update success. ---"))
    .catch((err) =>
      console.error("--- Initial Radar Cache update failed! ---", err),
    );

  console.log("--- Initial Official Arena fetch starting... ---");
  fetchOfficialArenaDistribution()
    .then(() => console.log("--- Initial Official Arena fetch success. ---"))
    .catch((err) =>
      console.error("--- Initial Official Arena fetch failed! ---", err),
    );

  cron.schedule("0 2 * * *", async () => {
    console.log("[Cron] Running Task: performDailyTask");
    await performDailyTask();
  });

  cron.schedule("0 4 * * *", async () => {
    console.log("[Cron] Running Task: generateArenaJson");
    try {
      await generateArenaJson();
      invalidateArenaAveragesCache();
    } catch (err) {
      console.error("[Cron] Arena Job Failed:", err);
    }
  });

  cron.schedule("0 16 * * *", async () => {
    console.log("[Cron] Running Task: generateInfoJson");
    try {
      await generateInfoJson();
    } catch (err) {
      console.error("[Cron] Info JSON Job Failed:", err);
    }
  });

  cron.schedule("30 16 * * *", async () => {
    console.log("[Cron] Running Task: fetchOfficialArenaDistribution");
    try {
      await fetchOfficialArenaDistribution();
    } catch (err) {
      console.error("[Cron] Official Arena Job Failed:", err);
    }
  });

  cron.schedule("0 */12 * * *", async () => {
    console.log("[Cron] Running Task: updateAllUserRadarCache");
    try {
      await updateAllUserRadarCache();
      console.log("[Cron] Radar Cache updated successfully.");
    } catch (err) {
      console.error("[Cron] Radar Cache Job Failed:", err);
    }
  });

  console.log("Arena & Radar Cron Service registered.");
}
