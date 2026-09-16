import { db } from "@/lib/db";
import { IIDXVersion } from "@/types/iidx/version";
import { correlatedLatestLogId } from "@/lib/db/shared/latestScore";
import { latestSongDefIdSubquery } from "@/lib/db/shared/songDef";

class ScoreTimelineRepository {
  /**
   * 自己歴代ベストスコアを全バージョン（または今作を除く全バージョン）から取得する。
   * @param userId ユーザーID
   * @param currentVersion 今作のバージョン番号 (excludeCurrent=true のとき除外対象)
   * @param excludeCurrent true のとき今作バージョンを除外する
   */
  async getBestEverScores(params: {
    userId: string;
    currentVersion: string;
    excludeCurrent: boolean;
  }) {
    const { userId, currentVersion, excludeCurrent } = params;
    let latestPerVersionSub = db
      .selectFrom("scores as sc")
      .select([
        "sc.songId",
        "sc.version",
        (eb) => eb.fn.max("sc.logId").as("latestLogId"),
      ])
      .where("sc.userId", "=", userId);

    if (excludeCurrent) {
      latestPerVersionSub = latestPerVersionSub.where(
        "sc.version",
        "!=",
        currentVersion,
      );
    }

    const latestPerVersion = latestPerVersionSub
      .groupBy(["sc.songId", "sc.version"])
      .as("lpv");
    const bestLogSub = db
      .selectFrom("scores as s2")
      .innerJoin(latestPerVersion, (join) =>
        join
          .onRef("s2.logId", "=", "lpv.latestLogId")
          .onRef("s2.songId", "=", "lpv.songId"),
      )
      .select([
        "s2.songId as b_songId",
        (eb) => eb.fn.max("s2.exScore").as("bestExScore"),
      ])
      .groupBy("s2.songId")
      .as("best");
    const bestScoreRow = db
      .selectFrom("scores as bs")
      .innerJoin(bestLogSub, (join) =>
        join
          .onRef("bs.songId", "=", "best.b_songId")
          .onRef("bs.exScore", "=", "best.bestExScore"),
      )
      .where("bs.userId", "=", userId)
      .select([
        "bs.songId as r_songId",
        (eb) => eb.fn.max("bs.logId").as("r_logId"),
      ])
      .groupBy("bs.songId")
      .as("bestRow");

    const rows = await db
      .selectFrom("scores as sc2")
      .innerJoin(bestScoreRow, (join) =>
        join
          .onRef("sc2.logId", "=", "bestRow.r_logId")
          .onRef("sc2.songId", "=", "bestRow.r_songId"),
      )
      .innerJoin("songs as sg", "sg.songId", "sc2.songId")
      .leftJoin("songDef as sd", (join) =>
        join.onRef("sd.songId", "=", "sc2.songId").on("sd.isCurrent", "=", 1),
      )
      .select([
        "sg.songId",
        "sg.title",
        "sg.notes",
        "sg.bpm",
        "sg.difficulty",
        "sg.difficultyLevel",
        "sg.releasedVersion",
        "sc2.exScore as bestExScore",
        "sc2.bpi as bestBpi",
        "sc2.version as bestVersion",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
      ])
      .execute();

    return rows;
  }

  async getSelfVersionScores(params: {
    userId: string;
    currentVersion: IIDXVersion;
    targetVersion: string;
  }) {
    const { userId, currentVersion, targetVersion } = params;
    const isInf = currentVersion === "INF";

    const rows = await db
      .selectFrom("songs as s")
      .innerJoin(
        () => latestSongDefIdSubquery().as("latest_sd"),
        (join) => join.onRef("latest_sd.l_defSongId", "=", "s.songId"),
      )
      .leftJoin("songDef as sd", "sd.defId", "latest_sd.maxDefId")
      .leftJoin("scores as cur", (join) =>
        join
          .onRef("cur.songId", "=", "s.songId")
          .on("cur.userId", "=", userId)
          .on("cur.version", "=", currentVersion)
          .on("cur.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "c2",
              songIdRef: "s.songId",
              version: currentVersion,
              userId,
            }),
          ),
      )
      .leftJoin("scores as prev", (join) =>
        join
          .onRef("prev.songId", "=", "s.songId")
          .on("prev.userId", "=", userId)
          .on("prev.version", "=", targetVersion)
          .on("prev.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "p2",
              songIdRef: "s.songId",
              version: targetVersion,
              userId,
            }),
          ),
      )
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficulty",
        "s.difficultyLevel",
        "s.releasedVersion",
        "cur.exScore as myExScore",
        "cur.bpi as myBpi",
        "cur.clearState as myClearState",
        "cur.missCount as myMissCount",
        "cur.lastPlayed as myLastPlayed",
        "prev.exScore as prevExScore",
        "prev.bpi as prevBpi",
        "prev.clearState as prevClearState",
        "prev.missCount as prevMissCount",
        "prev.lastPlayed as prevLastPlayed",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
        "sd.mu",
        "sd.sigma",
        "sd.residualVar",
      ])
      .$if(!isInf, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb("s.deletedAt", "is", null),
            eb("s.deletedAt", ">", currentVersion),
          ]),
        ),
      )
      .where((eb) =>
        eb.or([
          eb("cur.exScore", "is not", null),
          eb("prev.exScore", "is not", null),
        ]),
      )
      .orderBy("s.difficultyLevel", "desc")
      .orderBy("s.title", "asc")
      .execute();

    return rows;
  }

  /**
   * バッチ（または期間）内で更新したスコアのうち、`targetVersion`時点の自分のスコアを
   * 新たに上回った楽曲を検出する。`rivalScores/rival.ts`の`getOvertakenRivals`と同じ
   * 「このバッチで初めて追い抜いた」判定パターン（バッチ内の直前ベストと比較）を、
   * ライバルではなく別バージョンの自分のスコアに適用したもの。
   *
   * @param params.userId - 対象ユーザーID
   * @param params.currentVersion - 閲覧中バージョン（バッチ・スコア更新が記録されたバージョン）
   * @param params.targetVersion - 比較対象バージョン
   * @param params.batchId - 単一バッチに絞り込む場合（`range`と排他）
   * @param params.range - 期間で絞り込む場合（日次/週次/月次集計向け、`batchId`と排他）
   */
  async getVersionOvertaken(params: {
    userId: string;
    currentVersion: string;
    targetVersion: string;
    batchId?: string;
    range?: { start: Date; end: Date; basis: "lastPlayed" | "createdAt" };
  }) {
    const { userId, currentVersion, targetVersion, batchId, range } = params;
    const timeCol = range?.basis ?? "lastPlayed";

    let query = db
      .selectFrom("scores as current")
      .leftJoin("scores as target", (join) =>
        join
          .onRef("target.songId", "=", "current.songId")
          .on("target.userId", "=", userId)
          .on("target.version", "=", targetVersion)
          .on("target.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "t2",
              songIdRef: "current.songId",
              version: targetVersion,
              userId,
            }),
          ),
      )
      .leftJoin("scores as prevBest", (join) =>
        join
          .onRef("prevBest.songId", "=", "current.songId")
          .on("prevBest.userId", "=", userId)
          .on("prevBest.version", "=", currentVersion)
          .on("prevBest.logId", "=", (eb) =>
            eb
              .selectFrom("scores as pb")
              .select((s) => s.fn.max("logId").as("m"))
              .where("pb.userId", "=", userId)
              .where("pb.version", "=", currentVersion)
              .whereRef("pb.songId", "=", "current.songId")
              .whereRef(`pb.${timeCol}`, "<", `current.${timeCol}`),
          ),
      )
      .select([
        "current.songId",
        "current.exScore as myNewScore",
        "target.exScore as targetScore",
        "prevBest.exScore as myOldScore",
      ])
      .where("current.userId", "=", userId)
      .where("current.version", "=", currentVersion);

    if (batchId) {
      query = query.where("current.batchId", "=", batchId);
    } else if (range) {
      query = query
        .where(`current.${timeCol}`, ">=", range.start)
        .where(`current.${timeCol}`, "<=", range.end);
    }

    return await query
      .where("target.exScore", "is not", null)
      .whereRef("current.exScore", ">", "target.exScore")
      .where((eb) =>
        eb.or([
          eb("prevBest.exScore", "is", null),
          eb("prevBest.exScore", "<=", eb.ref("target.exScore")),
        ]),
      )
      .execute();
  }
}

export const timelineRepo = new ScoreTimelineRepository();
