import { db } from "@/lib/db";
import dayjs from "dayjs";
import { sql } from "kysely";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

/**
 * ソーシャルフィード（フォロー中ユーザーのスコア更新タイムライン）を担当するリポジトリクラス。
 */
class SocialTimelineRepository {
  /**
   * フォロー中ユーザーのスコア更新フィードを取得する。
   *
   * `mode` で絞り込みができる:
   * - `"played"`: 自分もプレイしている楽曲のみ
   * - `"overtaken"`: 自分のベストを超えているスコアのみ
   *
   * カーソルページネーション（`lastId` = lastPlayed の ISO 文字列）に対応する。
   *
   * @param params.viewerId - 閲覧者のユーザー ID
   * @param params.version - バージョン番号
   * @param params.limit - 取得件数
   * @param params.lastId - カーソル（lastPlayed ISO 文字列）
   * @param params.mode - フィルターモード
   * @param params.search - ユーザー名または曲名の部分一致検索
   * @param params.levels - 対象難易度レベルの配列
   * @param params.difficulties - 対象難易度文字列の配列
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
   * 指定楽曲群に対して、閲覧者の最新スコアを取得する。
   *
   * タイムライン表示時に自分のスコアを並べて表示するために使用する。
   *
   * @param viewerId - 閲覧者のユーザー ID
   * @param version - バージョン番号
   * @param songIds - 対象楽曲 ID の配列
   * @returns `{ songId, exScore, bpi, clearState }[]`
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
}

export const socialTimelineRepo = new SocialTimelineRepository();
