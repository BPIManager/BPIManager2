import { db } from "@/lib/db";
import { latestSongDefIdSubquery } from "@/lib/db/shared/songDef";

/**
 * 指定バージョン・エリアの各譜面の1位スコア（プレイヤーが特定できないものも含む）。
 * 比較対象はBPI算出対象の`songs`（LEVEL 11/12）に限るため、`allSongs`の譜面をtitle+difficultyで`songs`へ引き直す。
 */
export const topRankersAreaScoresRepo = {
  async getAreaScores(version: string, areaId: number) {
    return await db
      .selectFrom("topRankers as t")
      .innerJoin("allSongs as s", "s.songId", "t.songId")
      .innerJoin("songs as bs", (join) =>
        join.onRef("bs.title", "=", "s.title").onRef("bs.difficulty", "=", "s.difficulty"),
      )
      .leftJoin(
        () => latestSongDefIdSubquery().as("latest_sd"),
        (join) => join.onRef("latest_sd.l_defSongId", "=", "bs.songId"),
      )
      .leftJoin("songDef as sd", "sd.defId", "latest_sd.maxDefId")
      .select([
        "bs.songId",
        "bs.title",
        "bs.difficulty",
        "bs.difficultyLevel",
        "bs.notes",
        "t.exScore",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
        "sd.mu",
        "sd.sigma",
        "sd.residualVar",
      ])
      .where("t.version", "=", version)
      .where("t.areaId", "=", areaId)
      .execute();
  },
};
