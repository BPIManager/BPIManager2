import { db } from "@/lib/db";
import {
  SONG_ATTRIBUTES,
  SONG_ATTRIBUTES_GLOBAL,
} from "@/constants/songAttributes";
import type { AttrMode } from "@/types/songs/songList";
import { IIDXVersion } from "@/types/iidx/version";

/**
 * 楽曲情報取得を担当するリポジトリクラス。
 */
class SongsRepository {
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
}

export const songsRepo = new SongsRepository();
