import { db } from "@/lib/db";
import dayjs from "dayjs";
import { sql } from "kysely";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export class SocialRepository {
  /**
   * フォローしているユーザーのスコア更新履歴を取得
   */
  async getFollowedTimeline(params: {
    viewerId: string;
    version: string;
    limit: number;
    lastId?: string;
    mode?: "all" | "played" | "overtaken";
    search?: string;
    levels?: number[];
    difficulties?: string[];
  }) {
    const {
      viewerId,
      version,
      limit,
      lastId,
      mode,
      search,
      levels,
      difficulties,
    } = params;

    let query = db
      .selectFrom("scores as s")
      .innerJoin("users as u", "s.userId", "u.userId")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .innerJoin("follows as f", (join) =>
        join
          .onRef("f.followingId", "=", "s.userId")
          .on("f.followerId", "=", viewerId),
      )
      .select([
        "s.logId",
        "s.userId",
        "s.songId",
        "s.exScore",
        "s.bpi",
        "s.clearState",
        "s.lastPlayed",
        "u.userName",
        "u.profileImage",
        "m.title",
        "m.difficulty",
        "m.difficultyLevel",
        "m.notes",
        "d.wrScore",
        "d.kaidenAvg",
        sql<number>`(SELECT COALESCE(MAX(s2.exScore), -1) FROM scores AS s2 WHERE s2.userId = s.userId AND s2.songId = s.songId AND s2.logId < s.logId)`.as(
          "prevExScore",
        ),
        sql<
          number | null
        >`(SELECT s3.bpi FROM scores AS s3 WHERE s3.userId = s.userId AND s3.songId = s.songId AND s3.logId < s.logId ORDER BY s3.logId DESC LIMIT 1)`.as(
          "prevBpi",
        ),
        sql<
          number | null
        >`(SELECT MAX(s4.exScore) FROM scores AS s4 WHERE s4.userId = ${viewerId} AND s4.songId = s.songId AND s4.version = ${version})`.as(
          "myBestExScore",
        ),
      ])
      .where("s.version", "=", version)
      .where("u.isPublic", "=", 1);

    if (search) {
      const searchWord = `%${search}%`;
      query = query.where((eb) =>
        eb.or([
          eb("u.userName", "like", searchWord),
          eb("m.title", "like", searchWord),
        ]),
      );
    }

    if (levels && levels.length > 0) {
      query = query.where("m.difficultyLevel", "in", levels);
    }

    if (difficulties && difficulties.length > 0) {
      query = query.where("m.difficulty", "in", difficulties);
    }

    if (mode === "played") {
      query = query.where(({ exists, selectFrom }) =>
        exists(
          selectFrom("scores as v")
            .select("v.logId")
            .whereRef("v.songId", "=", "s.songId")
            .where("v.userId", "=", viewerId)
            .where("v.version", "=", version),
        ),
      );
    } else if (mode === "overtaken") {
      query = query.where(sql<boolean>`
        EXISTS (
          SELECT 1 FROM scores AS v 
          WHERE v.songId = s.songId AND v.userId = ${viewerId} AND v.version = ${version}
          HAVING MAX(v.exScore) < s.exScore
             AND MAX(v.exScore) > (
               SELECT COALESCE(MAX(prev.exScore), -1) 
               FROM scores AS prev 
               WHERE prev.userId = s.userId AND prev.songId = s.songId AND prev.logId < s.logId
             )
        )
      `);
    }

    if (lastId) {
      query = query.where("s.lastPlayed", "<", dayjs.utc(lastId).toDate());
    }

    return await query.orderBy("s.lastPlayed", "desc").limit(limit).execute();
  }

  /**
   * タイムライン上の楽曲群に対して、joinするために閲覧者自身の最新スコアを取得
   */
  async getViewerScoresForSongs(
    viewerId: string,
    version: string,
    songIds: number[],
  ) {
    if (songIds.length === 0) return [];

    const latestLogIds = await db
      .selectFrom("scores")
      .select(["songId", (eb) => eb.fn.max("logId").as("maxId")])
      .where("userId", "=", viewerId)
      .where("version", "=", version)
      .where("songId", "in", songIds)
      .groupBy("songId")
      .execute();

    const ids = latestLogIds.map((l) => l.maxId as number);
    if (ids.length === 0) return [];

    return await db
      .selectFrom("scores")
      .select(["songId", "exScore", "bpi", "clearState"])
      .where("logId", "in", ids)
      .execute();
  }

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

  async getUserRadar(userId: string, version: string) {
    return await db
      .selectFrom("userRadarCache")
      .selectAll()
      .where("userId", "=", userId)
      .where("version", "=", version)
      .executeTakeFirst();
  }
}
