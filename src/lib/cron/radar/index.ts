import { calculateRadar, buildRadarSongMaster } from "@/lib/radar/calculator";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { BpiCalculator } from "@/lib/bpi";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { songsRepo } from "@/lib/db/domains/songs";
import { usersRepo } from "@/lib/db/domains/users";
import {
  radarCacheRepo,
  type NewUserRadarCache,
} from "@/lib/db/domains/radar";
import type { IBpiBasicSongData, IBpiScoreObservation } from "@/types/songs/bpi";

/**
 * 全ユーザーのレーダーキャッシュ（`userRadarCache` テーブル）を最新スコアで更新する。
 *
 * 各ユーザーの最新スコアから `calculateRadar` でカテゴリ別 BPI を算出し、
 * 総合 BPI とともに算出結果をメモリ上に集約したうえで、最後にbulk UPSERTで
 * まとめて書き込むことでDBラウンドトリップ数を削減する。
 * スコアが存在しないユーザーはスキップされる。
 * 読み取りは`getLatestScoresWithMusicDataForAllUsers`で全ユーザー分を1回の
 * クエリでまとめて取得し（ユーザーごとに個別クエリを発行するN+1を避ける）、
 * userIdごとにグルーピングしてから計算する。
 */
export async function updateAllUserRadarCache() {
  const version = latestVersion;
  const [users, fullMaster, allScores] = await Promise.all([
    usersRepo.getAllUserIds(),
    songsRepo.getSongMasterWithDef(),
    statsTablesRepo.getLatestScoresWithMusicDataForAllUsers(version),
  ]);
  const radarSongMaster = buildRadarSongMaster(fullMaster);
  const total = users.length;
  let done = 0;
  const pendingRows: NewUserRadarCache[] = [];

  const scoresByUser = new Map<string, typeof allScores>();
  for (const row of allScores) {
    const list = scoresByUser.get(row.userId);
    if (list) {
      list.push(row);
    } else {
      scoresByUser.set(row.userId, [row]);
    }
  }

  for (const user of users) {
    try {
      const scores = scoresByUser.get(user.userId) ?? [];

      if (scores.length > 0) {
        const radar = calculateRadar(scores, radarSongMaster);

        const master: (IBpiBasicSongData & { songId: number })[] = scores.map(
          (s) => ({
            songId: s.songId,
            notes: Number(s.notes),
            kaidenAvg: s.kaidenAvg,
            wrScore: s.wrScore,
            coef: s.coef,
            mu: s.mu,
            sigma: s.sigma,
            residualVar: s.residualVar,
          }),
        );
        const observations: IBpiScoreObservation[] = scores
          .filter((s) => s.exScore != null)
          .map((s) => ({
            songId: s.songId,
            notes: Number(s.notes),
            exScore: Number(s.exScore),
          }));
        const totalBpi = BpiCalculator.calculateTotalBPI(observations, master);

        const values = {
          notes: radar.NOTES.totalBpi,
          chord: radar.CHORD.totalBpi,
          peak: radar.PEAK.totalBpi,
          charge: radar.CHARGE.totalBpi,
          scratch: radar.SCRATCH.totalBpi,
          soflan: radar.SOFLAN.totalBpi,
          totalBpi,
        };
        // BPI計算ライブラリ側で不正なチャートデータ（mu/sigma欠損等）に当たると
        // NaNを返すことがある。`NaN.toFixed(2)`は例外を投げず文字列"NaN"になり、
        // decimal列への一括INSERTがバッチ全体失敗するため、書き込み前に弾く
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
      }
    } catch (e) {
      process.stdout.write("\r\x1b[K");
      console.error(`[Radar] Failed for user ${user.userId}:`, e);
    } finally {
      done++;
      process.stdout.write(`\r\x1b[K[Radar] Calculating... ${done}/${total}`);
    }
  }

  process.stdout.write("\r\x1b[K");
  console.log(`[Radar] Writing cache for ${pendingRows.length} users...`);
  await radarCacheRepo.bulkUpsert(pendingRows);

  console.log(
    `[Radar] Cache update done: ${pendingRows.length}/${total} users updated`,
  );
}
