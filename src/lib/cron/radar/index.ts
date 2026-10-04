import { calculateRadar, buildRadarSongMaster } from "@/lib/radar/calculator";
import { computeCanonicalTotalBpi } from "@/lib/bpi/canonicalTotalBpi";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { statsLatestScoresRepo } from "@/lib/db/aggregates/stats/latestScores";
import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { usersRepo } from "@/lib/db/domains/users";
import {
  radarCacheRepo,
  type NewUserRadarCache,
} from "@/lib/db/domains/radar";

/**
 * getLatestScoresWithMusicDataForAllUsers を1回で呼ぶユーザー数の上限。
 * PM2 の max_memory_restart（deploy/ecosystem.config.js）を超えないよう、メモリに保持するスコア行をページ単位に抑える。
 */
const USER_PAGE_SIZE = 200;

/**
 * 全ユーザーのレーダーキャッシュを最新スコアから算出し、bulk UPSERTでまとめて書き込む。
 * ユーザーを USER_PAGE_SIZE ごとのページに区切り、ページ単位でスコアを取得してDBラウンドトリップを抑える。
 */
export async function updateAllUserRadarCache() {
  const version = latestVersion;
  const [users, fullMaster] = await Promise.all([
    usersRepo.getAllUserIds(),
    songMasterRepo.getSongMasterWithDef(),
  ]);
  const radarSongMaster = buildRadarSongMaster(fullMaster);
  const total = users.length;
  let done = 0;
  const pendingRows: NewUserRadarCache[] = [];
  const staleUserIds: string[] = [];

  for (
    let pageStart = 0;
    pageStart < users.length;
    pageStart += USER_PAGE_SIZE
  ) {
    const userPage = users.slice(pageStart, pageStart + USER_PAGE_SIZE);
    const pageScores =
      await statsLatestScoresRepo.getLatestScoresWithMusicDataForAllUsers(
        version,
        userPage.map((u) => u.userId),
      );

    const scoresByUser = new Map<string, typeof pageScores>();
    for (const row of pageScores) {
      const list = scoresByUser.get(row.userId);
      if (list) {
        list.push(row);
      } else {
        scoresByUser.set(row.userId, [row]);
      }
    }

    for (const user of userPage) {
      try {
        const scores = scoresByUser.get(user.userId) ?? [];

        if (scores.length > 0) {
          const radar = calculateRadar(scores, radarSongMaster);

          const totalBpi = computeCanonicalTotalBpi(scores, fullMaster);

          const values = {
            notes: radar.NOTES.totalBpi,
            chord: radar.CHORD.totalBpi,
            peak: radar.PEAK.totalBpi,
            charge: radar.CHARGE.totalBpi,
            scratch: radar.SCRATCH.totalBpi,
            soflan: radar.SOFLAN.totalBpi,
            totalBpi,
          };
          // mu/sigma 欠損などの不正なチャートでは NaN になりうる。NaN.toFixed は文字列 "NaN" を返し decimal 列の一括 INSERT が全体失敗するため、書き込み前に弾く。
          const invalidKey = Object.entries(values).find(
            ([, v]) => !Number.isFinite(v),
          )?.[0];
          if (invalidKey) {
            console.error(
              `[Radar] Skipped user ${user.userId}: non-finite ${invalidKey} (${values[invalidKey as keyof typeof values]})`,
            );
            continue;
          }

          pendingRows.push({
            userId: user.userId,
            version,
            notes: values.notes.toFixed(2),
            chord: values.chord.toFixed(2),
            peak: values.peak.toFixed(2),
            charge: values.charge.toFixed(2),
            scratch: values.scratch.toFixed(2),
            soflan: values.soflan.toFixed(2),
            totalBpi: values.totalBpi.toFixed(2),
          });
        } else {
          staleUserIds.push(user.userId);
        }
      } catch (e) {
        process.stdout.write("\r\x1b[K");
        console.error(`[Radar] Failed for user ${user.userId}:`, e);
      } finally {
        done++;
        process.stdout.write(`\r\x1b[K[Radar] Calculating... ${done}/${total}`);
      }
    }
  }

  process.stdout.write("\r\x1b[K");
  console.log(`[Radar] Writing cache for ${pendingRows.length} users...`);
  await radarCacheRepo.bulkUpsert(pendingRows);
  await radarCacheRepo.deleteForUsers(staleUserIds, version);

  console.log(
    `[Radar] Cache update done: ${pendingRows.length}/${total} users updated`,
  );
}
