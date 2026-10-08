import { db } from "@/lib/db";
import { latestSongDefIdSubquery } from "@/lib/db/shared/songDef";

/**
 * プレイヤーが1位を獲得している譜面の一覧。
 * BPI算出用の定義はLEVEL 11/12のみ存在する`songs`/`songDef`側からtitle+difficultyで引く
 * （topRankersは全難易度の`allSongs`を参照するため）。
 */
export const topRankersListRepo = {
  async getListByVersion(iidxId: string, version: string) {
    return await db
      .selectFrom("topRankers as t")
      .innerJoin("allSongs as s", "s.songId", "t.songId")
      .leftJoin("songs as bs", (join) =>
        join.onRef("bs.title", "=", "s.title").onRef("bs.difficulty", "=", "s.difficulty"),
      )
      .leftJoin(
        () => latestSongDefIdSubquery().as("latest_sd"),
        (join) => join.onRef("latest_sd.l_defSongId", "=", "bs.songId"),
      )
      .leftJoin("songDef as sd", "sd.defId", "latest_sd.maxDefId")
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficulty",
        "s.difficultyLevel",
        "s.releasedVersion",
        "t.areaId",
        "t.exScore",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
        "sd.mu",
        "sd.sigma",
        "sd.residualVar",
      ])
      .where("t.iidxId", "=", iidxId)
      .where("t.version", "=", version)
      .execute();
  },
};
