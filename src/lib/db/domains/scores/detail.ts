import { db } from "@/lib/db";
import { sql } from "kysely";
import { IIDXVersion } from "@/types/iidx/version";
import { latestLogIdPerSongScalarSubquery, latestLogIdPerSongSubquery } from "@/lib/db/shared/latestScore/perSong";
import { latestSongDefIdSubquery } from "@/lib/db/shared/songDef";

/**
 * スコア詳細情報（比較・曲定義結合）の参照を担当するリポジトリクラス。
 */
class LogScoreRepository {
  /**
   * 最終プレイ日時が指定範囲内のスコアを、比較情報付きで取得する。
   *
   * 内部で {@link getScoresWithDetails} を呼び出す。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @param range - 取得対象の lastPlayed UTC 範囲
   */
  async getScoresByLastPlayedRange(
    userId: string,
    version: IIDXVersion,
    range: { start: Date; end: Date },
  ) {
    return await this.getScoresWithDetails(userId, version, {
      targetTime: range.end,
      comparisonTime: range.start,
      onlyLastPlayedInRange: range,
    });
  }

  /**
   * スコア情報を取得します。比較対象（過去スコア）や最新定義（SongDef）を結合します。
   * @param userId ユーザーID
   * @param version バージョン
   * @param options.batchIds 指定したバッチに含まれるスコアのみ取得する場合
   * @param options.targetTime 特定時点（スナップショット）のスコアを取得する場合
   * @param options.untilLogId 指定した logId 以下のスコアだけを対象にしたスナップショットを取得する場合（`targetTime` と併用可）
   * @param options.comparisonTime 比較対象とする過去時点（この時刻より前の最新スコアを prev として取得）
   * @param options.onlyLastPlayedInRange 最終プレイ日時（lastPlayed）が指定範囲内のスコアを取得する場合
   * @param options.clearState クリア状況で絞り込む場合（`current.clearState`完全一致）
   * @param options.bpiMin/bpiMax BPI範囲で絞り込む場合（未プレイは`-15`扱い、`filterSongsServerSide`と同じ既定値）
   * @param options.notesMin/notesMax notes数範囲で絞り込む場合（`s.notes`）
   */
  async getScoresWithDetails(
    userId: string,
    version: IIDXVersion,
    options: {
      batchIds?: string[];
      targetTime?: Date;
      untilLogId?: number;
      comparisonTime?: Date;
      onlyLastPlayedInRange?: { start: Date; end: Date };
      clearState?: string;
      bpiMin?: number;
      bpiMax?: number;
      notesMin?: number;
      notesMax?: number;
    },
  ) {
    const {
      batchIds,
      targetTime,
      untilLogId,
      comparisonTime,
      onlyLastPlayedInRange,
      clearState,
      bpiMin,
      bpiMax,
      notesMin,
      notesMax,
    } = options;
    const isInf = version === "INF";

    let query = db
      .selectFrom("scores as current")
      .innerJoin("songs as s", "s.songId", "current.songId")
      .leftJoin("scores as prev", (join) =>
        join
          .onRef("prev.songId", "=", "current.songId")
          .on("prev.userId", "=", userId)
          .on("prev.version", "=", version)
          .on("prev.logId", "=", (qb) => {
            const sub = qb
              .selectFrom("scores as sub")
              .select((eb) => eb.fn.max("sub.logId").as("maxLogId"))
              .whereRef("sub.songId", "=", "current.songId")
              .where("sub.userId", "=", userId)
              .where("sub.version", "=", version);

            if (comparisonTime) {
              const timeColumn = onlyLastPlayedInRange
                ? "sub.lastPlayed"
                : "sub.createdAt";
              return sub.where(timeColumn, "<", comparisonTime);
            } else {
              return sub.whereRef("sub.logId", "<", "current.logId");
            }
          }),
      )
      .leftJoin(
        () => latestSongDefIdSubquery().as("latest_sd"),
        (join) => join.onRef("latest_sd.l_defSongId", "=", "s.songId"),
      )
      .leftJoin("songDef as sd", "sd.defId", "latest_sd.maxDefId")
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficultyLevel",
        "s.difficulty",
        "s.releasedVersion",
        "current.logId",
        "current.batchId",
        "current.exScore",
        "current.bpi",
        "current.clearState",
        "current.missCount",
        "current.lastPlayed as scoreAt",
        "prev.exScore as p_exScore",
        "prev.bpi as p_bpi",
        "prev.clearState as p_clearState",
        "prev.missCount as p_missCount",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
        "sd.mu",
        "sd.sigma",
        "sd.residualVar",
      ]);

    if (batchIds && batchIds.length > 0) {
      query = query
        .where("current.userId", "=", userId)
        .where("current.batchId", "in", batchIds)
        .where("current.logId", "in", (qb) =>
          qb
            .selectFrom("scores")
            .select((eb) => eb.fn.max("logId").as("logId"))
            .where("userId", "=", userId)
            .where("batchId", "in", batchIds)
            .groupBy("songId"),
        );
    } else if (onlyLastPlayedInRange) {
      query = query
        .where("current.userId", "=", userId)
        .where("current.version", "=", version)
        .where("current.lastPlayed", ">=", onlyLastPlayedInRange.start)
        .where("current.lastPlayed", "<=", onlyLastPlayedInRange.end)
        .where(
          "current.logId",
          "in",
          latestLogIdPerSongScalarSubquery({
            table: "scores",
            userId,
            version,
            extra: (qb) =>
              qb
                .where("lastPlayed", ">=", onlyLastPlayedInRange.start)
                .where("lastPlayed", "<=", onlyLastPlayedInRange.end),
          }),
        );
    } else if (targetTime || untilLogId !== undefined) {
      query = query
        .innerJoin(
          latestLogIdPerSongSubquery({
            table: "scores",
            userId,
            version,
            extra: (qb) => {
              let q = qb;
              if (targetTime) q = q.where("createdAt", "<=", targetTime);
              if (untilLogId !== undefined) q = q.where("logId", "<=", untilLogId);
              return q;
            },
          }).as("latest_sc"),
          (join) => join.onRef("latest_sc.songId", "=", "s.songId"),
        )
        .whereRef("current.logId", "=", "latest_sc.maxLogId");
    }
    return await query
      .$if(!isInf, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb("s.deletedAt", "is", null),
            eb("s.deletedAt", ">", version),
          ]),
        ),
      )
      .$if(clearState !== undefined, (qb) =>
        qb.where("current.clearState", "=", clearState!),
      )
      .$if(bpiMin !== undefined, (qb) =>
        qb.where(sql<number>`COALESCE(current.bpi, -15)`, ">=", bpiMin!),
      )
      .$if(bpiMax !== undefined, (qb) =>
        qb.where(sql<number>`COALESCE(current.bpi, -15)`, "<=", bpiMax!),
      )
      .$if(notesMin !== undefined, (qb) =>
        qb.where("s.notes", ">=", notesMin!),
      )
      .$if(notesMax !== undefined, (qb) =>
        qb.where("s.notes", "<=", notesMax!),
      )
      .orderBy("s.difficultyLevel", "desc")
      .orderBy("s.title", "asc")
      .execute();
  }

  /**
   * プレイ日時（lastPlayed）が基準時刻より前（または以前）のスコアのうち、曲ごとのベストEXスコアを取得する。
   * 取り込み日と無関係に「その時点までにプレイされたスコア」の状態を作るのに使う（プレイ日基準の更新ログ用）。
   * スコアは更新時にのみ記録されるため、基準時刻までの最大EXスコアがその時点のベスト。
   *
   * @param cutoff - 基準時刻
   * @param inclusive - true なら基準時刻ちょうどを含める（`<=`）、false なら含めない（`<`）
   */
  async getBestScoresAsOfPlayed(
    userId: string,
    version: IIDXVersion,
    cutoff: Date,
    inclusive: boolean,
  ) {
    const op = inclusive ? "<=" : "<";
    const best = db
      .selectFrom("scores")
      .select(["songId", (eb) => eb.fn.max("exScore").as("maxEx")])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("lastPlayed", op, cutoff)
      .groupBy("songId")
      .as("best");
    const rows = await db
      .selectFrom("scores as s")
      .innerJoin(best, (join) =>
        join.onRef("best.songId", "=", "s.songId").onRef("best.maxEx", "=", "s.exScore"),
      )
      .innerJoin("songs as m", "m.songId", "s.songId")
      .select([
        "s.songId",
        "s.logId",
        "s.exScore",
        "s.bpi",
        "m.title",
        "m.notes",
        "m.difficulty",
        "m.difficultyLevel",
      ])
      .where("s.userId", "=", userId)
      .where("s.version", "=", version)
      .where("s.lastPlayed", op, cutoff)
      .$if(version !== "INF", (qb) =>
        qb.where((eb) =>
          eb.or([eb("m.deletedAt", "is", null), eb("m.deletedAt", ">", version)]),
        ),
      )
      .execute();
    // 同点が複数行ある曲は最新(logId最大)の行を採る
    const bySong = new Map<number, (typeof rows)[number]>();
    for (const r of rows) {
      const cur = bySong.get(r.songId);
      if (!cur || r.logId > cur.logId) bySong.set(r.songId, r);
    }
    return [...bySong.values()];
  }
}

export const scoreDetailRepo = new LogScoreRepository();
