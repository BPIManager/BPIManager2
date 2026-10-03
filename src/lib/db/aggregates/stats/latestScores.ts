import { db } from "@/lib/db";

import { latestLogIdPerSongSubquery } from "@/lib/db/shared/latestScore/perSong";
import { latestLogIdPerUserSongSubquery } from "@/lib/db/shared/latestScore/perUser";

import { logTotalBpiRepo } from "@/lib/db/domains/logs/totalBpi";


/**
 * getLatestScoresWithMusicData の結果を保持する短時間キャッシュの有効期間（ms）。
 * 同一ページロード内の複数ウィジェットの重複 DB アクセスを減らすためで、長期キャッシュではない。
 */
const LATEST_SCORES_CACHE_TTL_MS = 5000;

/**
 * 統計テーブル向けの最新スコア（音楽情報付き）と総合BPIの参照を担当するリポジトリクラス。
 */
class StatsLatestScoresRepository {
  private latestScoresWithMusicDataCache = new Map<
    string,
    {
      data: Awaited<
        ReturnType<StatsLatestScoresRepository["fetchLatestScoresWithMusicData"]>
      >;
      expiresAt: number;
    }
  >();

  async getLatestTotalBpi(userId: string, version: string): Promise<number> {
    const result = await logTotalBpiRepo.getLatestTotalBpi(userId, version);
    return result ? Number(result.totalBpi) : -15;
  }

  // songs・scores・songDefを横断JOINしたAAA表データ集計のため、直接クエリを維持する。

  async getLatestScoresWithMusicData(
    userId: string,
    version: string,
    levels?: number[],
    difficulties?: string[],
  ) {
    const cacheKey = JSON.stringify([
      userId,
      version,
      levels ?? [],
      difficulties ?? [],
    ]);
    const cached = this.latestScoresWithMusicDataCache.get(cacheKey);
    if (cached) {
      if (cached.expiresAt > Date.now()) return cached.data;
      this.latestScoresWithMusicDataCache.delete(cacheKey);
    }

    const data = await this.fetchLatestScoresWithMusicData(
      userId,
      version,
      levels,
      difficulties,
    );
    this.latestScoresWithMusicDataCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + LATEST_SCORES_CACHE_TTL_MS,
    });
    return data;
  }

  private async fetchLatestScoresWithMusicData(
    userId: string,
    version: string,
    levels?: number[],
    difficulties?: string[],
  ) {
    let query = db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .innerJoin(
        latestLogIdPerSongSubquery({
          table: "scores",
          userId,
          version,
        }).as("latest"),
        (join) => join.onRef("latest.maxLogId", "=", "s.logId"),
      )
      .select([
        "s.logId",
        "s.userId",
        "s.songId",
        "s.exScore",
        "s.bpi",
        "s.clearState",
        "s.missCount",
        "s.lastPlayed",
        "m.title",
        "m.notes",
        "m.bpm",
        "m.difficulty",
        "m.difficultyLevel",
        "m.releasedVersion",
        "d.wrScore",
        "d.kaidenAvg",
        "d.coef",
        "d.mu",
        "d.sigma",
        "d.residualVar",
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version);

    if (levels && levels.length > 0) {
      query = query.where("m.difficultyLevel", "in", levels);
    }
    if (difficulties && difficulties.length > 0) {
      query = query.where("m.difficulty", "in", difficulties);
    }

    return await query.execute();
  }

  /**
   * getLatestScoresWithMusicData の複数ユーザー版。ユーザーごとのクエリを避け1回でまとめて取得する。
   * userIds 未指定の全件取得はメモリを大量消費するため、呼び出し元はページ単位で絞ること。
   *
   * @param version - バージョン番号
   * @param userIds - 指定時、このユーザーID群のみに絞り込む（省略時は全ユーザー）
   */
  async getLatestScoresWithMusicDataForAllUsers(
    version: string,
    userIds?: string[],
  ) {
    return await db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .innerJoin(
        latestLogIdPerUserSongSubquery({
          table: "scores",
          version,
          userIds,
        }).as("latest"),
        (join) =>
          join
            .onRef("latest.maxLogId", "=", "s.logId")
            .onRef("latest.userId", "=", "s.userId")
            .onRef("latest.songId", "=", "s.songId"),
      )
      .select([
        "s.userId",
        "s.songId",
        "s.exScore",
        "s.bpi",
        "s.clearState",
        "s.missCount",
        "s.lastPlayed",
        "m.title",
        "m.notes",
        "m.bpm",
        "m.difficulty",
        "m.difficultyLevel",
        "m.releasedVersion",
        "d.wrScore",
        "d.kaidenAvg",
        "d.coef",
        "d.mu",
        "d.sigma",
        "d.residualVar",
      ])
      .where("s.version", "=", version)
      .$if(!!userIds && userIds.length > 0, (qb) =>
        qb.where("s.userId", "in", userIds!),
      )
      .execute();
  }

  // scores・songsを横断JOINしたスコア推移集計のため、直接クエリを維持する。
}

export const statsLatestScoresRepo = new StatsLatestScoresRepository();
