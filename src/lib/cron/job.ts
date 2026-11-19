import cron from "node-cron";
import { generateArenaJson } from "./metrics";
import { generateInfoJson } from "./metrics/info";
import { fetchOfficialArenaDistribution, getArenaEventPeriod } from "./arena";
import { updateAllUserRadarCache } from "./radar";
import { updateAllSongRankingCache } from "./songRanking";
import { generateUserSitemap } from "./sitemaps";
import { invalidateArenaAveragesCache } from "@/lib/cache/arenaAverages";
import dayjs from "../dayjs";

/** 実行中のジョブ（同じ処理を起動時と定期実行で重ねて走らせないためのキー集合） */
const runningJobs = new Set<unknown>();

/**
 * cronジョブ共通の実行ラッパー。開始ログを出し、失敗時はエラーをログに
 * 残した上で握りつぶす(cronの次回実行を妨げないため再throwはしない)。
 * 同じ key のジョブが実行中なら、重ねて実行せずスキップする。
 *
 * @param key - 重複実行の判定キー（省略時は task 自身）
 */
export async function runCronJob(
  name: string,
  task: () => Promise<void>,
  key: unknown = task,
) {
  if (runningJobs.has(key)) {
    console.warn(`[Cron] ${name} skipped: previous run is still in progress`);
    return;
  }
  runningJobs.add(key);
  console.log(`[Cron] ${name}`);
  try {
    await task();
  } catch (err) {
    console.error(`[Cron] ${name} failed:`, err);
  } finally {
    runningJobs.delete(key);
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
 * サーバー起動時にCronジョブを登録する。日次（サイトマップ・arena・info）、1時間ごと（レーダー）、12時間ごと（曲ランキング）等。
 * アリーナ開催期間中（JST 07:00〜翌00:59）は公式アリーナ分布の取得を30分ごとに追加実行する。
 */
/**
 * 全ジョブの実行時刻はUTC基準（下記の式・コメントはUTCで書かれている）。
 * ホストのTZに依存せず同じ時刻に動くよう、timezone を明示する。
 */
const schedule = (expression: string, task: () => void | Promise<void>) =>
  cron.schedule(expression, task, { timezone: "UTC" });

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

  schedule("0 2 * * *", () => {
    runCronJob("Daily task", generateUserSitemap);
  });

  schedule("0 4 * * *", () => {
    runCronJob(
      "generateArenaJson",
      async () => {
        await generateArenaJson();
        invalidateArenaAveragesCache();
      },
      generateArenaJson,
    );
  });

  schedule("0 16 * * *", () => {
    runCronJob("generateInfoJson", generateInfoJson);
  });

  schedule("30 16 * * *", () => {
    runCronJob("fetchOfficialArenaDistribution (daily)", fetchOfficialArenaDistribution);
  });

  // アリーナ開催期間中は JST 07:00〜翌00:59（UTC 22:00〜15:59）の間、30 分ごとに取得
  schedule("*/30 22-23,0-15 * * *", async () => {
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

  schedule("0 * * * *", () => {
    runCronJob("updateAllUserRadarCache", updateAllUserRadarCache);
  });

  schedule("0 6,18 * * *", () => {
    runCronJob("updateAllSongRankingCache", updateAllSongRankingCache);
  });

  console.log("[Cron] All jobs registered.");
}
