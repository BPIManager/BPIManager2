import { db } from "@/lib/db";
import { sql } from "kysely";
import { latestPerUserSubquery as latestArenaPerUserSubquery } from "@/lib/db/domains/arenaHistory";
import {
  arenaClassIsPublic,
  maskedArenaClass,
} from "@/lib/db/shared/arenaClassVisibility";
import { userStatusLogsReadRepo } from "@/lib/db/domains/userStatusLogs/read";
import { wherePublicOnly } from "@/lib/db/shared/visibility";
import type { RadarFilterKey, RadarFilterRange } from "@/types/users/list";

/**
 * おすすめユーザーの発見・検索。users・userStatusLogs・officialArenaStats・userRadarCache・userRoles を横断する複合ビューを組み立てる。
 */
class UserDiscoveryRepository {
  /**
   * おすすめユーザーをページネーション付きで取得する。order で distance（BPI差が小さい順）・desc（sortColumn 降順）・newest（登録順）を切り替える。
   *
   * @param params.viewerId - 閲覧者のユーザー ID（自分自身は除外）
   * @param params.viewerValue - 閲覧者の基準値（distance ソート時に使用）
   * @param params.version - バージョン番号
   * @param params.limit - 取得件数
   * @param params.offset - オフセット
   * @param params.searchQuery - ユーザー名または IIDX ID の部分一致検索文字列
   * @param params.sort - ソート列名（totalBpi またはレーダーカテゴリ）
   * @param params.order - ソート方向
   * @param params.filters - レーダーカテゴリ・総合BPIの min/max 範囲絞り込み（全条件AND）
   */
  async getRecommendedUsers(params: {
    viewerId: string;
    viewerValue: number;
    version: string;
    limit: number;
    offset: number;
    searchQuery?: string;
    sort?: string;
    order?: "distance" | "desc" | "newest" | "supporters";
    seed?: number;
    filters?: Partial<Record<RadarFilterKey, RadarFilterRange>>;
  }) {
    const {
      viewerId,
      viewerValue,
      version,
      limit,
      offset,
      searchQuery,
      sort,
      order,
      seed,
      filters,
    } = params;
    const columnMap: Record<string, string> = {
      totalBpi: "usl.totalBpi",
      notes: "r.notes",
      chord: "r.chord",
      peak: "r.peak",
      charge: "r.charge",
      scratch: "r.scratch",
      soflan: "r.soflan",
    };
    const sortColumn =
      sort && columnMap[sort] ? columnMap[sort] : "usl.totalBpi";

    const latestStatusSubquery =
      userStatusLogsReadRepo.latestPerUserSubquery(version);
    const latestArenaSubquery = latestArenaPerUserSubquery(version);

    let query = db
      .selectFrom("users as u")
      .innerJoin("userRadarCache as r", "u.userId", "r.userId")
      .innerJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
      .innerJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .leftJoin(latestArenaSubquery.as("la"), "u.userId", "la.userId")
      .leftJoin("officialArenaStats as oas", "la.maxId", "oas.id")
      .leftJoin("statsPrivacy as sp", "sp.userId", "u.userId")
      .leftJoin("userRoles as ur", "ur.userId", "u.userId")
      .select([
        "u.userId",
        "u.userName",
        "u.iidxId",
        "u.profileImage",
        "u.profileText",
        maskedArenaClass.as("arenaClass"),
        "usl.totalBpi",
        "usl.createdAt",
        "r.notes",
        "r.chord",
        "r.peak",
        "r.charge",
        "r.scratch",
        "r.soflan",
        "ur.role",
        "ur.description",
        "ur.grantedAt",
      ])
      .where("r.version", "=", version)
      .$call((qb) => wherePublicOnly(qb, "u.isPublic"));

    if (order !== "supporters") {
      query = query.where("u.userId", "!=", viewerId);
    }

    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      query = query.where((eb) =>
        eb.or([
          eb("u.userName", "like", searchPattern),
          eb("u.iidxId", "like", searchPattern),
        ]),
      );
    }

    if (filters) {
      for (const [key, range] of Object.entries(filters) as [
        RadarFilterKey,
        RadarFilterRange | undefined,
      ][]) {
        if (!range) continue;
        const column = columnMap[key];
        if (!column) continue;
        if (range.min !== undefined) {
          query = query.where(sql.ref(column), ">=", range.min);
        }
        if (range.max !== undefined) {
          query = query.where(sql.ref(column), "<=", range.max);
        }
      }
    }

    if (order === "supporters") {
      query = query
        .where("ur.role", "is not", null)
        .orderBy("ur.grantedAt", "asc");
    } else if (order === "newest") {
      query = query.orderBy("usl.createdAt", "desc");
    } else if (order === "desc") {
      query = query.orderBy(sql.ref(`${sortColumn}`), "desc");
    } else if (seed !== undefined) {
      // BPI50超は50~100固定、それ以外はチョイ負けを対象にライバル候補をシャッフル
      const lo = viewerValue > 50 ? 50 : viewerValue - 3;
      const hi = viewerValue > 50 ? 100 : viewerValue + 5;
      query = query
        .where(sql.ref(sortColumn as string), ">=", lo)
        .where(sql.ref(sortColumn as string), "<=", hi)
        .orderBy(sql`RAND(${seed})`, "asc");
    } else {
      query = query.orderBy(
        sql`ABS(${viewerValue} - ${sql.ref(sortColumn as string)})`,
        "asc",
      );
    }

    return await query.limit(limit).offset(offset).execute();
  }

  /**
   * ユーザー名・IIDX ID・アリーナクラスでユーザーを検索する。
   *
   * 非公開ユーザー(`isPublic !== 1`)は検索対象外。
   *
   * @param params.query - ユーザー名または IIDX ID の部分一致検索文字列
   * @param params.arenaClass - アリーナクラス（皆伝/中伝など）の完全一致フィルタ
   * @param params.version - アリーナクラス・総合BPIを取得する対象バージョン
   * @param params.limit - 取得件数上限
   */
  async searchUsers(params: {
    query?: string;
    arenaClass?: string;
    version: string;
    limit: number;
  }) {
    const { query, arenaClass, version, limit } = params;

    const latestStatusSubquery =
      userStatusLogsReadRepo.latestPerUserSubquery(version);
    const latestArenaSubquery = latestArenaPerUserSubquery(version);

    let dbQuery = db
      .selectFrom("users as u")
      .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
      .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .leftJoin(latestArenaSubquery.as("la"), "u.userId", "la.userId")
      .leftJoin("officialArenaStats as oas", "la.maxId", "oas.id")
      .leftJoin("statsPrivacy as sp", "sp.userId", "u.userId")
      .select([
        "u.userId",
        "u.userName",
        "u.iidxId",
        "u.profileImage",
        "u.profileText",
        maskedArenaClass.as("arenaClass"),
        "usl.totalBpi",
      ])
      .$call((qb) => wherePublicOnly(qb, "u.isPublic"));

    if (query) {
      const searchPattern = `%${query}%`;
      dbQuery = dbQuery.where((eb) =>
        eb.or([
          eb("u.userName", "like", searchPattern),
          eb("u.iidxId", "like", searchPattern),
        ]),
      );
    }

    if (arenaClass) {
      dbQuery = dbQuery
        .where("oas.arenaClass", "=", arenaClass)
        .where(arenaClassIsPublic);
    }

    return await dbQuery.limit(limit).execute();
  }
}

export const userDiscoveryRepo = new UserDiscoveryRepository();
