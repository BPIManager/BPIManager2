import { db } from "@/lib/db";
import { Database, NewScore } from "@/types/db";
import { Transaction } from "kysely";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
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
