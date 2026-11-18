import { db } from "@/lib/db";
import { INFINITAS_VERSION } from "@/constants/iidx/iidxVersions";
import { latestLogIdPerSongSubquery } from "@/lib/db/shared/latestScore/perSong";

/**
 * 全難易度楽曲（allSongs）のうち、指定ユーザー・バージョンで未プレイのものを取得するリポジトリクラス。
 * allSongs と allScores の横断JOINのため aggregates に置く。
 */
class AllScoresUnplayedRepository {
  /**
   * 指定ユーザー・バージョンで未プレイの全難易度楽曲を取得する。INFINITAS 以外のバージョンでは INF 限定曲を含めない。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号文字列
   */
  async getUnplayedAllSongs(userId: string, version: string) {
    return await db
      .selectFrom("allSongs as s")
      .leftJoin(
        latestLogIdPerSongSubquery({
          table: "allScores",
          userId,
          version,
        }).as("latest"),
        (join) => join.onRef("latest.songId", "=", "s.songId"),
      )
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficulty",
        "s.difficultyLevel",
        "s.releasedVersion",
      ])
      .where("latest.songId", "is", null)
      .where("s.deletedAt", "is", null)
      .$if(version !== INFINITAS_VERSION, (qb) =>
        qb.where("s.isInfinitasOnly", "=", 0),
      )
      .orderBy("s.difficultyLevel", "desc")
      .orderBy("s.title", "asc")
      .execute();
  }
}

export const allScoresUnplayedRepo = new AllScoresUnplayedRepository();
