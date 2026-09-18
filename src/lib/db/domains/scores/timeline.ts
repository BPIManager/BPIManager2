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
   * @param difficultyLevel 指定すると、その難易度レベルの楽曲のみに絞り込む
   *   （絞り込みは最初の集計段階で行い、対象外の楽曲のスコアを走査しない）
   */
  async getBestEverScores(params: {
    userId: string;
    currentVersion: string;
    excludeCurrent: boolean;
    difficultyLevel?: number;
  }) {
    const { userId, currentVersion, excludeCurrent, difficultyLevel } = params;
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

    if (difficultyLevel !== undefined) {
      latestPerVersionSub = latestPerVersionSub.where(
        "sc.songId",
        "in",
        (eb) =>
          eb
            .selectFrom("songs")
            .select("songId")
            .where("difficultyLevel", "=", difficultyLevel),
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
        "sd.mu",
        "sd.sigma",
        "sd.residualVar",
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
   * バッチ（または期間）内で更新したスコアを、他バージョン（閲覧中バージョンを除く
   * 自分がプレイ済みの全バージョン。INFやそれより後のバージョンも対象に含む）での
   * 自分のスコアと突き合わせる。勝敗・既存の追い抜き済みかどうかに関わらず、
   * プレイ済みの組み合わせは全件返す（勝敗判定・「このバッチで新たに追い抜いたか」の
   * 判定は呼び出し元で`myNewScore`/`myOldScore`/`targetScore`から行う）。
   * 1曲について複数バージョンと比較可能な場合はバージョンごとに1行返る。
   *
   * @param params.userId - 対象ユーザーID
   * @param params.currentVersion - 閲覧中バージョン（バッチ・スコア更新が記録されたバージョン）
   * @param params.batchId - 単一バッチに絞り込む場合（`range`と排他）
   * @param params.range - 期間で絞り込む場合（日次/週次/月次集計向け、`batchId`と排他）
   */
  async getVersionComparisons(params: {
    userId: string;
    currentVersion: string;
    batchId?: string;
    range?: { start: Date; end: Date; basis: "lastPlayed" | "createdAt" };
  }) {
    const { userId, currentVersion, batchId, range } = params;
    const timeCol = range?.basis ?? "lastPlayed";

    // 自分の全バージョンにおける曲ごとの最新スコア（過去バージョン1件ずつとの
    // 比較対象。バージョンが概念上時系列に閉じているため、時刻境界は不要）
    const latestPerSongVersion = db
      .selectFrom("scores")
      .select(["songId", "version", (eb) => eb.fn.max("logId").as("maxLogId")])
      .where("userId", "=", userId)
      .groupBy(["songId", "version"]);

    // `batchId`/`range`で絞り込んだ範囲内で、閲覧中バージョンにおける曲ごとの
    // 最良スコア（同点なら最新のログ）1件に集約する。集約しないと、範囲内で
    // 同じ曲を複数回更新した場合に更新イベントの数だけ比較行が重複してしまう
    let scopedCurrent = db
      .selectFrom("scores")
      .select(["songId", "exScore", "logId"])
      .where("userId", "=", userId)
      .where("version", "=", currentVersion);

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
      .innerJoin("scores as current", "current.logId", "currentPick.logId")
      .innerJoin(latestPerSongVersion.as("latest"), (join) =>
        join.onRef("latest.songId", "=", "current.songId"),
      )
      .innerJoin("scores as past", (join) =>
        join.onRef("past.logId", "=", "latest.maxLogId"),
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
        "prevBest.exScore as myOldScore",
        "past.version as targetVersion",
        "past.exScore as targetScore",
      ])
      .where("past.version", "!=", currentVersion);

    return await query.execute();
  }
}

export const timelineRepo = new ScoreTimelineRepository();
