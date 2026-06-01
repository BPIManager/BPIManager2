import cron from "node-cron";
import { generateArenaJson } from "./metrics";
import { generateInfoJson } from "./metrics/info";
import {
  fetchOfficialArenaDistribution,
  getArenaEventPeriod,
} from "./arena";
import { updateAllUserRadarCache } from "./radar";
import { generateUserSitemap } from "./sitemaps";
import { invalidateArenaAveragesCache } from "@/lib/cache/arenaAverages";

async function performDailyTask() {
  try {
    await generateUserSitemap();
  } catch (err) {
    console.error("[Cron] Daily task failed:", err);
  }
}

function formatDuration(ms: number): string {
  const total = Math.max(0, ms);
  const d = Math.floor(total / 86400000);
  const h = Math.floor((total % 86400000) / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function toJST(d: Date): string {
  return new Date(d.getTime() + 9 * 3600000)
    .toISOString()
    .slice(0, 16)
    .replace("T", " ");
}

async function printArenaStatus() {
  const SEP = "─".repeat(52);
  console.log(`\n[Arena Service] ${SEP}`);
  try {
    const period = await getArenaEventPeriod();
    const now = new Date();

    if (!period) {
      console.log("  Event   : No arena event data found");
      console.log("  Interval: daily at JST 01:30");
    } else {
      const inPeriod = now >= period.start && now <= period.end;
      const upcoming = now < period.start;

      console.log(`  Event   : Round ${period.round}`);
      console.log(`  Period  : ${toJST(period.start)} ~ ${toJST(period.end)} JST`);

      if (inPeriod) {
        const remaining = formatDuration(period.end.getTime() - now.getTime());
        console.log(`  Status  : LIVE  (残り ${remaining})`);
        console.log("  Interval: 30分ごと (JST 07:00-24:00)  +  daily JST 01:30");
      } else if (upcoming) {
        const until = formatDuration(period.start.getTime() - now.getTime());
        console.log(`  Status  : Upcoming  (開始まで ${until})`);
        console.log("  Interval: daily at JST 01:30");
      } else {
        console.log("  Status  : Ended");
        console.log("  Interval: daily at JST 01:30");
      }
    }
  } catch (err) {
    console.warn("  Arena status unavailable:", err);
  }
  console.log(SEP + "\n");
}

/**
 * サーバー起動時に呼び出す Cron ジョブのセットアップ関数。
 *
 * 以下のタスクを登録する:
 * - 毎日 02:00 UTC に `performDailyTask`（ユーザーサイトマップ生成）
 * - 毎日 04:00 UTC に `generateArenaJson`
 * - 毎日 16:00 UTC に `generateInfoJson`
 * - 毎日 UTC 16:30（JST 01:30）に `fetchOfficialArenaDistribution`
 * - 12 時間ごとに `updateAllUserRadarCache`
 * - アリーナ開催期間中は JST 07:00〜24:00（UTC 22:00〜14:59）の間、
 *   30 分ごとに `fetchOfficialArenaDistribution` を追加実行
 */
export async function setupArenaService() {
  // 起動時バックグラウンドタスク
  performDailyTask();

  generateArenaJson().catch((err) =>
    console.error("[Cron] Initial arena JSON failed:", err),
  );
  generateInfoJson().catch((err) =>
    console.error("[Cron] Initial info JSON failed:", err),
  );
  updateAllUserRadarCache().catch((err) =>
    console.error("[Cron] Initial radar cache failed:", err),
  );
  fetchOfficialArenaDistribution().catch((err) =>
    console.error("[Cron] Initial arena distribution failed:", err),
  );

  // アリーナステータス表示
  printArenaStatus().catch(() => {});

  // ── Cron 登録 ──────────────────────────────────────────────

  cron.schedule("0 2 * * *", () => {
    console.log("[Cron] performDailyTask");
    performDailyTask();
  });

  cron.schedule("0 4 * * *", async () => {
    console.log("[Cron] generateArenaJson");
    try {
      await generateArenaJson();
      invalidateArenaAveragesCache();
    } catch (err) {
      console.error("[Cron] Arena JSON failed:", err);
    }
  });

  cron.schedule("0 16 * * *", async () => {
    console.log("[Cron] generateInfoJson");
    try {
      await generateInfoJson();
    } catch (err) {
      console.error("[Cron] Info JSON failed:", err);
    }
  });

  cron.schedule("30 16 * * *", async () => {
    console.log("[Cron] fetchOfficialArenaDistribution (daily)");
    try {
      await fetchOfficialArenaDistribution();
    } catch (err) {
      console.error("[Cron] Arena distribution failed:", err);
    }
  });

  // アリーナ開催期間中は JST 07:00〜24:00（UTC 22:00〜14:59）の間、30 分ごとに取得
  cron.schedule("*/30 22-23,0-14 * * *", async () => {
    try {
      const period = await getArenaEventPeriod();
      const now = new Date();
      if (!period || now < period.start || now > period.end) return;
      console.log(`[Cron] fetchOfficialArenaDistribution (arena live Round ${period.round})`);
      await fetchOfficialArenaDistribution();
    } catch (err) {
      console.error("[Cron] Frequent arena fetch failed:", err);
    }
  });

  cron.schedule("0 */12 * * *", async () => {
    console.log("[Cron] updateAllUserRadarCache");
    try {
      await updateAllUserRadarCache();
    } catch (err) {
      console.error("[Cron] Radar cache failed:", err);
    }
  });

  console.log("[Cron] All jobs registered.");
}
