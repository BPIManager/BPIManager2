import cron from "node-cron";
import fs from "fs/promises";
import path from "path";
import { generateArenaJson } from "./metrics";
import { updateAllUserRadarCache } from "./radar";
import { generateUserSitemap } from "./sitemaps";

const OUTPUT_DIR = path.join(process.cwd(), "public/data/metrics/arena");

async function performDailyTask() {
  console.log("--- Executing Daily Task (Database sync, etc.) ---");
  try {
    await generateUserSitemap();
    console.log("--- Daily Task completed successfully. ---");
  } catch (err) {
    console.error("--- Daily Task failed! ---", err);
  }
}

export async function setupArenaService() {
  performDailyTask();
  let isArenaMissing = false;
  try {
    const files = await fs.readdir(OUTPUT_DIR);
    if (files.length === 0) isArenaMissing = true;
  } catch (err) {
    isArenaMissing = true;
  }

  if (isArenaMissing) {
    console.log("--- Initial Arena JSON generation starting... ---");
    generateArenaJson()
      .then(() => console.log("--- Initial Arena generation success. ---"))
      .catch((err) =>
        console.error("--- Initial Arena generation failed! ---", err),
      );
  }

  console.log("--- Initial Radar Cache update starting... ---");
  updateAllUserRadarCache()
    .then(() => console.log("--- Initial Radar Cache update success. ---"))
    .catch((err) =>
      console.error("--- Initial Radar Cache update failed! ---", err),
    );

  cron.schedule("0 2 * * *", async () => {
    console.log("[Cron] Running Task: performDailyTask");
    await performDailyTask();
  });

  cron.schedule("0 4 * * *", async () => {
    console.log("[Cron] Running Task: generateArenaJson");
    try {
      await generateArenaJson();
    } catch (err) {
      console.error("[Cron] Arena Job Failed:", err);
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
