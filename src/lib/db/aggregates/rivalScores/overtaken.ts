import { db } from "@/lib/db";

import { sql } from "kysely";


/**
 * 追い抜かれたライバルの一覧を担当するリポジトリクラス。
 */
class RivalOvertakenRepository {
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

    // `batchId`/`range`で絞り込んだ範囲内で、閲覧中バージョンにおける曲ごとの
    // 最良スコア（同点なら最新のログ）1件に集約する。集約しないと、範囲内で
    // 同じ曲を複数回更新した場合に更新イベントの数だけ比較行が重複してしまう
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
      // 対象が公開、または対象が非公開でも承認記録がある場合のみ表示する。
      // followsの存在だけでは判定できない(公開時代に成立したfollowsには
      // 承認記録がないため、承認記録の有無も要求する)
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
