import { db } from "@/lib/db";
import dayjs from "dayjs";
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

    return await db
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
      .select((eb) => [
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
        eb.fn
          .coalesce(
            eb
              .selectFrom("scores as s2")
              .select((s2eb) => s2eb.fn.max("s2.exScore").as("m"))
              .whereRef("s2.userId", "=", "s.userId")
              .whereRef("s2.songId", "=", "s.songId")
              .whereRef("s2.logId", "<", "s.logId"),
            eb.lit(-1),
          )
          .as("prevExScore"),
        eb
          .selectFrom("scores as s3")
          .select("s3.bpi")
          .whereRef("s3.userId", "=", "s.userId")
          .whereRef("s3.songId", "=", "s.songId")
          .whereRef("s3.logId", "<", "s.logId")
          .orderBy("s3.logId", "desc")
          .limit(1)
          .as("prevBpi"),
        eb
          .selectFrom("scores as s4")
          .select((s4eb) => s4eb.fn.max("s4.exScore").as("m"))
          .where("s4.userId", "=", viewerId)
          .whereRef("s4.songId", "=", "s.songId")
          .where("s4.version", "=", version)
          .as("myBestExScore"),
      ])
      .where("s.version", "=", version)
      .where("u.isPublic", "=", 1)
      .$if(!!search, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb("u.userName", "like", `%${search}%`),
            eb("m.title", "like", `%${search}%`),
          ]),
        ),
      )
      .$if(!!levels?.length, (qb) =>
        qb.where("m.difficultyLevel", "in", levels!),
      )
      .$if(!!difficulties?.length, (qb) =>
        qb.where("m.difficulty", "in", difficulties!),
      )
      .$if(mode === "played", (qb) =>
        qb.where(({ exists, selectFrom }) =>
          exists(
            selectFrom("scores as v")
              .select("v.logId")
              .whereRef("v.songId", "=", "s.songId")
              .where("v.userId", "=", viewerId)
              .where("v.version", "=", version),
          ),
        ),
      )
      .$if(mode === "overtaken", (qb) =>
        qb.where((eb) =>
          eb.exists(
            eb
              .selectFrom("scores as v")
              .select(eb.lit(1).as("one"))
              .whereRef("v.songId", "=", "s.songId")
              .where("v.userId", "=", viewerId)
              .where("v.version", "=", version)
              .having((heb) =>
                heb.and([
                  heb(heb.fn.max("v.exScore"), "<", heb.ref("s.exScore")),
                  heb(
                    heb.fn.max("v.exScore"),
                    ">",
                    heb.fn.coalesce(
                      heb
                        .selectFrom("scores as prev")
                        .select((peb) => peb.fn.max("prev.exScore").as("m"))
                        .whereRef("prev.userId", "=", "s.userId")
                        .whereRef("prev.songId", "=", "s.songId")
                        .whereRef("prev.logId", "<", "s.logId"),
                      heb.lit(-1),
                    ),
                  ),
                ]),
              ),
          ),
        ),
      )
      .$if(!!lastId, (qb) =>
        qb.where("s.lastPlayed", "<", dayjs.utc(lastId).toDate()),
      )
      .orderBy("s.lastPlayed", "desc")
      .limit(limit)
      .execute();
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
