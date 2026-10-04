import { db } from "@/lib/db";
import { sql } from "kysely";
import { latestPerUserSubquery as latestArenaPerUserSubquery } from "@/lib/db/domains/arenaHistory";
import {
  arenaClassIsPublic,
  maskedArenaClass,
} from "@/lib/db/shared/arenaClassVisibility";
import { userStatusLogsReadRepo } from "@/lib/db/domains/userStatusLogs/read";

/**
 * グローバル BPI・レーダーランキング。users・userStatusLogs・officialArenaStats・userRadarCache・statsPrivacy を横断する複合ビュー。
 */
class UserRankingRepository {
  /**
   * 全ユーザーの BPI ランキング。radar カテゴリ指定時は userRadarCache を INNER JOIN し（最新バージョンのみ）、それ以外は userStatusLogs.totalBpi で降順にする。
   * filterArea・filterArenaClass は該当ユーザーのみ表示し、非公開ユーザーはマスクする。
   *
   * @param version - バージョン番号
   * @param category - ソート対象カテゴリ（デフォルト: totalBpi）
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
      userStatusLogsReadRepo.latestPerUserSubquery(version);
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
        .leftJoin("statsPrivacy as sp", "sp.userId", "u.userId")
        .select([
          "u.userId",
          "u.userName",
          "u.profileImage",
          "u.isPublic",
          "u.iidxId",
          "usl.totalBpi",
          maskedArenaClass.as("arenaClass"),
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
          maskedArenaClass.as("arenaClass"),
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
        filteredQuery = filteredQuery
          .where("oas.arenaClass", "=", filterArenaClass!)
          .where(arenaClassIsPublic);
      }

      return await filteredQuery.execute();
    }

    return await db
      .selectFrom("users as u")
      .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
      .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .leftJoin(latestArenaSubquery.as("la"), "u.userId", "la.userId")
      .leftJoin("officialArenaStats as oas", "la.maxId", "oas.id")
      .leftJoin("statsPrivacy as sp", "sp.userId", "u.userId")
      .select([
        "u.userId",
        "u.userName",
        "u.profileImage",
        "u.isPublic",
        "u.iidxId",
        "usl.totalBpi",
        maskedArenaClass.as("arenaClass"),
      ])
      .where("usl.id", "is not", null)
      .orderBy(sql`COALESCE(usl.totalBpi, -15)`, "desc")
      .execute();
  }
}

export const userRankingRepo = new UserRankingRepository();
