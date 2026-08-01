import { db } from "@/lib/db";
import { IIDXVersion } from "@/types/iidx/version";
import { correlatedLatestLogId, latestLogIdPerSongSubquery } from "@/lib/db/shared/latestScore";
import { getSongRankingFromTable } from "@/lib/db/aggregates/songRanking";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { songsRepo } from "@/lib/db/domains/songs";

/**
 * {@link StatsTablesRepository.getLatestScoresWithMusicData}の結果をキャッシュする
 * 有効期間(ms)。ダッシュボードの複数ウィジェットが同一ページロード内で
 * 同じuserId/versionのデータをほぼ同時に要求するケースでDBラウンドトリップを
 * 削減するための短時間キャッシュであり、データ鮮度を犠牲にする長期キャッシュではない。
 */
const LATEST_SCORES_CACHE_TTL_MS = 5000;

/**
 * 統計ダッシュボード向けの表形式データ（AAA表・スコア履歴・楽曲ランキング等）を
 * 担当するリポジトリクラス。
 */
class StatsTablesRepository {
  private latestScoresWithMusicDataCache = new Map<
    string,
    {
      data: Awaited<
        ReturnType<StatsTablesRepository["fetchLatestScoresWithMusicData"]>
      >;
      expiresAt: number;
    }
  >();

  async getLatestTotalBpi(userId: string, version: string): Promise<number> {
    const result = await navigationRepo.getLatestTotalBpi(userId, version);
    return result ? Number(result.totalBpi) : -15;
  }

  // songs・scores・songDefを横断JOINしたAAA表データ集計のため、直接クエリを維持する。
  async getAAATableData(userId: string, version: IIDXVersion, level: number) {
    const isInf = version === "INF";
    const versionNum = isInf ? null : parseInt(version);

    return await db
      .selectFrom("songs as m")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .leftJoin("scores as s", (join) =>
        join
          .onRef("s.songId", "=", "m.songId")
          .on("s.userId", "=", userId)
          .on("s.version", "=", version)
          .on("s.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "s2",
              songIdRef: "m.songId",
              version,
              userId,
            }),
          ),
      )
      .select([
        "m.songId",
        "m.title",
        "m.notes",
        "m.difficulty",
        "m.difficultyLevel",
        "m.releasedVersion",
        "d.wrScore",
        "d.kaidenAvg",
        "d.coef",
        "s.exScore as userExScore",
        "s.bpi as userBpi",
      ])
      .where("m.difficultyLevel", "=", level)
      .$if(!isInf, (qb) => qb.where("m.releasedVersion", "<=", versionNum!))
      .orderBy("m.title", "asc")
      .execute();
  }

  // scores・songs・songDefを横断JOINした一覧取得のため、直接クエリを維持する。
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

  // scores・songsを横断JOINしたスコア推移集計のため、直接クエリを維持する。
  async getScoreHistory(
    userId: string,
    version: string,
    levels: number[],
    difficulties: string[],
  ) {
    let query = db
      .selectFrom("scores as s")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .select([
        "s.logId",
        "s.songId",
        "s.bpi",
        "s.exScore",
        "s.lastPlayed",
        "m.title",
        "m.difficulty",
        "m.difficultyLevel",
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("s.songId", "is not", null);

    if (levels.length > 0) {
      query = query.where("m.difficultyLevel", "in", levels);
    }
    if (difficulties.length > 0) {
      query = query.where("m.difficulty", "in", difficulties);
    }

    return await query.orderBy("s.lastPlayed", "asc").execute();
  }

  async getSongRanking(songId: number, version: string, viewerId: string) {
    return getSongRankingFromTable({
      table: "scores",
      songId,
      version,
      viewerId,
    });
  }

  async getTotalSongCount(
    levels: number[],
    difficulties: string[],
  ): Promise<number> {
    return songsRepo.getCount(levels, difficulties);
  }

  async getFilteredSongKeys(
    version: IIDXVersion,
    levels?: number[],
    difficulties?: string[],
  ): Promise<Set<string>> {
    const rows = await songsRepo.getFilteredTitleDifficultyPairs(
      version,
      levels,
      difficulties,
    );
    return new Set(rows.map((r) => `${r.title}___${r.difficulty}`));
  }

  // 曲ごとの全ユーザー順位・総プレイヤー数は songRankingCache（cronで事前算出）から取得し、
  // ユーザー自身の最新スコアのみその場でJOINする。allSongsとの横断JOINのため直接クエリを維持する。
  async getUserSongRankings(userId: string, version: string) {
    const rows = await db
      .selectFrom("allScores as s")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("allScores")
            .select(["songId", (eb) => eb.fn.max("logId").as("maxLogId")])
            .where("userId", "=", userId)
            .where("version", "=", version)
            .groupBy("songId")
            .as("m"),
        (join) => join.onRef("m.maxLogId", "=", "s.logId"),
      )
      .innerJoin("songRankingCache as src", (join) =>
        join
          .onRef("src.songId", "=", "s.songId")
          .on("src.userId", "=", userId)
          .on("src.version", "=", version),
      )
      .innerJoin("allSongs as sg", "sg.songId", "s.songId")
      .where("s.userId", "=", userId)
      .select([
        "s.songId",
        "sg.title",
        "sg.notes",
        "sg.bpm",
        "sg.difficulty",
        "sg.difficultyLevel",
        "sg.releasedVersion",
        "s.logId",
        "s.exScore",
        "s.bpi",
        "s.clearState",
        "s.missCount",
        "s.lastPlayed",
        "src.rank",
        "src.totalPlayers",
      ])
      .orderBy("src.rank", "asc")
      .execute();

    return rows.map((r) => ({
      ...r,
      rank: Number(r.rank),
      totalPlayers: Number(r.totalPlayers),
      bpi: r.bpi !== null && r.bpi !== undefined ? Number(r.bpi) : null,
    }));
  }
}

export const statsTablesRepo = new StatsTablesRepository();
