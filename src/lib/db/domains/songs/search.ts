import { db } from "@/lib/db";
import { SONG_ATTRIBUTES, SONG_ATTRIBUTES_GLOBAL } from "@/constants/iidx/songAttributes";
import type { AttrMode } from "@/types/songs/songList";
import { IIDXVersion } from "@/types/iidx/version";

import { currentSongDefSubquery } from "@/lib/db/shared/songDef";
import { SONG_ATTRIBUTE_SELECT_COLUMNS } from "@/lib/db/shared/songAttributes";

/**
 * 楽曲の一覧・検索・類似曲・レベル別メタ情報の取得を担当するリポジトリクラス。
 */
class SongSearchRepository {
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
        () =>
          currentSongDefSubquery()
            .select(["songId", "wrScore", "kaidenAvg", "coef", "mu", "sigma", "residualVar"])
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
        "def.coef",
        "def.mu",
        "def.sigma",
        "def.residualVar",
        ...SONG_ATTRIBUTE_SELECT_COLUMNS,
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
      .leftJoin(
        currentSongDefSubquery()
          .select(["songId", "wrScore", "kaidenAvg", "coef", "mu", "sigma", "residualVar"])
          .as("d"),
        (join) => join.onRef("d.songId", "=", "s.songId"),
      )
      .select([
        "s.songId",
        "s.title",
        "s.difficulty",
        "s.difficultyLevel",
        "s.notes",
        "s.bpm",
        "s.releasedVersion",
        "d.wrScore",
        "d.kaidenAvg",
        "d.coef",
        "d.mu",
        "d.sigma",
        "d.residualVar",
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
        ...SONG_ATTRIBUTE_SELECT_COLUMNS,
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
   * 難易度レベル・難易度表記で絞り込んだ楽曲の songId/title/difficulty のみを返す（軽量メタ情報）。
   */
  async getMetaByLevelAndDifficulties(
    level: number,
    difficulties: readonly string[],
  ) {
    return await db
      .selectFrom("songs as m")
      .leftJoin(
        () =>
          currentSongDefSubquery()
            .select(["songId", "wrScore", "kaidenAvg", "coef", "mu", "sigma", "residualVar"])
            .as("def"),
        (join) => join.onRef("def.songId", "=", "m.songId"),
      )
      .select([
        "m.songId",
        "m.title",
        "m.difficulty",
        "m.notes",
        "def.wrScore",
        "def.kaidenAvg",
        "def.coef",
        "def.mu",
        "def.sigma",
        "def.residualVar",
      ])
      .where("m.difficultyLevel", "=", level)
      .where("m.difficulty", "in", difficulties as string[])
      .execute();
  }
}

export const songSearchRepo = new SongSearchRepository();
