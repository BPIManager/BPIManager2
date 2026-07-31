import { db } from "@/lib/db";
import {
  SONG_ATTRIBUTES,
  SONG_ATTRIBUTES_GLOBAL,
} from "@/constants/iidx/songAttributes";
import type { AttrMode } from "@/types/songs/songList";
import { IIDXVersion } from "@/types/iidx/version";
import { SongMaster } from "@/types/songs/master";
import { latestVersion } from "@/constants/iidx/iidxVersions";

/**
 * 楽曲情報取得を担当するリポジトリクラス。
 */
class SongsRepository {
  /**
   * 現在有効な曲定義（`songDef.isCurrent = 1`）を結合した楽曲マスタを取得する（BPI計算用）。
   *
   * @returns 楽曲 ID・タイトル・ノーツ数・難易度・皆伝平均・WR スコア・補正係数を含む配列
   */
  async getSongMasterWithDef(): Promise<SongMaster> {
    const result = await db
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
      ])
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
        (qb) =>
          qb
            .selectFrom("songDef")
            .select(["songId", "wrScore", "kaidenAvg", "coef"])
            .where("isCurrent", "=", 1)
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
   * 指定バージョンの楽曲一覧を取得する。
   * songs + songDef (isCurrent=1) + songAttributes を結合して返す。
   *
   * @param version - バージョン番号文字列（例: "33"）
   * @returns 楽曲一覧（属性情報含む）
   */
  async getSongList(version: IIDXVersion) {
    const isInf = version === "INF";
    const versionNum = isInf ? null : parseInt(version, 10);

    return await db
      .selectFrom("songs as s")
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("songDef")
            .select(["songId", "wrScore", "kaidenAvg"])
            .where("isCurrent", "=", 1)
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
        "a.p_scratch",
        "a.p_soflan",
        "a.p_cn",
        "a.p_chord",
        "a.p_intensity",
        "a.p_udeoshi",
        "a.p_delay",
        "a.p_scratch_complex",
        "a.p_tateren",
        "a.p_trill_denim",
        "a.p_peak",
        "a.g_scratch",
        "a.g_soflan",
        "a.g_cn",
        "a.g_chord",
        "a.g_intensity",
        "a.g_udeoshi",
        "a.g_delay",
        "a.g_scratch_complex",
        "a.g_tateren",
        "a.g_trill_denim",
        "a.g_peak",
      ])
      .$if(!isInf, (qb) =>
        qb
          .where("s.releasedVersion", "<=", versionNum!)
          .where((eb) =>
            eb.or([
              eb("s.deletedAt", "is", null),
              eb("s.deletedAt", ">", version),
            ]),
          ),
      )
      .orderBy("s.title", "asc")
      .orderBy("s.difficulty", "asc")
      .execute();
  }

  /**
   * 楽曲マスタをタイトル・難易度・難易度レベルで絞り込み検索する。
   * `getSongList` と異なり属性情報は含まず、軽量なフィールドのみ返す。
   *
   * @param params.version - バージョン番号文字列（例: "33"）
   * @param params.title - 楽曲タイトルの部分一致検索文字列
   * @param params.difficulty - 難易度表記の完全一致（例: "ANOTHER"）
   * @param params.difficultyLevel - 難易度レベルの完全一致
   * @param params.limit - 取得件数上限
   */
  async searchSongs(params: {
    version: IIDXVersion;
    title?: string;
    difficulty?: string;
    difficultyLevel?: number;
    limit: number;
  }) {
    const { version, title, difficulty, difficultyLevel, limit } = params;
    const isInf = version === "INF";
    const versionNum = isInf ? null : parseInt(version, 10);

    let query = db
      .selectFrom("songs as s")
      .select([
        "s.songId",
        "s.title",
        "s.difficulty",
        "s.difficultyLevel",
        "s.notes",
        "s.bpm",
        "s.releasedVersion",
      ])
      .$if(!isInf, (qb) =>
        qb
          .where("s.releasedVersion", "<=", versionNum!)
          .where((eb) =>
            eb.or([
              eb("s.deletedAt", "is", null),
              eb("s.deletedAt", ">", version),
            ]),
          ),
      );

    if (title) {
      query = query.where("s.title", "like", `%${title}%`);
    }
    if (difficulty) {
      query = query.where("s.difficulty", "=", difficulty);
    }
    if (difficultyLevel !== undefined) {
      query = query.where("s.difficultyLevel", "=", difficultyLevel);
    }

    return await query
      .orderBy("s.title", "asc")
      .orderBy("s.difficulty", "asc")
      .limit(limit)
      .execute();
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
        (qb) =>
          qb
            .selectFrom("songDef")
            .select(["songId", "wrScore", "kaidenAvg"])
            .where("isCurrent", "=", 1)
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
        "a.p_scratch",
        "a.p_soflan",
        "a.p_cn",
        "a.p_chord",
        "a.p_intensity",
        "a.p_udeoshi",
        "a.p_delay",
        "a.p_scratch_complex",
        "a.p_tateren",
        "a.p_trill_denim",
        "a.p_peak",
        "a.g_scratch",
        "a.g_soflan",
        "a.g_cn",
        "a.g_chord",
        "a.g_intensity",
        "a.g_udeoshi",
        "a.g_delay",
        "a.g_scratch_complex",
        "a.g_tateren",
        "a.g_trill_denim",
        "a.g_peak",
      ])
      .where("s.songId", "=", songId)
      .executeTakeFirst();
  }

  /**
   * 指定楽曲に属性ベクトルが最も近い楽曲を返す。
   *
   * 6次元ベクトル [p_scratch, p_soflan, p_cn, p_chord, p_intensity, p_udeoshi] を用いて
   * ユークリッド距離を計算し、距離が近い順に返す。
   * 属性データが存在しない楽曲は対象外。
   *
   * @param songId  - 基準楽曲 ID
   * @param version - バージョン番号文字列
   * @param limit   - 返す件数（デフォルト 10）
   */
  async getSimilarSongs(
    songId: number,
    version: IIDXVersion,
    limit = 10,
    mode: AttrMode = "profile",
  ) {
    const isInf = version === "INF";
    const versionNum = isInf ? null : parseInt(version, 10);

    const all = await db
      .selectFrom("songs as s")
      .innerJoin("songAttributes as a", "a.songId", "s.songId")
      .select([
        "s.songId",
        "s.title",
        "s.difficulty",
        "s.difficultyLevel",
        "s.notes",
        "s.bpm",
        "a.p_scratch",
        "a.p_soflan",
        "a.p_cn",
        "a.p_chord",
        "a.p_intensity",
        "a.p_udeoshi",
        "a.p_delay",
        "a.p_scratch_complex",
        "a.p_tateren",
        "a.p_trill_denim",
        "a.p_peak",
        "a.g_scratch",
        "a.g_soflan",
        "a.g_cn",
        "a.g_chord",
        "a.g_intensity",
        "a.g_udeoshi",
        "a.g_delay",
        "a.g_scratch_complex",
        "a.g_tateren",
        "a.g_trill_denim",
        "a.g_peak",
      ])
      .$if(!isInf, (qb) =>
        qb
          .where("s.releasedVersion", "<=", versionNum!)
          .where((eb) =>
            eb.or([
              eb("s.deletedAt", "is", null),
              eb("s.deletedAt", ">", version),
            ]),
          ),
      )
      .execute();

    const target = all.find((s) => s.songId === songId);
    if (!target) return [];

    const DIMS =
      mode === "global"
        ? SONG_ATTRIBUTES_GLOBAL.map((a) => a.dbKey)
        : SONG_ATTRIBUTES.map((a) => a.dbKey);

    const toVec = (s: typeof target): number[] =>
      DIMS.map((d) => (s[d as keyof typeof target] as number | null) ?? 0);

    const targetVec = toVec(target);

    const euclidean = (a: number[], b: number[]): number =>
      Math.sqrt(a.reduce((sum, ai, i) => sum + (ai - b[i]) ** 2, 0));

    return all
      .filter((s) => s.songId !== songId)
      .map((s) => ({ ...s, distance: euclidean(toVec(s), targetVec) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
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

export const songsRepo = new SongsRepository();
