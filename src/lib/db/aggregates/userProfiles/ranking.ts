import { db } from "@/lib/db";
import { sql } from "kysely";
import { latestPerUserSubquery as latestArenaPerUserSubquery } from "@/lib/db/domains/arenaHistory";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";

/**
 * グローバルBPI/レーダーランキングを担当するリポジトリクラス。
 *
 * users・userStatusLogs・officialArenaStats・userRadarCache・statsPrivacy等を
 * 横断してユーザー向けの複合ビューを組み立てる。
 */
class UserRankingRepository {
  /**
   * 全ユーザーの BPI ランキングデータを取得する。
   *
   * `category` が radar カテゴリ（notes/chord/peak/charge/scratch/soflan）の場合は
   * `userRadarCache` を INNER JOIN してそのカテゴリ値で降順ソートする（最新バージョンのみ）。
   * それ以外は `userStatusLogs.totalBpi` で降順ソートする。
   *
   * `filterArea` を指定すると指定エリアのユーザーのみ表示（非公開ユーザーはマスク）。
   * `filterArenaClass` を指定すると指定アリーナクラスのユーザーのみ表示（非公開ユーザーはマスク）。
   *
   * @param version - バージョン番号
   * @param category - ソート対象カテゴリ（デフォルト: "totalBpi"）
   * @param filterArea - 地域フィルタ（県名）
   * @param filterArenaClass - アリーナクラスフィルタ
   */
  async getGlobalRanking(
    version: string,
    category: string = "totalBpi",
    filterArea?: string,
    filterArenaClass?: string,
  ) {
    const RADAR_COLUMNS = [
      "notes",
      "chord",
      "peak",
      "charge",
      "scratch",
      "soflan",
    ] as const;
    const isRadarCategory = (RADAR_COLUMNS as readonly string[]).includes(
      category,
    );

    const hasAreaFilter = Boolean(filterArea);
    const hasArenaClassFilter = Boolean(filterArenaClass);
    const hasFilter = hasAreaFilter || hasArenaClassFilter;

    const latestStatusSubquery =
      userStatusLogsRepo.latestPerUserSubquery(version);
    const latestArenaSubquery = latestArenaPerUserSubquery(version);

    if (isRadarCategory) {
      return await db
        .selectFrom("users as u")
        .innerJoin("userRadarCache as r", (join) =>
          join.onRef("u.userId", "=", "r.userId").on("r.version", "=", version),
        )
        .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
        .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
        .leftJoin(latestArenaSubquery.as("la"), "u.userId", "la.userId")
        .leftJoin("officialArenaStats as oas", "la.maxId", "oas.id")
        .select([
          "u.userId",
          "u.userName",
          "u.profileImage",
          "u.isPublic",
          "u.iidxId",
          "usl.totalBpi",
          "oas.arenaClass",
          "r.notes",
          "r.chord",
          "r.peak",
          "r.charge",
          "r.scratch",
          "r.soflan",
        ])
        .orderBy(sql.ref(`r.${category}`), "desc")
        .execute();
    }

    if (hasFilter) {
      let filteredQuery = db
        .selectFrom("users as u")
        .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
        .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
        .innerJoin(latestArenaSubquery.as("la"), "u.userId", "la.userId")
        .innerJoin("officialArenaStats as oas", "la.maxId", "oas.id")
        .leftJoin("statsPrivacy as sp", "sp.userId", "u.userId")
        .select([
          "u.userId",
          "u.userName",
          "u.profileImage",
          "u.isPublic",
          "u.iidxId",
          "usl.totalBpi",
          "oas.arenaClass",
          "oas.area",
          sql<number>`COALESCE(sp.showArea, 0)`.as("showArea"),
          sql<number>`COALESCE(sp.showArenaClass, 1)`.as("showArenaClass"),
        ])
        .where("usl.id", "is not", null)
        .orderBy(sql`COALESCE(usl.totalBpi, -15)`, "desc");

      if (hasAreaFilter) {
        filteredQuery = filteredQuery.where("oas.area", "=", filterArea!);
      }
      if (hasArenaClassFilter) {
        filteredQuery = filteredQuery.where(
          "oas.arenaClass",
          "=",
          filterArenaClass!,
        );
      }

      return await filteredQuery.execute();
    }

    return await db
      .selectFrom("users as u")
      .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
      .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .leftJoin(latestArenaSubquery.as("la"), "u.userId", "la.userId")
      .leftJoin("officialArenaStats as oas", "la.maxId", "oas.id")
      .select([
        "u.userId",
        "u.userName",
        "u.profileImage",
        "u.isPublic",
        "u.iidxId",
        "usl.totalBpi",
        "oas.arenaClass",
      ])
      .where("usl.id", "is not", null)
      .orderBy(sql`COALESCE(usl.totalBpi, -15)`, "desc")
      .execute();
  }
}

export const userRankingRepo = new UserRankingRepository();
