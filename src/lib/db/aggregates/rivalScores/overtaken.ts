import { db } from "@/lib/db";

import { sql } from "kysely";


/**
 * 追い抜かれたライバルの一覧を担当するリポジトリクラス。
 */
class RivalOvertakenRepository {
  /**
   * 指定バッチまたは期間内に追い抜いたライバルとその楽曲を取得する。追い抜きは、今回のスコアがライバルの直前を上回り、自分の直前は下回っていた場合。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param options.range - 期間指定（start, end, 基準列 basis）
   * @param options.batchId - バッチ ID（range と排他）
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

    // 範囲内で同じ曲を複数回更新した場合に比較行が重複しないよう、曲ごとの最良スコア（同点なら最新）1件に集約する。
    let scopedCurrent = db
      .selectFrom("scores")
      .select(["songId", "exScore", "logId"])
      .where("userId", "=", userId)
      .where("version", "=", version);

    if (batchId) {
      scopedCurrent = scopedCurrent.where("batchId", "=", batchId);
    } else if (range) {
      scopedCurrent = scopedCurrent
        .where(`${timeCol}`, ">=", range.start)
        .where(`${timeCol}`, "<=", range.end);
    }

    const bestExScorePerSong = db
      .selectFrom(scopedCurrent.as("sc"))
      .select(["sc.songId", (eb) => eb.fn.max("sc.exScore").as("bestExScore")])
      .groupBy("sc.songId");

    const bestCurrentPerSong = db
      .selectFrom(scopedCurrent.as("sc"))
      .innerJoin(bestExScorePerSong.as("best"), (join) =>
        join
          .onRef("best.songId", "=", "sc.songId")
          .onRef("best.bestExScore", "=", "sc.exScore"),
      )
      .select(["sc.songId", (eb) => eb.fn.max("sc.logId").as("logId")])
      .groupBy("sc.songId");

    const query = db
      .selectFrom(bestCurrentPerSong.as("currentPick"))
      .modifyFront(sql`straight_join`)
      .innerJoin("scores as current", "current.logId", "currentPick.logId")
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
      // 公開、または非公開でも承認記録がある場合のみ表示する。follows の存在だけでは公開時代の行を判別できないため。
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
}

export const rivalOvertakenRepo = new RivalOvertakenRepository();
