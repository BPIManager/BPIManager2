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
      .innerJoin("songs as sm", "s.songId", "sm.songId")
      .select(["s.songId", "s.exScore"])
      .where("s.userId", "=", viewerId)
      .where("s.version", "=", version)
      .where("s.logId", "in", (eb) =>
        eb
          .selectFrom("scores as s2")
          .select((sub) => sub.fn.max("logId").as("max"))
          .where("userId", "=", viewerId)
          .where("version", "=", version)
          .groupBy("songId"),
      );

    const rivalsLatest = db
      .selectFrom("scores as s")
      .innerJoin("songs as rm", "s.songId", "rm.songId")
      .innerJoin("follows as f", "f.followingId", "s.userId")
      .select(["s.userId", "s.songId", "s.exScore"])
      .where("f.followerId", "=", viewerId)
      .where("s.version", "=", version)
      .where("s.logId", "in", (eb) =>
        eb
          .selectFrom("scores as s3")
          .select((sub) => sub.fn.max("logId").as("max"))
          .where("version", "=", version)
          .groupBy(["userId", "songId"]),
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
        sql<number>`SUM(CASE WHEN v.exScore IS NULL AND r.exScore IS NULL THEN 0 WHEN COALESCE(v.exScore, 0) > COALESCE(r.exScore, 0) THEN 1 ELSE 0 END)`.as(
          "win",
        ),
        sql<number>`SUM(CASE WHEN v.exScore IS NULL AND r.exScore IS NULL THEN 0 WHEN COALESCE(v.exScore, 0) < COALESCE(r.exScore, 0) THEN 1 ELSE 0 END)`.as(
          "lose",
        ),
        sql<number>`SUM(CASE WHEN v.exScore IS NULL AND r.exScore IS NULL THEN 0 WHEN COALESCE(v.exScore, 0) = COALESCE(r.exScore, 0) AND (v.exScore IS NOT NULL OR r.exScore IS NOT NULL) THEN 1 ELSE 0 END)`.as(
          "draw",
        ),
        sql<number>`SUM(CASE WHEN v.exScore IS NOT NULL OR r.exScore IS NOT NULL THEN 1 ELSE 0 END)`.as(
          "totalCount",
        ),
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
    }));
  }
}

export const socialRepo = new SocialRepository();
