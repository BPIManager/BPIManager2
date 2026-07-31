import { db } from "@/lib/db";
import { Database, NewScore } from "@/types/db";
import { Transaction } from "kysely";
import { IIDX_VERSIONS, latestVersion } from "@/constants/iidx/iidxVersions";
import { latestLogIdPerSongSubquery } from "@/lib/db/shared/latestScore";
import { rivalRepo } from "./rival";
import { scoreDetailRepo } from "./detail";
import { timelineRepo } from "./timeline";
import { socialComparisonRepo } from "./comparison";
import { socialTimelineRepo } from "./feed";

export { rivalRepo } from "./rival";
export { scoreDetailRepo } from "./detail";
export { timelineRepo } from "./timeline";
export { socialComparisonRepo } from "./comparison";
export { socialTimelineRepo } from "./feed";

/**
 * `scores` テーブル（単曲スコア）の書き込み・基本参照を担当するリポジトリクラス。
 */
class ScoresRepository {
  /**
   * スコアレコードを1件以上挿入する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param values - 挿入するレコード（単数または複数）
   */
  async insert(trx: Transaction<Database>, values: NewScore | NewScore[]) {
    await trx.insertInto("scores").values(values).execute();
  }

  /**
   * 指定バッチに紐づくスコアレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   * @param batchId - バッチ ID
   */
  async deleteByBatch(
    trx: Transaction<Database>,
    userId: string,
    batchId: string,
  ) {
    await trx
      .deleteFrom("scores")
      .where("batchId", "=", batchId)
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * ユーザーの全スコアレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx.deleteFrom("scores").where("userId", "=", userId).execute();
  }

  /**
   * 指定バージョンより前で、直近にスコア登録のあるバージョンを取得する。
   *
   * @param userId - ユーザー ID
   * @param currentVersion - 基準バージョン番号
   * @returns 直近にスコアが存在するバージョン番号、存在しない場合は `null`
   */
  async getPreviousVersionWithScores(
    userId: string,
    currentVersion: string,
  ): Promise<string | null> {
    const versionsOrder: readonly string[] = IIDX_VERSIONS;
    const currentIdx = versionsOrder.indexOf(currentVersion);
    if (currentIdx <= 0) return null;

    const previousVersions = versionsOrder.slice(0, currentIdx);

    const rows = await db
      .selectFrom("scores")
      .select("version")
      .where("userId", "=", userId)
      .where("version", "in", previousVersions)
      .distinct()
      .execute();

    const availableVersions = new Set(rows.map((r) => r.version));

    for (let i = currentIdx - 1; i >= 0; i--) {
      if (availableVersions.has(versionsOrder[i])) {
        return versionsOrder[i];
      }
    }
    return null;
  }

  /**
   * 指定ユーザー・バージョンの `scores` テーブルから、曲ごとの最新スコアを取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getLatestScores(userId: string, version: string) {
    return await db
      .selectFrom("scores")
      .innerJoin(
        latestLogIdPerSongSubquery({
          table: "scores",
          userId,
          version,
        }).as("latest"),
        (join) => join.onRef("latest.maxLogId", "=", "scores.logId"),
      )
      .selectAll("scores")
      .execute();
  }

  /**
   * 指定ユーザー・バージョン・楽曲の最新スコアを1件取得する。
   * idx_scores_version_user_song_log(version,userId,songId,logId DESC) を点引きする。
   */
  async getLatestScoreForSong(userId: string, songId: number, version: string) {
    return await db
      .selectFrom("scores")
      .selectAll()
      .where("userId", "=", userId)
      .where("songId", "=", songId)
      .where("version", "=", version)
      .orderBy("logId", "desc")
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * BPIM内での指定スコアの順位と登録者総数を返す。
   * 同バージョンのユーザーごとの最新スコアを対象とする。
   */
  async getSongBpimRank(
    songId: number,
    exScore: number,
    version: string = latestVersion,
  ): Promise<{ rank: number; total: number }> {
    const latest = db
      .selectFrom("scores")
      .select(["userId", (eb) => eb.fn.max("logId").as("maxLogId")])
      .where("songId", "=", songId)
      .where("version", "=", version)
      .groupBy("userId")
      .as("latest");

    const row = await db
      .selectFrom("scores as s")
      .innerJoin(latest, (join) =>
        join.onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select((eb) => [
        eb.fn.countAll<number>().as("total"),
        eb.fn
          .sum(
            eb
              .case()
              .when(eb("s.exScore", ">", exScore))
              .then(eb.lit(1))
              .else(eb.lit(0))
              .end(),
          )
          .as("above"),
      ])
      .where("s.songId", "=", songId)
      .executeTakeFirst();

    return {
      rank: Number(row?.above ?? 0) + 1,
      total: Number(row?.total ?? 0),
    };
  }
}

const scoresCoreRepo = new ScoresRepository();

/**
 * scores ドメインの各サブリポジトリのメソッドを集約したファサードオブジェクト。
 *
 * 基本CRUD（`scoresCoreRepo`）に加え、`rivalRepo`・`scoreDetailRepo`・`timelineRepo`・
 * `socialComparisonRepo`・`socialTimelineRepo` を統合している。
 * 新規コードでは個別のリポジトリを直接使用することを推奨する。
 */
export const scoresRepo = {
  // 基本CRUD
  insert: scoresCoreRepo.insert.bind(scoresCoreRepo),
  deleteByBatch: scoresCoreRepo.deleteByBatch.bind(scoresCoreRepo),
  deleteByUser: scoresCoreRepo.deleteByUser.bind(scoresCoreRepo),
  getPreviousVersionWithScores:
    scoresCoreRepo.getPreviousVersionWithScores.bind(scoresCoreRepo),
  getLatestScores: scoresCoreRepo.getLatestScores.bind(scoresCoreRepo),
  getLatestScoreForSong:
    scoresCoreRepo.getLatestScoreForSong.bind(scoresCoreRepo),
  getSongBpimRank: scoresCoreRepo.getSongBpimRank.bind(scoresCoreRepo),

  // ライバル比較系
  getRivalComparisonScores:
    rivalRepo.getRivalComparisonScores.bind(rivalRepo),
  getScoreComparisonList: rivalRepo.getScoreComparisonList.bind(rivalRepo),
  getOvertakenRivals: rivalRepo.getOvertakenRivals.bind(rivalRepo),
  getRivalAvgScores: rivalRepo.getRivalAvgScores.bind(rivalRepo),
  getRivalTopScores: rivalRepo.getRivalTopScores.bind(rivalRepo),
  getRivalScoresForSongs: rivalRepo.getRivalScoresForSongs.bind(rivalRepo),

  // スコア詳細クエリ系
  getScoresWithDetails:
    scoreDetailRepo.getScoresWithDetails.bind(scoreDetailRepo),
  getScoresByLastPlayedRange:
    scoreDetailRepo.getScoresByLastPlayedRange.bind(scoreDetailRepo),
  getScoreHistory: scoreDetailRepo.getScoreHistory.bind(scoreDetailRepo),

  // タイムライン・バージョン比較系
  getTimelineByBatches: timelineRepo.getTimelineByBatches.bind(timelineRepo),
  getBestEverScores: timelineRepo.getBestEverScores.bind(timelineRepo),
  getSelfVersionScores: timelineRepo.getSelfVersionScores.bind(timelineRepo),

  // ソーシャル比較系（勝敗統計・レーダー・楽曲別スコア）
  getWinLossStats:
    socialComparisonRepo.getWinLossStats.bind(socialComparisonRepo),
  getWinLossHistory:
    socialComparisonRepo.getWinLossHistory.bind(socialComparisonRepo),
  getUserRadar: socialComparisonRepo.getUserRadar.bind(socialComparisonRepo),
  getRivalScoresForSong:
    socialComparisonRepo.getRivalScoresForSong.bind(socialComparisonRepo),
  getFollowedWinLossSummary:
    socialComparisonRepo.getFollowedWinLossSummary.bind(socialComparisonRepo),

  // ソーシャルフィード系（フォロー中ユーザーのスコア更新タイムライン）
  getFollowedTimeline:
    socialTimelineRepo.getFollowedTimeline.bind(socialTimelineRepo),
  getViewerScoresForSongs:
    socialTimelineRepo.getViewerScoresForSongs.bind(socialTimelineRepo),
};
