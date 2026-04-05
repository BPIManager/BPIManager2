import { db } from "@/lib/db";
import { sql } from "kysely";

/**
 * ソーシャル比較機能（勝敗統計・レーダー・楽曲別スコア）を担当するリポジトリクラス。
 */
class SocialComparisonRepository {
  /**
   * 閲覧者とライバルの難易度レベル別勝敗統計を取得する。
   *
   * レベル 11・12 の最新スコアを比較し、勝ち・負け・引き分けの件数を集計する。
   *
   * @param viewerId - 閲覧者のユーザー ID
   * @param rivalId - 比較対象ライバルのユーザー ID
   * @param version - バージョン番号
   * @returns `{ level, win, lose, draw }[]`
   */
  async getWinLossStats(viewerId: string, rivalId: string, version: string) {
    const getLatestLogIds = (uid: string) =>
      db
        .selectFrom("scores as s")
        .innerJoin("songs as m", "s.songId", "m.songId")
        .select(["s.songId", (eb) => eb.fn.max("s.logId").as("maxId")])
        .where("s.userId", "=", uid)
        .where("s.version", "=", version)
        .where("m.difficultyLevel", "in", [11, 12])
        .groupBy("s.songId");

    const [vIds, rIds] = await Promise.all([
      getLatestLogIds(viewerId).execute(),
      getLatestLogIds(rivalId).execute(),
    ]);

    if (vIds.length === 0 || rIds.length === 0) return [];

    const vLogIds = vIds.map((v) => v.maxId as number);
    const rLogIds = rIds.map((r) => r.maxId as number);

    const stats = await db
      .selectFrom("scores as s1")
      .innerJoin("scores as s2", "s1.songId", "s2.songId")
      .innerJoin("songs as m", "s1.songId", "m.songId")
      .select([
        "m.difficultyLevel",
        sql<number>`SUM(CASE WHEN s1.exScore > s2.exScore THEN 1 ELSE 0 END)`.as(
          "win",
        ),
        sql<number>`SUM(CASE WHEN s1.exScore < s2.exScore THEN 1 ELSE 0 END)`.as(
          "lose",
        ),
        sql<number>`SUM(CASE WHEN s1.exScore = s2.exScore THEN 1 ELSE 0 END)`.as(
          "draw",
        ),
      ])
      .where("s1.logId", "in", vLogIds)
      .where("s2.logId", "in", rLogIds)
      .groupBy("m.difficultyLevel")
      .execute();

    return stats.map((s) => ({
      level: Number(s.difficultyLevel),
      win: Number(s.win),
      lose: Number(s.lose),
      draw: Number(s.draw),
    }));
  }

  /**
   * 指定ユーザーのレーダーキャッシュを取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @returns `userRadarCache` のレコード、存在しない場合は `undefined`
   */
  async getUserRadar(userId: string, version: string) {
    return await db
      .selectFrom("userRadarCache")
      .selectAll()
      .where("userId", "=", userId)
      .where("version", "=", version)
      .executeTakeFirst();
  }

  /**
   * 特定楽曲におけるフォロー中ユーザーの最新スコアリストを取得
   */
  async getRivalScoresForSong(params: {
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
        "u.userId",
        "u.userName",
        "u.profileImage",
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
      .where("u.isPublic", "=", 1)
      .where("s.logId", "in", (eb) =>
        eb
          .selectFrom("scores as s2")
          .select((subEb) => subEb.fn.max("logId").as("logId"))
          .where("s2.songId", "=", songId)
          .where("s2.version", "=", version)
          .groupBy("s2.userId"),
      )
      .orderBy("s.exScore", "desc")
      .execute();
  }

  /**
   * フォロー中の全ユーザーに対する勝敗サマリーを一括取得する。
   *
   * 各フォローユーザーとの勝ち・負け・引き分け件数、レーダーデータ（自分・相手）、
   * アリーナランク・総合 BPI を含む。
   *
   * @param params.viewerId - 閲覧者のユーザー ID
   * @param params.version - バージョン番号
   * @param params.levels - 対象難易度レベルの配列（空の場合は全レベル）
   * @param params.difficulties - 対象難易度文字列の配列（空の場合は全難易度）
   */
  async getFollowedWinLossSummary(params: {
    viewerId: string;
    version: string;
    levels: number[];
    difficulties: string[];
  }) {
    const { viewerId, version, levels, difficulties } = params;
    const targetSongs = db
      .selectFrom("songs as m")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .select(["m.songId"])
      .$if(levels.length > 0, (qb) =>
        qb.where("m.difficultyLevel", "in", levels),
      )
      .$if(difficulties.length > 0, (qb) =>
        qb.where("m.difficulty", "in", difficulties),
      );

    const myLatest = db
      .selectFrom("scores as s")
      .select(["s.songId", "s.exScore"])
      .where("s.userId", "=", viewerId)
      .where("s.version", "=", version)
      .where("s.logId", "in", (eb) =>
        eb
          .selectFrom("scores as s2")
          .select((sub) => sub.fn.max("s2.logId").as("max"))
          .where("s2.userId", "=", viewerId)
          .where("s2.version", "=", version)
          .groupBy("s2.songId"),
      );

    const rivalsLatest = db
      .selectFrom("scores as s")
      .innerJoin("follows as f", "f.followingId", "s.userId")
      .select(["s.userId", "s.songId", "s.exScore"])
      .where("f.followerId", "=", viewerId)
      .where("s.version", "=", version)
      .where("s.logId", "in", (eb) =>
        eb
          .selectFrom("scores as s3")
          .innerJoin("follows as f3", "f3.followingId", "s3.userId")
          .select((sub) => sub.fn.max("s3.logId").as("max"))
          .where("f3.followerId", "=", viewerId)
          .where("s3.version", "=", version)
          .groupBy(["s3.userId", "s3.songId"]),
      );

    const latestStatusIds = db
      .selectFrom("userStatusLogs")
      .select(["userId", (eb) => eb.fn.max("id").as("maxId")])
      .where("version", "=", version)
      .groupBy("userId");

    const results = await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "f.followingId", "u.userId")
      .leftJoin(latestStatusIds.as("ls"), "u.userId", "ls.userId")
      .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .leftJoin("userRadarCache as urc", (join) =>
        join
          .onRef("u.userId", "=", "urc.userId")
          .on("urc.version", "=", version),
      )
      .leftJoin("userRadarCache as vrc", (join) =>
        join.on("vrc.userId", "=", viewerId).on("vrc.version", "=", version),
      )
      .leftJoin("userRoles as ur", "u.userId", "ur.userId")
      .innerJoin(targetSongs.as("m"), (join) => join.on(sql`1`, "=", sql`1`))
      .leftJoin(myLatest.as("v"), "m.songId", "v.songId")
      .leftJoin(rivalsLatest.as("r"), (join) =>
        join
          .onRef("m.songId", "=", "r.songId")
          .onRef("f.followingId", "=", "r.userId"),
      )
      .select([
        "u.userId",
        "u.userName",
        "u.profileImage",
        "u.iidxId",
        "usl.arenaRank",
        "usl.totalBpi",
        "urc.notes as r_notes",
        "urc.chord as r_chord",
        "urc.peak as r_peak",
        "urc.charge as r_charge",
        "urc.scratch as r_scratch",
        "urc.soflan as r_soflan",
        "vrc.notes as v_notes",
        "vrc.chord as v_chord",
        "vrc.peak as v_peak",
        "vrc.charge as v_charge",
        "vrc.scratch as v_scratch",
        "vrc.soflan as v_soflan",
        "ur.role as ur_role",
        "ur.description as ur_description",
        "ur.grantedAt as ur_grantedAt",
        (eb) =>
          eb.fn
            .sum(
              eb
                .case()
                .when(
                  eb.and([
                    eb("v.exScore", "is not", null),
                    eb("r.exScore", "is not", null),
                    eb("v.exScore", ">", eb.ref("r.exScore")),
                  ]),
                )
                .then(1)
                .else(0)
                .end(),
            )
            .as("win"),
        (eb) =>
          eb.fn
            .sum(
              eb
                .case()
                .when(
                  eb.and([
                    eb("v.exScore", "is not", null),
                    eb("r.exScore", "is not", null),
                    eb("v.exScore", "<", eb.ref("r.exScore")),
                  ]),
                )
                .then(1)
                .else(0)
                .end(),
            )
            .as("lose"),
        (eb) =>
          eb.fn
            .sum(
              eb
                .case()
                .when(
                  eb.and([
                    eb("v.exScore", "is not", null),
                    eb("r.exScore", "is not", null),
                    eb("v.exScore", "=", eb.ref("r.exScore")),
                  ]),
                )
                .then(1)
                .else(0)
                .end(),
            )
            .as("draw"),
        (eb) =>
          eb.fn
            .sum(
              eb
                .case()
                .when(
                  eb.and([
                    eb("v.exScore", "is not", null),
                    eb("r.exScore", "is not", null),
                  ]),
                )
                .then(1)
                .else(0)
                .end(),
            )
            .as("totalCount"),
      ])
      .where("f.followerId", "=", viewerId)
      .where("u.isPublic", "=", 1)
      .groupBy([
        "u.userId",
        "u.userName",
        "u.profileImage",
        "u.iidxId",
        "usl.arenaRank",
        "usl.totalBpi",
        "urc.notes",
        "urc.chord",
        "urc.peak",
        "urc.charge",
        "urc.scratch",
        "urc.soflan",
        "vrc.notes",
        "vrc.chord",
        "vrc.peak",
        "vrc.charge",
        "vrc.scratch",
        "vrc.soflan",
        "ur.role",
        "ur.description",
        "ur.grantedAt",
      ])
      .orderBy("win", "desc")
      .execute();

    return results.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      profileImage: r.profileImage,
      iidxId: r.iidxId,
      arenaRank: r.arenaRank,
      totalBpi: r.totalBpi ? Number(r.totalBpi) : null,
      radar: {
        notes: Number(r.r_notes),
        chord: Number(r.r_chord),
        peak: Number(r.r_peak),
        charge: Number(r.r_charge),
        scratch: Number(r.r_scratch),
        soflan: Number(r.r_soflan),
      },
      viewerRadar: {
        notes: Number(r.v_notes),
        chord: Number(r.v_chord),
        peak: Number(r.v_peak),
        charge: Number(r.v_charge),
        scratch: Number(r.v_scratch),
        soflan: Number(r.v_soflan),
      },
      stats: {
        win: Number(r.win),
        lose: Number(r.lose),
        draw: Number(r.draw),
        totalCount: Number(r.totalCount),
      },
      role: r.ur_role
        ? {
            role: r.ur_role,
            description: r.ur_description ?? "",
            grantedAt: r.ur_grantedAt as string | Date,
          }
        : null,
    }));
  }
}

export const socialComparisonRepo = new SocialComparisonRepository();
