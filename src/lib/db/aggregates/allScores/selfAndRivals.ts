import { db } from "@/lib/db";
import { AllDifficulties } from "@/types/songs/allSongs";
import { SongWithScore } from "@/types/songs/score";
import { correlatedLatestLogId } from "@/lib/db/shared/latestScore/correlated";
import { latestLogIdPerUserSongScalarSubquery } from "@/lib/db/shared/latestScore/perUser";
import { userDisplayColumns } from "@/lib/db/shared/userDisplay";
import { wherePublicOnly } from "@/lib/db/shared/visibility";
import { getSongRankingFromTable } from "@/lib/db/aggregates/songRanking";

/**
 * 全難易度スコアの自己バージョン比較・ライバル比較・曲別ランキングを担当するリポジトリクラス。
 */
class AllScoresSelfRivalRepository {
  /**
   * 全難易度楽曲について、`currentVersion`時点のスコアと`targetVersion`時点の
   * スコアを比較する。`/my/[version]`の`getSelfVersionScores`
   * （`songs`/`scores`テーブル対象）と同一の相関サブクエリパターンを
   * `allSongs`/`allScores`テーブル向けに適用する。
   * ☆10以下含む全曲がBPI算出対象外のため、BPI差分は扱わずexScore差分のみ返す。
   *
   * @param params.userId - 対象ユーザーID
   * @param params.currentVersion - 表示中バージョン
   * @param params.targetVersion - 比較対象バージョン
   * @returns `currentVersion`時点・`targetVersion`時点のスコアを併記した楽曲リスト
   */
  async getSelfVersionScores(params: {
    userId: string;
    currentVersion: string;
    targetVersion: string;
  }) {
    const { userId, currentVersion, targetVersion } = params;

    const rows = await db
      .selectFrom("allSongs as s")
      .leftJoin("allScores as cur", (join) =>
        join
          .onRef("cur.songId", "=", "s.songId")
          .on("cur.userId", "=", userId)
          .on("cur.version", "=", currentVersion)
          .on("cur.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "allScores",
              alias: "c2",
              songIdRef: "s.songId",
              version: currentVersion,
              userId,
            }),
          ),
      )
      .leftJoin("allScores as prev", (join) =>
        join
          .onRef("prev.songId", "=", "s.songId")
          .on("prev.userId", "=", userId)
          .on("prev.version", "=", targetVersion)
          .on("prev.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "allScores",
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
        "cur.clearState as myClearState",
        "cur.missCount as myMissCount",
        "cur.lastPlayed as myLastPlayed",
        "prev.exScore as prevExScore",
        "prev.clearState as prevClearState",
        "prev.missCount as prevMissCount",
        "prev.lastPlayed as prevLastPlayed",
      ])
      .where((eb) => eb.or([eb("s.deletedAt", "is", null)]))
      .where((eb) =>
        eb.or([
          eb("cur.exScore", "is not", null),
          eb("prev.exScore", "is not", null),
        ]),
      )
      .orderBy("s.difficultyLevel", "desc")
      .orderBy("s.title", "asc")
      .execute();

    return rows.map((row) => {
      const myEx = row.myExScore ?? null;
      const prevEx = row.prevExScore ?? null;

      const result: SongWithScore = {
        songId: row.songId,
        title: row.title,
        notes: row.notes,
        bpm: row.bpm ?? null,
        difficulty: row.difficulty as AllDifficulties,
        difficultyLevel: row.difficultyLevel,
        releasedVersion: row.releasedVersion ? Number(row.releasedVersion) : null,
        logId: null,
        exScore: myEx,
        clearState: row.myClearState ?? null,
        missCount: row.myMissCount ?? null,
        scoreAt: row.myLastPlayed ?? null,
        kaidenAvg: null,
        wrScore: null,
        rival: {
          exScore: prevEx,
          bpi: null,
          clearState: row.prevClearState ?? null,
          missCount: row.prevMissCount ?? null,
          lastPlayed: row.prevLastPlayed ?? null,
        },
        exDiff: myEx !== null && prevEx !== null ? myEx - prevEx : undefined,
      };
      return result;
    });
  }

  /**
   * 指定楽曲におけるフォロー中ユーザーの最新スコアリストを取得（allScores テーブル使用）
   */
  // 呼び出し元(all-scores/[songId]/rivals.ts)は`viewerId`にURLの[userId]
  // (第三者が閲覧している可能性のある対象ユーザー)をそのまま渡すため、
  // 「followsの存在=閲覧者本人への閲覧許可」の前提が成立しない。
  // isPublicによる絞り込みを維持する

  async getRivalScoresForAllSong(params: {
    viewerId: string;
    songId: number;
    version: string;
  }) {
    const { viewerId, songId, version } = params;

    return await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "f.followingId", "u.userId")
      .innerJoin("allScores as s", "u.userId", "s.userId")
      .innerJoin("allSongs as m", "s.songId", "m.songId")
      .select([
        ...userDisplayColumns("u"),
        "s.exScore",
        "s.bpi",
        "s.clearState",
        "s.lastPlayed",
        "s.logId",
        "m.title",
        "m.difficulty",
        "m.notes",
      ])
      .where("f.followerId", "=", viewerId)
      .where("s.songId", "=", songId)
      .where("s.version", "=", version)
      .$call((qb) => wherePublicOnly(qb, "u.isPublic"))
      .where(
        "s.logId",
        "in",
        latestLogIdPerUserSongScalarSubquery({
          table: "allScores",
          version,
          songIds: [songId],
        }),
      )
      .orderBy("s.exScore", "desc")
      .execute();
  }

  /**
   * 指定楽曲のユーザー別ランキング（allScoresテーブル）を取得する。
   * 非公開ユーザーの匿名化・閲覧者自身の判定は `getSongRankingFromTable` が行う。
   *
   * @param songId - 楽曲 ID
   * @param version - バージョン番号
   * @param viewerId - 閲覧者のユーザー ID（自分自身の判定に使用）
   */
  async getAllSongRanking(songId: number, version: string, viewerId: string) {
    return getSongRankingFromTable({
      table: "allScores",
      songId,
      version,
      viewerId,
    });
  }
}

export const allScoresSelfRivalRepo = new AllScoresSelfRivalRepository();
