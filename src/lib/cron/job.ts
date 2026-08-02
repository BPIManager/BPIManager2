import cron from "node-cron";
import { generateArenaJson } from "./metrics";
import { generateInfoJson } from "./metrics/info";
import { fetchOfficialArenaDistribution, getArenaEventPeriod } from "./arena";
import { updateAllUserRadarCache } from "./radar";
import { updateAllSongRankingCache } from "./songRanking";
import { generateUserSitemap } from "./sitemaps";
import { invalidateArenaAveragesCache } from "@/lib/cache/arenaAverages";
import dayjs from "../dayjs";

/**
 * cronジョブ共通の実行ラッパー。開始ログを出し、失敗時はエラーをログに
 * 残した上で握りつぶす(cronの次回実行を妨げないため再throwはしない)。
 */
async function runCronJob(name: string, task: () => Promise<void>) {
  console.log(`[Cron] ${name}`);
  try {
    await task();
  } catch (err) {
    console.error(`[Cron] ${name} failed:`, err);
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
      console.log(
        `  Period  : ${toJST(period.start)} ~ ${toJST(period.end)} JST`,
      );

      if (inPeriod) {
        const remaining = formatDuration(period.end.getTime() - now.getTime());
        console.log(`  Status  : LIVE  (残り ${remaining})`);
        console.log(
          "  Interval: 30分ごと (JST 07:00-翌00:59)  +  daily JST 01:30",
        );
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
 * - 12 時間ごと（radarキャッシュとは6時間ずらして）に `updateAllSongRankingCache`
 * - アリーナ開催期間中は JST 07:00〜翌00:59（UTC 22:00〜15:59）の間、
 *   30 分ごとに `fetchOfficialArenaDistribution` を追加実行
 */
export async function setupArenaService() {
  // 起動時バックグラウンドタスク
  runCronJob("Daily task", generateUserSitemap);
  runCronJob("Initial arena JSON", generateArenaJson);
  runCronJob("Initial info JSON", generateInfoJson);
  runCronJob("Initial radar cache", updateAllUserRadarCache);
  runCronJob("Initial song ranking cache", updateAllSongRankingCache);
  runCronJob("Initial arena distribution", fetchOfficialArenaDistribution);

  // アリーナステータス表示
  printArenaStatus().catch(() => {});

  // ── Cron 登録 ──────────────────────────────────────────────

  cron.schedule("0 2 * * *", () => {
    runCronJob("Daily task", generateUserSitemap);
  });

  cron.schedule("0 4 * * *", () => {
    runCronJob("generateArenaJson", async () => {
      await generateArenaJson();
      invalidateArenaAveragesCache();
    });
  });

  cron.schedule("0 16 * * *", () => {
    runCronJob("generateInfoJson", generateInfoJson);
  });

  cron.schedule("30 16 * * *", () => {
    runCronJob("fetchOfficialArenaDistribution (daily)", fetchOfficialArenaDistribution);
  });

  // アリーナ開催期間中は JST 07:00〜翌00:59（UTC 22:00〜15:59）の間、30 分ごとに取得
  cron.schedule("*/30 22-23,0-15 * * *", async () => {
    try {
      const period = await getArenaEventPeriod();
      const now = new Date();
      if (!period || now < period.start || now > period.end) return;
      await runCronJob(
        `fetchOfficialArenaDistribution (arena live Round ${period.round}) / ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
        fetchOfficialArenaDistribution,
      );
    } catch (err) {
      console.error("[Cron] Frequent arena fetch failed:", err);
    }
  });

  cron.schedule("0 */12 * * *", () => {
    runCronJob("updateAllUserRadarCache", updateAllUserRadarCache);
  });

  cron.schedule("0 6,18 * * *", () => {
    runCronJob("updateAllSongRankingCache", updateAllSongRankingCache);
  });

  console.log("[Cron] All jobs registered.");
}
