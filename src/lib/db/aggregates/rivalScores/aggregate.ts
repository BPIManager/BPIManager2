import { db } from "@/lib/db";

import { latestLogIdPerUserSongSubquery, latestLogIdPerUserSongScalarSubquery } from "@/lib/db/shared/latestScore/perUser";
import { userDisplayColumns } from "@/lib/db/shared/userDisplay";
import { wherePublicOnly } from "@/lib/db/shared/visibility";

/**
 * フォロー中ライバルのスコア集計（平均・最新・トップ）を担当するリポジトリクラス。
 */
class RivalAggregateRepository {
  /**
   * フォロー中ライバルの楽曲ごと平均スコアを取得する。
   * songIds を指定した場合は当該楽曲のみに絞り込む。
   */
  async getRivalAvgScores(params: {
    userId: string;
    version: string;
    songIds?: number[];
  }) {
    const { userId, version, songIds } = params;

    const latestPerRival = latestLogIdPerUserSongSubquery({
      table: "scores",
      version,
      followersOf: userId,
      songIds,
    }).as("latest");

    const rows = await db
      .selectFrom("scores as s")
      .innerJoin(latestPerRival, (join) =>
        join
          .onRef("s.logId", "=", "latest.maxLogId")
          .onRef("s.userId", "=", "latest.userId")
          .onRef("s.songId", "=", "latest.songId"),
      )
      .innerJoin("songs as sg", "sg.songId", "s.songId")
      .select([
        "sg.songId",
        "sg.difficulty",
        "sg.difficultyLevel",
        "sg.title",
        (eb) => eb.fn.avg("s.exScore").as("avgExScore"),
        (eb) => eb.fn.avg("s.bpi").as("avgBpi"),
        (eb) => eb.fn.count("s.logId").as("rivalCount"),
      ])
      .groupBy(["sg.songId", "sg.difficulty"])
      .execute();

    return rows;
  }

  /**
   * 指定楽曲のフォロー中ライバル最新スコアを全件取得する（`songId`/`exScore`のみ）。
   * ライバルランク計算用の集計クエリ。
   */
  async getRivalLatestScoresBySong(params: {
    userId: string;
    version: string;
    songIds: number[];
  }) {
    const { userId, version, songIds } = params;
    if (songIds.length === 0) return [];

    const latestPerRival = latestLogIdPerUserSongSubquery({
      table: "scores",
      version,
      followersOf: userId,
      songIds,
    }).as("latest");

    return await db
      .selectFrom("scores as s")
      .innerJoin(latestPerRival, (join) =>
        join
          .onRef("s.logId", "=", "latest.maxLogId")
          .onRef("s.userId", "=", "latest.userId")
          .onRef("s.songId", "=", "latest.songId"),
      )
      .select(["s.songId", "s.exScore"])
      .execute();
  }

  /**
   * 特定楽曲におけるフォロー中ユーザーの最新スコア一覧を取得する
   * （ユーザー表示情報・楽曲情報付き）。単曲のライバル比較表示用。
   */
  // 単曲比較は複数テーブルを横断JOINするため直接クエリを維持する。viewerId に第三者閲覧の対象が入りうるため、
   // follows の存在を閲覧許可とみなさず isPublic による絞り込みを残す。

  async getFollowedScoresForSong(params: {
    viewerId: string;
    songId: number;
    version: string;
  }) {
    const { viewerId, songId, version } = params;

    return await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "f.followingId", "u.userId")
      .innerJoin("scores as s", "u.userId", "s.userId")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .select([
        ...userDisplayColumns("u"),
        "s.exScore",
        "s.bpi",
        "s.clearState",
        "s.lastPlayed",
        "s.logId",
        "m.title",
        "m.difficulty",
        "m.notes",
        "d.wrScore",
        "d.kaidenAvg",
      ])
      .where("f.followerId", "=", viewerId)
      .where("s.songId", "=", songId)
      .where("s.version", "=", version)
      .$call((qb) => wherePublicOnly(qb, "u.isPublic"))
      .where(
        "s.logId",
        "in",
        latestLogIdPerUserSongScalarSubquery({
          table: "scores",
          version,
          songIds: [songId],
        }),
      )
      .orderBy("s.exScore", "desc")
      .execute();
  }

  /**
   * フォロー中ライバルの楽曲ごとトップスコアを取得する。
   * songIds を指定した場合は当該楽曲のみに絞り込む。
   */
  async getRivalTopScores(params: {
    userId: string;
    version: string;
    songIds?: number[];
  }) {
    const { userId, version, songIds } = params;

    const latestPerRival = latestLogIdPerUserSongSubquery({
      table: "scores",
      version,
      followersOf: userId,
      songIds,
    }).as("latest");

    const rows = await db
      .selectFrom("scores as s")
      .innerJoin(latestPerRival, (join) =>
        join
          .onRef("s.logId", "=", "latest.maxLogId")
          .onRef("s.userId", "=", "latest.userId")
          .onRef("s.songId", "=", "latest.songId"),
      )
      .innerJoin("songs as sg", "sg.songId", "s.songId")
      .select([
        "sg.songId",
        "sg.difficulty",
        "sg.difficultyLevel",
        "sg.title",
        (eb) => eb.fn.max("s.exScore").as("topExScore"),
        (eb) => eb.fn.max("s.bpi").as("topBpi"),
        (eb) => eb.fn.count("s.logId").as("rivalCount"),
      ])
      .groupBy(["sg.songId", "sg.difficulty"])
      .execute();

    return rows;
  }
}

export const rivalAggregateRepo = new RivalAggregateRepository();
