import { db } from "@/lib/db";
import { IIDXVersion } from "@/types/iidx/version";
import { sql } from "kysely";
import {
  correlatedLatestLogId,
  latestLogIdPerUserSongSubquery,
  latestLogIdPerUserSongScalarSubquery,
} from "@/lib/db/shared/latestScore";
import { userDisplayColumns } from "@/lib/db/shared/userDisplay";
import { wherePublicOnly } from "@/lib/db/shared/visibility";

/** 比較ページ(1:N)の比較対象1人分のスコア行(#287) */
export interface MultiRivalScoreRow {
  userId: string;
  userName: string | null;
  profileImage: string | null;
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  exScore: number;
  bpi: number | null;
  clearState: string | null;
  lastPlayed: Date;
  wrScore: number;
  kaidenAvg: number;
}

/**
 * ライバル比較・フォロー中ユーザーとのスコア比較を担当するリポジトリクラス。
 */
class RivalRepository {
  /**
   * 楽曲マスタをベースに、自分とライバルのスコアを並列で取得する
   */
  // songs・songDef・scores(自分/ライバル)・usersを横断JOINした比較テーブル
  // データのため、直接クエリを維持する。
  async getRivalComparisonScores(params: {
    viewerId: string;
    rivalId?: string | null;
    version: IIDXVersion;
    limit?: number;
    offset?: number;
  }) {
    const { viewerId, rivalId, version, limit, offset } = params;
    const isInf = version === "INF";

    let query = db
      .selectFrom("songs as s")
      .innerJoin("songDef as sd", (join) =>
        join.onRef("sd.songId", "=", "s.songId").on("sd.isCurrent", "=", 1),
      )
      .leftJoin("scores as v", (join) =>
        join
          .onRef("v.songId", "=", "s.songId")
          .on("v.userId", "=", viewerId)
          .on("v.version", "=", version)
          .on("v.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "v2",
              songIdRef: "s.songId",
              version,
              userId: viewerId,
            }),
          ),
      )
      .leftJoin("scores as r", (join) => {
        const base = join
          .onRef("r.songId", "=", "s.songId")
          .on("r.version", "=", version)
          .on("r.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "r2",
              songIdRef: "s.songId",
              version,
              ...(rivalId ? { userId: rivalId } : { followersOf: viewerId }),
            }),
          );

        if (rivalId) {
          return base.on("r.userId", "=", rivalId);
        } else {
          return base.on("r.userId", "in", (qb) =>
            qb
              .selectFrom("follows as f")
              .innerJoin("users as fu", "fu.userId", "f.followingId")
              .select("f.followingId")
              .where("f.followerId", "=", viewerId)
              // follows行の存在だけでは判定できない(#275フォロー後方修正:
              // 公開時代に成立したfollowsには承認記録がないため、対象が
              // 非公開の場合は承認記録の有無も要求する)
              .where((eb) =>
                eb.or([
                  eb("fu.isPublic", "=", 1),
                  eb.exists(
                    eb
                      .selectFrom("followApprovalNotifications as fan")
                      .select("fan.id")
                      .where("fan.recipientId", "=", viewerId)
                      .whereRef("fan.actorId", "=", "f.followingId"),
                  ),
                ]),
              ),
          );
        }
      })
      .leftJoin("users as ru", "ru.userId", "r.userId")
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficultyLevel",
        "s.difficulty",
        "s.releasedVersion",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
        "v.logId as myLogId",
        "v.exScore as myExScore",
        "v.bpi as myBpi",
        "v.clearState as myClearState",
        "v.missCount as myMissCount",
        "v.lastPlayed as myLastPlayed",
        "r.userId as rivalUserId",
        "ru.userName as rivalUserName",
        "r.exScore as rivalExScore",
        "r.bpi as rivalBpi",
        "r.clearState as rivalClearState",
        "r.missCount as rivalMissCount",
        "r.lastPlayed as rivalLastPlayed",
      ])
      .$if(!isInf, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb("s.deletedAt", "is", null),
            eb("s.deletedAt", ">", version),
          ]),
        ),
      )
      .where((eb) =>
        eb.or([
          eb("v.exScore", "is not", null),
          eb("r.exScore", "is not", null),
        ]),
      );

    if (limit !== undefined) query = query.limit(limit);
    if (offset !== undefined) query = query.offset(offset);

    return await query.execute();
  }

  /**
   * スコア差分（ライバル - 自分）を指定した範囲で抽出
   */
  async getScoreComparisonList(params: {
    userId: string;
    version: IIDXVersion;
    limit: number;
    minDiff: number;
    maxDiff: number;
    levelArray: number[];
    diffArray: string[];
    cursor?: { lastDiff: number; lastSongId: string; lastRivalId: string };
  }) {
    const {
      userId,
      version,
      limit,
      cursor,
      levelArray,
      diffArray,
      minDiff,
      maxDiff,
    } = params;
    const diffExpr = sql<number>`r.exScore - v.exScore`;

    let query = db
      .selectFrom("songs as s")
      .innerJoin("songDef as sd", (join) =>
        join.onRef("sd.songId", "=", "s.songId").on("sd.isCurrent", "=", 1),
      )
      .innerJoin("scores as v", (join) =>
        join
          .onRef("v.songId", "=", "s.songId")
          .on("v.userId", "=", userId)
          .on("v.version", "=", version)
          .on("v.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "v2",
              songIdRef: "s.songId",
              version,
              userId,
            }),
          ),
      )
      .innerJoin("scores as r", (join) =>
        join
          .onRef("r.songId", "=", "s.songId")
          .on("r.version", "=", version)
          .on("r.userId", "in", (qb) =>
            qb
              .selectFrom("follows as f")
              .innerJoin("users as fu", "fu.userId", "f.followingId")
              .select("f.followingId")
              .where("f.followerId", "=", userId)
              // follows行の存在だけでは判定できない(#275フォロー後方修正:
              // 公開時代に成立したfollowsには承認記録がないため、対象が
              // 非公開の場合は承認記録の有無も要求する)
              .where((eb) =>
                eb.or([
                  eb("fu.isPublic", "=", 1),
                  eb.exists(
                    eb
                      .selectFrom("followApprovalNotifications as fan")
                      .select("fan.id")
                      .where("fan.recipientId", "=", userId)
                      .whereRef("fan.actorId", "=", "f.followingId"),
                  ),
                ]),
              ),
          )
          .on("r.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "r2",
              songIdRef: "s.songId",
              version,
              userIdRef: "r.userId",
            }),
          ),
      )
      .innerJoin("users as ru", "ru.userId", "r.userId")
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficulty",
        "s.difficultyLevel",
        "s.releasedVersion",
        "v.logId",
        "v.exScore",
        "v.bpi",
        "v.clearState",
        "v.missCount",
        "v.lastPlayed as scoreAt",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
        "r.exScore as rivalEx",
        "ru.userName as rivalName",
        "ru.profileImage as rivalImage",
        "r.userId as rivalId",
        sql<number>`r.exScore - v.exScore`.as("exDiff"),
      ])
      .where(diffExpr, ">=", minDiff)
      .where(diffExpr, "<=", maxDiff);

    if (levelArray && levelArray.length > 0) {
      query = query.where("s.difficultyLevel", "in", levelArray);
    }
    if (diffArray && diffArray.length > 0) {
      query = query.where("s.difficulty", "in", diffArray);
    }

    if (cursor) {
      query = query.where((eb) =>
        eb.or([
          eb(sql`r.exScore - v.exScore`, ">", cursor.lastDiff),
          eb.and([
            eb(sql`r.exScore - v.exScore`, "=", cursor.lastDiff),
            eb.or([
              eb("s.songId", ">", Number(cursor.lastSongId)),
              eb.and([
                eb("s.songId", ">=", Number(cursor.lastSongId)),
                eb("r.userId", ">", cursor.lastRivalId),
              ]),
            ]),
          ]),
        ]),
      );
    }

    return await query
      .orderBy("exDiff", "asc")
      .orderBy("s.songId", "asc")
      .orderBy("r.userId", "asc")
      .limit(limit)
      .execute();
  }

  /**
   * 指定バッチまたは期間内に追い抜いたライバルとその楽曲を取得する。
   *
   * 「追い抜き」とは、今回のスコアがライバルの直前スコアを上回り、
   * かつ自分の直前スコアはライバルを下回っていた楽曲を指す。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param options.range - 期間指定（`start`, `end`, 基準列 `basis`）
   * @param options.batchId - バッチ ID（`range` と排他）
   */
  async getOvertakenRivals(
    userId: string,
    version: string,
    options: {
      range?: { start: Date; end: Date; basis: "lastPlayed" | "createdAt" };
      batchId?: string;
    },
  ) {
    const { range, batchId } = options;

    const timeCol = range?.basis ?? "lastPlayed";

    let query = db
      .selectFrom("scores as current")
      .modifyFront(sql`straight_join`)
      .innerJoin("songs as s", "s.songId", "current.songId")
      .innerJoin("follows as f", (join) => join.on("f.followerId", "=", userId))
      .innerJoin("users as ru", "ru.userId", "f.followingId")
      .innerJoin("scores as r", (join) =>
        join
          .onRef("r.songId", "=", "current.songId")
          .on("r.version", "=", version)
          .onRef("r.userId", "=", "ru.userId")
          .on("r.logId", "=", (eb) =>
            eb
              .selectFrom("scores as r2")
              .select((s) => s.fn.max("logId").as("m"))
              .whereRef("r2.userId", "=", "r.userId")
              .where("r2.version", "=", version)
              .whereRef("r2.songId", "=", "current.songId")
              .whereRef(`r2.${timeCol}`, "<", `current.${timeCol}`),
          ),
      )
      .leftJoin("scores as prevBest", (join) =>
        join
          .onRef("prevBest.songId", "=", "current.songId")
          .on("prevBest.userId", "=", userId)
          .on("prevBest.version", "=", version)
          .on("prevBest.logId", "=", (eb) =>
            eb
              .selectFrom("scores as pb")
              .select((s) => s.fn.max("logId").as("m"))
              .where("pb.userId", "=", userId)
              .where("pb.version", "=", version)
              .whereRef("pb.songId", "=", "current.songId")
              .whereRef(`pb.${timeCol}`, "<", `current.${timeCol}`),
          ),
      )
      .select([
        "current.songId",
        "ru.userId as rivalUserId",
        "ru.userName as rivalName",
        "ru.profileImage as rivalProfileImage",
        "r.exScore as rivalScore",
        "current.exScore as myNewScore",
        "prevBest.exScore as myOldScore",
      ])
      .where("current.userId", "=", userId)
      .where("current.version", "=", version)
      // 対象が公開、または対象が非公開でも承認記録がある場合のみ表示する。
      // followsの存在だけでは判定できない(#275フォロー後方修正: 公開時代に
      // 成立したfollowsには承認記録がないため、承認記録の有無も要求する)
      .where((eb) =>
        eb.or([
          eb("ru.isPublic", "=", 1),
          eb.exists(
            eb
              .selectFrom("followApprovalNotifications as fan")
              .select("fan.id")
              .where("fan.recipientId", "=", userId)
              .whereRef("fan.actorId", "=", "ru.userId"),
          ),
        ]),
      );

    if (batchId) {
      query = query.where("current.batchId", "=", batchId);
    } else if (range) {
      query = query
        .where(`current.${timeCol}`, ">=", range.start)
        .where(`current.${timeCol}`, "<=", range.end);
    }

    return await query
      .whereRef("current.exScore", ">", "r.exScore")
      .where((eb) =>
        eb.or([
          eb("prevBest.exScore", "is", null),
          eb("r.exScore", ">", eb.ref("prevBest.exScore")),
        ]),
      )
      .execute();
  }

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
  // follows・users・scores・songs・songDefを横断JOINした単曲比較データの
  // ため、直接クエリを維持する。
  // 呼び出し元(rivals/following/scores/[songId].ts)は`viewerId`にURLの[userId]
  // (第三者が閲覧している可能性のある対象ユーザー)をそのまま渡すため、
  // 「followsの存在=閲覧者本人への閲覧許可」の前提(#275)が成立しない。
  // isPublicによる絞り込みを維持する
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

  /**
   * 指定した候補ユーザーID群のうち、`viewerId`が実際にフォローしており
   * 閲覧可能な（公開、または非公開でも承認済みの）ものだけを返す。
   *
   * 比較ページ(1:N)の比較対象選択(#287)で、フロントから送られてきた
   * 候補IDをそのまま信用せず、閲覧許可のあるユーザーだけに絞り込むための
   * 安全弁。`getRivalComparisonScores`の`followersOf`分岐と同じ判定条件。
   *
   * @param viewerId - 閲覧者のユーザー ID
   * @param candidateIds - 候補ユーザーID配列
   */
  async filterVisibleRivalIds(
    viewerId: string,
    candidateIds: string[],
  ): Promise<string[]> {
    if (candidateIds.length === 0) return [];

    const rows = await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "u.userId", "f.followingId")
      .select("f.followingId")
      .where("f.followerId", "=", viewerId)
      .where("f.followingId", "in", candidateIds)
      // follows行の存在だけでは判定できない(#275フォロー後方修正: 公開時代に
      // 成立したfollowsには承認記録がないため、対象が非公開の場合は
      // 承認記録の有無も要求する)
      .where((eb) =>
        eb.or([
          eb("u.isPublic", "=", 1),
          eb.exists(
            eb
              .selectFrom("followApprovalNotifications as fan")
              .select("fan.id")
              .where("fan.recipientId", "=", viewerId)
              .whereRef("fan.actorId", "=", "u.userId"),
          ),
        ]),
      )
      .execute();

    return rows.map((r) => r.followingId);
  }

  /**
   * 指定した複数ユーザー(自分+選択したライバル群)の楽曲ごと最新スコアを
   * 取得する。比較ページの複数ライバル(1:N)比較(#287)の基盤クエリ。
   *
   * 1人のみ(自分のみ、または自分+ライバル1人)を指定した場合も同じ形の
   * 結果を返す（呼び出し元で1:1表示に読み替える）。
   *
   * @param params.userIds - 対象ユーザーID配列（自分自身のIDを含めること）
   * @param params.version - バージョン番号
   */
  // users・songs・songDef・scoresを横断JOINした比較テーブルデータのため、
  // 直接クエリを維持する。
  async getMultiUserLatestScores(params: {
    userIds: string[];
    version: IIDXVersion;
  }): Promise<MultiRivalScoreRow[]> {
    const { userIds, version } = params;
    if (userIds.length === 0) return [];

    const latest = latestLogIdPerUserSongSubquery({
      table: "scores",
      version,
      userIds,
    }).as("latest");

    return await db
      .selectFrom("scores as s")
      .innerJoin(latest, (join) =>
        join
          .onRef("s.logId", "=", "latest.maxLogId")
          .onRef("s.userId", "=", "latest.userId")
          .onRef("s.songId", "=", "latest.songId"),
      )
      .innerJoin("users as u", "u.userId", "s.userId")
      .innerJoin("songs as sg", "sg.songId", "s.songId")
      .innerJoin("songDef as sd", (join) =>
        join.onRef("sd.songId", "=", "sg.songId").on("sd.isCurrent", "=", 1),
      )
      .select([
        "s.userId",
        "u.userName",
        "u.profileImage",
        "sg.songId",
        "sg.title",
        "sg.difficulty",
        "sg.difficultyLevel",
        "s.exScore",
        "s.bpi",
        "s.clearState",
        "s.lastPlayed",
        "sd.wrScore",
        "sd.kaidenAvg",
      ])
      .execute();
  }
}

export const rivalRepo = new RivalRepository();
