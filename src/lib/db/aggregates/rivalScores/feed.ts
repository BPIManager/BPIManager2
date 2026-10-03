import { db } from "@/lib/db";
import { sql } from "kysely";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { latestLogIdPerSongSubquery } from "@/lib/db/shared/latestScore/perSong";
dayjs.extend(utc);

/**
 * ソーシャルフィード（フォロー中ユーザーのスコア更新タイムライン）を担当するリポジトリクラス。
 */
class SocialTimelineRepository {
  /**
   * フォロー中ユーザーのスコア更新フィード。mode で played（自分もプレイ済み）/ overtaken（自分のベストを超えた）を絞り込む。
   * カーソルは lastPlayed の ISO 文字列。listId 指定時は所有者確認済みのフォローリスト所属ユーザーに絞る。
   *
   * @param params.viewerId - 閲覧者のユーザー ID
   * @param params.version - バージョン番号
   * @param params.limit - 取得件数
   * @param params.lastId - カーソル（lastPlayed ISO 文字列）
   * @param params.mode - フィルターモード
   * @param params.search - ユーザー名または曲名の部分一致検索
   * @param params.levels - 対象難易度レベルの配列
   * @param params.difficulties - 対象難易度文字列の配列
   * @param params.listId - 指定時、viewerId が所有するこのフォローリストの所属ユーザーに絞る
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
    listId?: number;
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
      listId,
    } = params;

    // Phase 1 で表示対象の logId を lastPlayed 降順に limit 件確定し、Phase 2 でそれだけ相関サブクエリを評価する。
     // 単一クエリだと JOIN のファンアウト全行に相関サブクエリが走り極端に遅いため分割する。両フェーズとも同値タイブレークを入れる。

    // follows を起点に straight_join で結合順序を固定する。scores 起点だとフォロー外の大多数まで走査するため（getOvertakenRivals と同型）。
    const needsSongJoin =
      !!search || !!levels?.length || !!difficulties?.length;

    const picked = await db
      .selectFrom("follows as f")
      .modifyFront(sql`straight_join`)
      .innerJoin("scores as s", (join) =>
        join.onRef("s.userId", "=", "f.followingId").on("s.version", "=", version),
      )
      .innerJoin("users as u", "s.userId", "u.userId")
      .select(["s.logId", "s.lastPlayed"])
      .where("f.followerId", "=", viewerId)
      // 公開、または非公開でも承認記録がある場合のみ表示する。follows の存在だけでは公開時代の行を判別できないため。
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
      .$if(listId !== undefined, (qb) =>
        qb.where(
          "f.followingId",
          "in",
          db
            .selectFrom("followListMembers")
            .select("followingId")
            .where("listId", "=", listId as number),
        ),
      )
      .$if(needsSongJoin, (qb) => {
        let q = qb.innerJoin("songs as m", "s.songId", "m.songId");
        if (search) {
          q = q.where((eb) =>
            eb.or([
              eb("u.userName", "like", `%${search}%`),
              eb("m.title", "like", `%${search}%`),
            ]),
          );
        }
        if (levels?.length) {
          q = q.where("m.difficultyLevel", "in", levels);
        }
        if (difficulties?.length) {
          q = q.where("m.difficulty", "in", difficulties);
        }
        return q;
      })
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
      .orderBy("s.logId", "desc")
      .limit(limit)
      .execute();

    if (picked.length === 0) return [];
    const pickedLogIds = picked.map((r) => r.logId);

    return await db
      .selectFrom("scores as s")
      .innerJoin("users as u", "s.userId", "u.userId")
      .innerJoin("songs as m", "s.songId", "m.songId")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
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
      .where("s.logId", "in", pickedLogIds)
      .orderBy("s.lastPlayed", "desc")
      .orderBy("s.logId", "desc")
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

    const latestLogIds = await latestLogIdPerSongSubquery({
      table: "scores",
      userId: viewerId,
      version,
      extra: (qb) => qb.where("songId", "in", songIds),
    }).execute();

    const ids = latestLogIds.map((l) => l.maxLogId as number);
    if (ids.length === 0) return [];

    return await db
      .selectFrom("scores")
      .select(["songId", "exScore", "bpi", "clearState"])
      .where("logId", "in", ids)
      .execute();
  }
}

export const socialTimelineRepo = new SocialTimelineRepository();
