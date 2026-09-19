import { db } from "@/lib/db";
import { IIDXVersion } from "@/types/iidx/version";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { latestVersion } from "@/constants/iidx/iidxVersions";
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
        "m.bpm",
        "m.difficulty",
        "m.difficultyLevel",
        "d.wrScore",
        "d.kaidenAvg",
        "d.coef",
        "d.mu",
        "d.sigma",
        "d.residualVar",
        "userScore.exScore",
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

  /**
   * 全BPI対象楽曲について、バージョンを横断したユーザーの自己歴代最高EXスコアを
   * LEFT JOINで取得する（「自己歴代のみを参照」オプション向け）。
   *
   * 未プレイ楽曲もNULLスコアとして含まれる。現行バージョンで既に削除された楽曲は除く。
   *
   * @param userId - ユーザーID
   */
  async getAllSongsWithSelfBestScores(userId: string) {
    const bestPerSong = db
      .selectFrom("scores as sc")
      .select(["sc.songId", (eb) => eb.fn.max("sc.exScore").as("bestExScore")])
      .where("sc.userId", "=", userId)
      .groupBy("sc.songId")
      .as("best");

    return db
      .selectFrom("songs as m")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .leftJoin(bestPerSong, (join) =>
        join.onRef("best.songId", "=", "m.songId"),
      )
      .select([
        "m.songId",
        "m.title",
        "m.notes",
        "m.bpm",
        "m.difficulty",
        "m.difficultyLevel",
        "d.wrScore",
        "d.kaidenAvg",
        "d.coef",
        "d.mu",
        "d.sigma",
        "d.residualVar",
        "best.bestExScore as exScore",
      ])
      .where("m.difficultyLevel", "=", 12)
      .where("m.difficulty", "in", IIDX_DIFFICULTIES)
      .where((eb) =>
        eb.or([
          eb("m.deletedAt", "is", null),
          eb("m.deletedAt", ">", latestVersion),
        ]),
      )
      .execute();
  }
}

export const bpiOptimizerAggregateRepo = new BpiOptimizerAggregateRepository();
