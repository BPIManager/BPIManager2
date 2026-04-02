import { db } from "@/lib/db";
import { OptimizationResult } from "@/types/bpi-optimizer";
import { sql } from "kysely";
import { v4 as uuidv4 } from "uuid";

/**
 * BPI最適化機能向けのDBアクセスを担当するリポジトリクラス。
 */
class BpiOptimizerRepository {
  /**
   * 指定バージョンの全BPI対象楽曲（☆11/☆12、HYPER/ANOTHER/LEGGENDARIA）と
   * ユーザーの最新スコアをLEFT JOINで取得する。
   *
   * 未プレイ楽曲もNULLスコアとして含まれる。
   *
   * @param userId - ユーザーID
   * @param version - バージョン番号
   */
  async getAllSongsWithUserScores(userId: string, version: string) {
    const versionNum = parseInt(version);
    const latestScores = db
      .selectFrom("scores")
      .select([
        "songId",
        "exScore",
        "bpi",
        sql<number>`row_number() over(partition by songId order by logId desc)`.as(
          "rn",
        ),
      ])
      .where("userId", "=", userId)
      .where("version", "=", version);

    return db
      .selectFrom("songs as m")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .leftJoin(latestScores.as("userScore"), (join) =>
        join
          .onRef("userScore.songId", "=", "m.songId")
          .on("userScore.rn", "=", 1),
      )
      .select([
        "m.songId",
        "m.title",
        "m.notes",
        "m.difficulty",
        "m.difficultyLevel",
        "d.wrScore",
        "d.kaidenAvg",
        "d.coef",
        "userScore.exScore",
        "userScore.bpi",
      ])
      .where("m.difficultyLevel", "=", 12)
      .where("m.difficulty", "in", ["HYPER", "ANOTHER", "LEGGENDARIA"])
      .where("m.releasedVersion", "<=", versionNum)
      .where((eb) =>
        eb.or([eb("m.deletedAt", "is", null), eb("m.deletedAt", ">", version)]),
      )
      .execute();
  }

  /**
   * 最適化結果（メモ）を保存する
   */
  async saveMemo(
    userId: string,
    targetBpi: number,
    reportData: OptimizationResult,
  ) {
    const reportId = uuidv4();

    await db
      .insertInto("optimizeMemo")
      .values({
        reportId,
        userId,
        targetBpi,
        reportData: JSON.stringify(reportData),
      })
      .execute();

    return reportId;
  }

  /**
   * ユーザーのメモ一覧を保存日時の降順で取得する
   */
  async getMemosByUserId(userId: string) {
    const rows = await db
      .selectFrom("optimizeMemo")
      .select(["reportId", "targetBpi", "reportData", "createdAt"])
      .where("userId", "=", userId)
      .orderBy("createdAt", "desc")
      .execute();

    return rows.map((row) => ({
      ...row,
      reportData: JSON.parse(row.reportData) as OptimizationResult,
    }));
  }

  /**
   * 特定のメモを削除する
   */
  async deleteMemo(userId: string, reportId: string) {
    const result = await db
      .deleteFrom("optimizeMemo")
      .where("userId", "=", userId)
      .where("reportId", "=", reportId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }
}

export const bpiOptimizerRepo = new BpiOptimizerRepository();
