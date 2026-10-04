import { db } from "@/lib/db";
import type { Transaction } from "kysely";
import type { Database } from "@/types/db";

import { IIDXVersion } from "@/types/iidx/version";
import { SongMaster } from "@/types/songs/master";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { currentSongDefSubquery } from "@/lib/db/shared/songDef";
import { SONG_ATTRIBUTE_SELECT_COLUMNS } from "@/lib/db/shared/songAttributes";

/**
 * `songs` / `songDef` テーブルの楽曲マスタ・現行定義の参照を担当するリポジトリクラス。
 */
class SongMasterRepository {
  /**
   * 現在有効な曲定義（`songDef.isCurrent = 1`）を結合した楽曲マスタを取得する（BPI計算用）。
   *
   * @returns 楽曲 ID・タイトル・ノーツ数・難易度・皆伝平均・WR スコア・補正係数を含む配列
   */
  async getSongMasterWithDef(
    trx?: Transaction<Database>,
  ): Promise<SongMaster> {
    const result = await (trx ?? db)
      .selectFrom("songs as s")
      .innerJoin("songDef as sd", (join) =>
        join.onRef("sd.songId", "=", "s.songId").on("sd.isCurrent", "=", 1),
      )
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.difficulty",
        "s.difficultyLevel",
        "sd.defId",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
        "sd.mu",
        "sd.sigma",
        "sd.residualVar",
      ])
      .where((eb) =>
        eb.or([
          eb("s.deletedAt", "is", null),
          eb("s.deletedAt", ">", latestVersion),
        ]),
      )
      .execute();
    return result as SongMaster;
  }

  /**
   * title + difficulty で楽曲と最新 songDef を取得する（BPI計算用）。
   * 削除済み楽曲は除外。
   */
  async getSongWithDefByTitleDifficulty(title: string, difficulty: string) {
    return await db
      .selectFrom("songs as s")
      .leftJoin(
        () =>
          currentSongDefSubquery()
            .select(["songId", "wrScore", "kaidenAvg", "coef", "mu", "sigma", "residualVar"])
            .as("def"),
        (join) => join.onRef("def.songId", "=", "s.songId"),
      )
      .select([
        "s.songId",
        "s.title",
        "s.difficulty",
        "s.difficultyLevel",
        "s.notes",
        "def.wrScore",
        "def.kaidenAvg",
        "def.coef",
        "def.mu",
        "def.sigma",
        "def.residualVar",
      ])
      .where("s.title", "=", title)
      .where("s.difficulty", "=", difficulty)
      .where((eb) =>
        eb.or([
          eb("s.deletedAt", "is", null),
          eb("s.deletedAt", ">", latestVersion),
        ]),
      )
      .executeTakeFirst();
  }

  /**
   * 指定 songId の楽曲詳細を取得する。
   *
   * @param songId - 楽曲 ID
   * @returns 楽曲詳細（属性情報含む）、存在しない場合は undefined
   */
  async getSongById(songId: number) {
    return await db
      .selectFrom("songs as s")
      .leftJoin(
        () =>
          currentSongDefSubquery()
            .select(["songId", "wrScore", "kaidenAvg"])
            .as("def"),
        (join) => join.onRef("def.songId", "=", "s.songId"),
      )
      .leftJoin("songAttributes as a", "a.songId", "s.songId")
      .select([
        "s.songId",
        "s.title",
        "s.difficulty",
        "s.difficultyLevel",
        "s.notes",
        "s.bpm",
        "s.textage",
        "def.wrScore",
        "def.kaidenAvg",
        ...SONG_ATTRIBUTE_SELECT_COLUMNS,
      ])
      .where("s.songId", "=", songId)
      .executeTakeFirst();
  }

  /**
   * 指定楽曲のタイトル・難易度・難易度レベルのみを取得する（軽量メタ情報）。
   */
  async getTitleDifficultyLevel(songId: number) {
    return await db
      .selectFrom("songs")
      .select(["title", "difficulty", "difficultyLevel"])
      .where("songId", "=", songId)
      .executeTakeFirst();
  }

  /**
   * 現在有効な曲定義（`songDef.isCurrent = 1`）とタイトル・難易度・ノーツ数を結合して取得する（メトリクス生成用）。
   */
  async getCurrentDefsWithSongInfo() {
    return await db
      .selectFrom("songDef as sd")
      .innerJoin("songs as s", "s.songId", "sd.songId")
      .select([
        "s.title",
        "s.difficulty",
        "s.notes",
        "sd.kaidenAvg",
        "sd.wrScore",
        "sd.coef",
        "sd.mu",
        "sd.sigma",
        "sd.residualVar",
      ])
      .where("sd.isCurrent", "=", 1)
      .execute();
  }

  /**
   * 全楽曲のタイトル・難易度・ノーツ数を取得する（メトリクス生成用）。
   */
  async getAllTitleDifficultyNotes() {
    return await db
      .selectFrom("songs")
      .select(["title", "difficulty", "notes"])
      .execute();
  }

  /**
   * 難易度レベル・難易度表記で絞り込んだ楽曲の総数を返す。
   */
  async getCount(levels: number[], difficulties: string[]): Promise<number> {
    let query = db
      .selectFrom("songs")
      .select((eb) => eb.fn.count("songId").as("count"));

    if (levels.length > 0) query = query.where("difficultyLevel", "in", levels);
    if (difficulties.length > 0)
      query = query.where("difficulty", "in", difficulties);

    const result = await query.executeTakeFirst();
    return Number(result?.count || 0);
  }

  /**
   * 指定バージョン・難易度レベル・難易度表記で絞り込んだ楽曲の title/difficulty ペアを返す。
   */
  async getFilteredTitleDifficultyPairs(
    version: IIDXVersion,
    levels?: number[],
    difficulties?: string[],
  ) {
    const isInf = version === "INF";
    const versionNum = isInf ? null : parseInt(version);

    let query = db
      .selectFrom("songs as m")
      .select(["m.title", "m.difficulty"])
      .$if(!isInf, (qb) =>
        qb
          .where("m.releasedVersion", "<=", versionNum!)
          .where((eb) =>
            eb.or([
              eb("m.deletedAt", "is", null),
              eb("m.deletedAt", ">", version),
            ]),
          ),
      );

    if (levels && levels.length > 0) {
      query = query.where("m.difficultyLevel", "in", levels);
    }
    if (difficulties && difficulties.length > 0) {
      query = query.where("m.difficulty", "in", difficulties);
    }

    return await query.execute();
  }
}

export const songMasterRepo = new SongMasterRepository();
