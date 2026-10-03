import { db } from "@/lib/db";

import { latestLogIdPerSongSubquery, latestLogIdPerUserSongSubquery } from "@/lib/db/shared/latestScore";

import { logTotalBpiRepo } from "@/lib/db/domains/logs/totalBpi";


/**
 * {@link StatsTablesRepository.getLatestScoresWithMusicData}の結果をキャッシュする
 * 有効期間(ms)。ダッシュボードの複数ウィジェットが同一ページロード内で
 * 同じuserId/versionのデータをほぼ同時に要求するケースでDBラウンドトリップを
 * 削減するための短時間キャッシュであり、データ鮮度を犠牲にする長期キャッシュではない。
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
   * {@link getLatestScoresWithMusicData}の複数ユーザー版。
   * radarキャッシュ更新クロン(`src/lib/cron/radar/index.ts`)のように、複数ユーザー分の
   * 最新スコア＋楽曲データが必要な場合に、ユーザーごとに個別クエリを発行せず
   * 1回のクエリでまとめて取得する（`songRankingCache.calculateForVersion`と同じ考え方）。
   * 呼び出し側で`userId`ごとにグルーピングして利用する。
   *
   * `userIds`未指定（全ユーザー対象）で呼ぶと、ユーザー数・スコア数に比例して
   * 結果セット全体をメモリ上に保持することになりPM2の`max_memory_restart`を
   * 超過しうる。ユーザー数が多い呼び出し元は`userIds`でページ単位に絞り込んで
   * 呼び出すこと（`updateAllUserRadarCache`参照）。
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
