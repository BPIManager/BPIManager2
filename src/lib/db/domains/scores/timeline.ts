import { db } from "@/lib/db";
import { IIDXVersion } from "@/types/iidx/version";
import { correlatedLatestLogId } from "@/lib/db/shared/latestScore/correlated";
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

    // 派生テーブルを重ねた単一SQLは、MariaDBで scores 全走査の実行計画になり得るため、
    // ユーザーの全ログを covering index で取得し、最良ログの選択はアプリ側で行う。
    let logsQuery = db
      .selectFrom("scores as sc")
      .select(["sc.songId", "sc.version", "sc.logId", "sc.exScore"])
      .where("sc.userId", "=", userId);
    if (excludeCurrent) {
      logsQuery = logsQuery.where("sc.version", "!=", currentVersion);
    }
    if (difficultyLevel !== undefined) {
      logsQuery = logsQuery
        .innerJoin("songs as sg", "sg.songId", "sc.songId")
        .where("sg.difficultyLevel", "=", difficultyLevel);
    }
    const logs = await logsQuery.execute();
    if (logs.length === 0) return [];

    // 各譜面について、バージョンごとの最新ログのEXの最大値を求め、
    // そのEXを持つログのうち最新(logId最大)を代表ログとする
    const latestPerVersion = new Map<string, { logId: number; exScore: number }>();
    for (const l of logs) {
      const key = `${l.songId}:${l.version}`;
      const cur = latestPerVersion.get(key);
      if (!cur || l.logId > cur.logId) {
        latestPerVersion.set(key, { logId: l.logId, exScore: l.exScore });
      }
    }
    const bestEx = new Map<number, number>();
    for (const [key, v] of latestPerVersion) {
      const songId = Number(key.split(":")[0]);
      bestEx.set(songId, Math.max(bestEx.get(songId) ?? -1, v.exScore));
    }
    const representative = new Map<number, number>();
    for (const l of logs) {
      if (l.exScore !== bestEx.get(l.songId)) continue;
      representative.set(
        l.songId,
        Math.max(representative.get(l.songId) ?? -1, l.logId),
      );
    }

    return await db
      .selectFrom("scores as sc2")
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
      .where("sc2.logId", "in", [...representative.values()])
      .execute();
  }

  /**
   * ユーザーの全スコアログ（曲×バージョン×logId×EX）を、指定レベル・難易度の譜面に絞って返す。
   * `idx_scores_with_winloss` だけで読めるカバリング走査で、集計は呼び出し側で行う。
   */
  async listScoreLogs(params: {
    userId: string;
    levels: number[];
    difficulties: string[];
  }) {
    const { userId, levels, difficulties } = params;
    return await db
      .selectFrom("scores as sc")
      .innerJoin("songs as sg", "sg.songId", "sc.songId")
      .select([
        "sc.songId",
        "sc.version",
        "sc.logId",
        "sc.exScore",
        "sg.difficulty",
        "sg.difficultyLevel",
      ])
      .where("sc.userId", "=", userId)
      .$if(levels.length > 0, (qb) => qb.where("sg.difficultyLevel", "in", levels))
      .$if(difficulties.length > 0, (qb) =>
        qb.where("sg.difficulty", "in", difficulties as never[]),
      )
      .execute();
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
   * バッチ（または期間）内で更新したスコアを、閲覧中バージョン以外で自分がプレイ済みの全バージョンのスコアと突き合わせる。
   * 勝敗や追い抜き済みかは問わず全件返し、判定は呼び出し元で行う。1曲について複数バージョンがあればバージョンごとに1行返る。
   *
   * @param params.userId - 対象ユーザーID
   * @param params.currentVersion - 閲覧中バージョン（バッチ・スコア更新が記録されたバージョン）
   * @param params.batchId - 単一バッチに絞る場合（range と排他）
   * @param params.range - 期間で絞る場合（batchId と排他）
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

    // 範囲内で同じ曲を複数回更新しても比較行が重複しないよう、閲覧中バージョンの曲ごとの最良（同点なら最新）1件に集約する。
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
