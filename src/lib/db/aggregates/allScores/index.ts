import { ALL_DIFFICULTIES } from "@/constants/iidx/songLevels";
import { db } from "@/lib/db";
import { AllDifficulties, AllSongWithScore } from "@/types/songs/allSongs";
import {
  latestLogIdPerSongSubquery,
  latestLogIdPerUserSongScalarSubquery,
} from "@/lib/db/shared/latestScore";
import { userDisplayColumns } from "@/lib/db/shared/userDisplay";

/**
 * `allScores`/`allSongs`（全難易度スコア・楽曲マスタ）をまたぐ複合ビューを
 * 組み立てるリポジトリクラス。
 *
 * `allSongs`ドメインは「他ドメインから直接クエリせず本リポジトリ経由で
 * 行う方針」を明示しているため、`allSongs`を横断JOINするこれらのクエリは
 * `domains/allScores`ではなくここに置く（#171）。
 */
class AllScoresAggregateRepository {
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
}

export const allScoresAggregateRepo = new AllScoresAggregateRepository();
