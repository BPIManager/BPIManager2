import { db } from "@/lib/db";
import { IIDXVersion } from "@/types/iidx/version";
import { correlatedLatestLogId } from "@/lib/db/shared/latestScore/correlated";
import { getSongRankingFromTable } from "@/lib/db/aggregates/songRanking";

import { songMasterRepo } from "@/lib/db/domains/songs/master";

/**
 * getLatestScoresWithMusicData の結果を保持する短時間キャッシュの有効期間（ms）。
 * 同一ページロード内の複数ウィジェットの重複 DB アクセスを減らすためで、長期キャッシュではない。
 */

/**
 * 統計テーブル向けの楽曲別テーブル（AAA一覧・履歴・ランキング・曲フィルタ）を担当するリポジトリクラス。
 */
class StatsSongTablesRepository {
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
        "d.mu",
        "d.sigma",
        "d.residualVar",
        "s.exScore as userExScore",
        "s.bpi as userBpi",
      ])
      .where("m.difficultyLevel", "=", level)
      .$if(!isInf, (qb) => qb.where("m.releasedVersion", "<=", versionNum!))
      .orderBy("m.title", "asc")
      .execute();
  }

  // scores・songs・songDefを横断JOINした一覧取得のため、直接クエリを維持する。

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
        "s.batchId",
        "m.title",
        "m.notes",
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

    return await query
      .orderBy("s.lastPlayed", "asc")
      .orderBy("s.logId", "asc")
      .execute();
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
    return songMasterRepo.getCount(levels, difficulties);
  }

  async getFilteredSongKeys(
    version: IIDXVersion,
    levels?: number[],
    difficulties?: string[],
  ): Promise<Set<string>> {
    const rows = await songMasterRepo.getFilteredTitleDifficultyPairs(
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

export const statsSongTablesRepo = new StatsSongTablesRepository();
