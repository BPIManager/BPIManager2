import { db } from "@/lib/db";
import { IIDXVersion } from "@/types/iidx/version";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { latestLogIdPerSongSubquery } from "@/lib/db/shared/latestScore";

/**
 * BPI最適化機能向けに、`songs`・`songDef`・`scores` を横断してBPI対象楽曲一覧と
 * ユーザーの最新スコアを組み立てるリポジトリクラス。
 */
class BpiOptimizerAggregateRepository {
  /**
   * 指定バージョンの全BPI対象楽曲（☆11/☆12、HYPER/ANOTHER/LEGGENDARIA）と
   * ユーザーの最新スコアをLEFT JOINで取得する。
   *
   * 未プレイ楽曲もNULLスコアとして含まれる。
   *
   * @param userId - ユーザーID
   * @param version - バージョン番号
   */
  async getAllSongsWithUserScores(userId: string, version: IIDXVersion) {
    const isInf = version === "INF";
    const versionNum = isInf ? null : parseInt(version);
    const latestLogIds = latestLogIdPerSongSubquery({
      table: "scores",
      userId,
      version,
    });

    return db
      .selectFrom("songs as m")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .leftJoin(latestLogIds.as("latest"), (join) =>
        join.onRef("latest.songId", "=", "m.songId"),
      )
      .leftJoin("scores as userScore", (join) =>
        join.onRef("userScore.logId", "=", "latest.maxLogId"),
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
      .where("m.difficulty", "in", IIDX_DIFFICULTIES)
      .$if(!isInf, (qb) =>
        qb
          .where("m.releasedVersion", "<=", versionNum!)
          .where((eb) =>
            eb.or([
              eb("m.deletedAt", "is", null),
              eb("m.deletedAt", ">", version),
            ]),
          ),
      )
      .execute();
  }
}

export const bpiOptimizerAggregateRepo = new BpiOptimizerAggregateRepository();
