import { ALL_DIFFICULTIES } from "@/constants/iidx/songLevels";
import { db } from "@/lib/db";
import { AllDifficulties, AllSongWithScore } from "@/types/songs/allSongs";
import { Database } from "@/types/db";
import { Transaction } from "kysely";
import {
  latestLogIdPerSongSubquery,
  latestLogIdPerUserSongScalarSubquery,
} from "@/lib/db/shared/latestScore";
import { getSongRankingFromTable } from "@/lib/db/shared/songRanking";

/**
 * 全難易度スコア（`allScores` テーブル）の参照を担当するリポジトリクラス。
 */
class allScoresRepository {
  /**
   * 全難易度の楽曲一覧を、ユーザーの最新スコアと結合して取得する。
   *
   * 検索・レベル・難易度・クリア状態でフィルタリングでき、
   * `sortKey` と `sortOrder` によるソートに対応する。
   *
   * @param userId - ユーザー ID
   * @param params.search - タイトルの部分一致検索文字列
   * @param params.levels - カンマ区切りの難易度レベル番号（例: `"11,12"`）
   * @param params.difficulties - カンマ区切りの難易度文字列（例: `"ANOTHER,HYPER"`）
   * @param params.clearStates - カンマ区切りのクリア種別（例: `"CLEAR,HARD CLEAR"`）
   * @param params.sortKey - ソートキー（`"level"` | `"title"` | `"exScore"` | `"updatedAt"` | `"clearState"`）
   * @param params.sortOrder - ソート方向（`"asc"` | `"desc"`）
   * @returns スコア情報付きの楽曲リスト
   */
  async getAllScoresList(
    userId: string,
    params: {
      search: string;
      levels: string;
      difficulties: string;
      clearStates: string;
      sortKey: string;
      sortOrder: string;
    },
  ) {
    const {
      search,
      levels,
      difficulties,
      clearStates,
      sortKey = "level",
      sortOrder = "desc",
    } = params;

    let query = db
      .selectFrom("allSongs as s")
      .innerJoin(
        latestLogIdPerSongSubquery({
          table: "allScores",
          userId,
        }).as("latest"),
        (join) => join.onRef("latest.songId", "=", "s.songId"),
      )
      .innerJoin("allScores as a", (join) =>
        join
          .onRef("a.songId", "=", "s.songId")
          .on("a.userId", "=", userId)
          .onRef("a.logId", "=", "latest.maxLogId"),
      )
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficulty",
        "s.difficultyLevel",
        "s.releasedVersion",
        "a.logId",
        "a.exScore",
        "a.clearState",
        "a.missCount",
        "a.lastPlayed",
      ])
      .where((eb) => eb.or([eb("s.deletedAt", "is", null)]));

    if (search && typeof search === "string" && search.trim()) {
      query = query.where("s.title", "like", `%${search.trim()}%`);
    }

    if (levels && typeof levels === "string") {
      const levelArray = levels.split(",").map(Number).filter(Boolean);
      if (levelArray.length > 0) {
        query = query.where("s.difficultyLevel", "in", levelArray);
      }
    }

    if (difficulties && typeof difficulties === "string") {
      const typedDiffArray = difficulties
        .split(",")
        .filter((d): d is AllDifficulties =>
          ALL_DIFFICULTIES.includes(d as AllDifficulties),
        );
      if (typedDiffArray.length > 0) {
        query = query.where("s.difficulty", "in", typedDiffArray);
      }
    }

    if (clearStates && typeof clearStates === "string") {
      const stateArray = clearStates.split(",").filter(Boolean);
      if (stateArray.length > 0) {
        query = query.where("a.clearState", "in", stateArray);
      }
    }

    const order = sortOrder === "asc" ? "asc" : "desc";
    switch (sortKey) {
      case "title":
        query = query.orderBy("s.title", "asc");
        break;
      case "exScore":
        query = query.orderBy("a.exScore", order);
        break;
      case "updatedAt":
        query = query.orderBy("a.lastPlayed", order);
        break;
      case "clearState":
        query = query.orderBy("a.clearState", order);
        break;
      case "level":
      default:
        query = query
          .orderBy("s.difficultyLevel", order)
          .orderBy("s.title", "asc");
        break;
    }

    const rows = await query.execute();

    const results: AllSongWithScore[] = rows.map((r) => ({
      songId: r.songId,
      title: r.title,
      notes: r.notes,
      bpm: r.bpm ?? null,
      difficulty: r.difficulty as AllSongWithScore["difficulty"],
      difficultyLevel: r.difficultyLevel,
      releasedVersion: r.releasedVersion ?? null,
      logId: r.logId ?? null,
      exScore: r.exScore ?? null,
      clearState: r.clearState ?? null,
      missCount: r.missCount ?? null,
      lastPlayed: r.lastPlayed ?? null,
    }));

    return results;
  }

  /**
   * 指定楽曲におけるフォロー中ユーザーの最新スコアリストを取得（allScores テーブル使用）
   */
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
        "u.userId",
        "u.userName",
        "u.profileImage",
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
      .where("u.isPublic", "=", 1)
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
   * 指定楽曲のグローバルランキングを取得する（allScores テーブル使用）
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

  /**
   * 指定楽曲のスコア履歴をバージョンごとにグループ化して取得する。
   *
   * @param userId - ユーザー ID
   * @param songId - 楽曲 ID
   * @returns バージョン文字列をキー、スコアレコード配列を値とするオブジェクト
   */
  async getScoreHistory(userId: string, songId: string) {
    const history = await db
      .selectFrom("allScores")
      .where("userId", "=", userId as string)
      .where("songId", "=", Number(songId))
      .orderBy("lastPlayed", "desc")
      .selectAll()
      .execute();

    return history.reduce(
      (acc, record) => {
        const v = record.version || "unknown";
        if (!acc[v]) {
          acc[v] = [];
        }
        acc[v].push(record);
        return acc;
      },
      {} as Record<string, typeof history>,
    );
  }

  /**
   * 指定バッチに紐づく全難易度スコアレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   * @param batchId - バッチ ID
   */
  async deleteByBatch(
    trx: Transaction<Database>,
    userId: string,
    batchId: string,
  ) {
    await trx
      .deleteFrom("allScores")
      .where("batchId", "=", batchId)
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * ユーザーの全難易度スコアレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx.deleteFrom("allScores").where("userId", "=", userId).execute();
  }
}

export const allScoresRepo = new allScoresRepository();
