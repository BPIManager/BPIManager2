import { db } from "@/lib/db";

import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { latestLogIdPerSongSubquery, latestLogIdPerUserSongSubquery } from "@/lib/db/shared/latestScore";
/**
 * `scores` テーブルから曲ごとの最新スコアを取得するリポジトリクラス。
 */
class LatestScoresRepository {
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
   * 複数ユーザー×複数楽曲の最新スコアをまとめて取得する
   * (BPI V2検証ツール(NewBpiComparison)の「全プレイヤー」一覧のページ単位バッチ取得用)。
   *
   * @param userIds - 対象ユーザー ID の配列
   * @param version - バージョン番号
   * @param songIds - 対象楽曲 ID の配列
   */
  async getLatestScoresForUsers(
    userIds: string[],
    version: string,
    songIds: number[],
  ) {
    if (userIds.length === 0 || songIds.length === 0) return [];
    return await db
      .selectFrom("scores")
      .innerJoin(
        latestLogIdPerUserSongSubquery({
          table: "scores",
          version,
          userIds,
          songIds,
        }).as("latest"),
        (join) =>
          join
            .onRef("latest.userId", "=", "scores.userId")
            .onRef("latest.songId", "=", "scores.songId")
            .onRef("latest.maxLogId", "=", "scores.logId"),
      )
      .select(["scores.userId", "scores.songId", "scores.exScore", "scores.bpi"])
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
   * 指定楽曲群について、指定バージョン内での最新スコア（EXスコア・BPI）を取得する。
   * `getLatestExScoresForSongsBeforeDate`の日時境界版と異なり、バージョンそのものを
   * 境界として使う（例: 前バージョンとの比較用）。
   */
  async getLatestScoresForVersion(
    userId: string,
    version: string,
    songIds: number[],
  ) {
    if (songIds.length === 0) return [];
    return await db
      .selectFrom("scores as s")
      .innerJoin(
        latestLogIdPerSongSubquery({
          table: "scores",
          userId,
          version,
          extra: (qb) => qb.where("songId", "in", songIds),
        }).as("latest"),
        (join) =>
          join
            .onRef("latest.songId", "=", "s.songId")
            .onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select(["s.songId", "s.bpi", "s.exScore"])
      .execute();
  }
}

export const latestScoresRepo = new LatestScoresRepository();
