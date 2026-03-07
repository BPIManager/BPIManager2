import cron from "node-cron";
import fs from "fs/promises";
import path from "path";
import { generateArenaJson } from ".";

const OUTPUT_DIR = path.join(process.cwd(), "public/data/metrics/arena");

export async function setupArenaService() {
  let isMissing = false;
  try {
    const files = await fs.readdir(OUTPUT_DIR);
    if (files.length === 0) isMissing = true;
  } catch (err) {
    isMissing = true;
  }

  if (isMissing) {
    console.log("--- Initial Arena JSON generation starting... ---");
    try {
      await generateArenaJson();
      console.log("--- Initial generation success. ---");
    } catch (err) {
      console.error("--- Initial generation failed! ---", err);
    }
  }

  cron.schedule("0 4 * * *", async () => {
    console.log("Running Scheduled Job: generateArenaJson");
    try {
      await generateArenaJson();
    } catch (err) {
      console.error("Cron Job Failed:", err);
    }
  });

  console.log("Arena Cron Service registered.");
}
