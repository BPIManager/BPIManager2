import { db } from "@/lib/db";
import { sql } from "kysely";
import { latestPerUserSubquery as latestArenaPerUserSubquery } from "@/lib/db/domains/arenaHistory";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";

/**
 * おすすめユーザー発見・検索を担当するリポジトリクラス。
 *
 * users・userStatusLogs・officialArenaStats・userRadarCache・userRoles等を
 * 横断してユーザー向けの複合ビューを組み立てる。
 */
class UserDiscoveryRepository {
  /**
   * おすすめユーザーの一覧をページネーション付きで取得する。
   *
   * `order` によりソート方法を制御できる:
   * - `"distance"`: 閲覧者の BPI との差が小さい順
   * - `"desc"`: `sortColumn` 降順
   * - `"newest"`: 最新スコア登録順
   *
   * @param params.viewerId - 閲覧者のユーザー ID（自分自身は除外）
   * @param params.viewerValue - 閲覧者の基準値（"distance" ソート時に使用）
   * @param params.version - バージョン番号
   * @param params.limit - 取得件数
   * @param params.offset - オフセット
   * @param params.searchQuery - ユーザー名または IIDX ID の部分一致検索文字列
   * @param params.sort - ソート列名（`"totalBpi"` | `"notes"` | ... レーダーカテゴリ）
   * @param params.order - ソート方向
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
      userStatusLogsRepo.latestPerUserSubquery(version);
    const latestArenaSubquery = latestArenaPerUserSubquery(version);

    let query = db
      .selectFrom("users as u")
      .innerJoin("userRadarCache as r", "u.userId", "r.userId")
      .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
      .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .leftJoin(latestArenaSubquery.as("la"), "u.userId", "la.userId")
      .leftJoin("officialArenaStats as oas", "la.maxId", "oas.id")
      .leftJoin("userRoles as ur", "ur.userId", "u.userId")
      .select([
        "u.userId",
        "u.userName",
        "u.iidxId",
        "u.profileImage",
        "u.profileText",
        "oas.arenaClass",
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
      .where("u.isPublic", "=", 1);

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
      userStatusLogsRepo.latestPerUserSubquery(version);
    const latestArenaSubquery = latestArenaPerUserSubquery(version);

    let dbQuery = db
      .selectFrom("users as u")
      .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
      .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .leftJoin(latestArenaSubquery.as("la"), "u.userId", "la.userId")
      .leftJoin("officialArenaStats as oas", "la.maxId", "oas.id")
      .select([
        "u.userId",
        "u.userName",
        "u.iidxId",
        "u.profileImage",
        "u.profileText",
        "oas.arenaClass",
        "usl.totalBpi",
      ])
      .where("u.isPublic", "=", 1);

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
      dbQuery = dbQuery.where("oas.arenaClass", "=", arenaClass);
    }

    return await dbQuery.limit(limit).execute();
  }
}

export const userDiscoveryRepo = new UserDiscoveryRepository();
