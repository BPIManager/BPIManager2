import { db } from "@/lib/db";
import { sql } from "kysely";

/**
 * ユーザープロフィールの参照・作成・更新を担当するリポジトリクラス。
 */
class UsersRepository {
  /**
   * 指定ユーザー名が既に使用されているか確認する。
   *
   * @param userName - チェックするユーザー名
   * @returns 同名ユーザーのレコード（存在しない場合は `undefined`）
   */
  async checkUserNameAvailability(userName: string) {
    return await db
      .selectFrom("users")
      .select("userId")
      .where("userName", "=", userName)
      .executeTakeFirst();
  }

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
    order?: "distance" | "desc" | "newest";
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

    const latestStatusSubquery = db
      .selectFrom("userStatusLogs")
      .select((eb) => ["userId", eb.fn.max("id").as("maxId")])
      .where("version", "=", version)
      .groupBy("userId");

    let query = db
      .selectFrom("users as u")
      .innerJoin("userRadarCache as r", "u.userId", "r.userId")
      .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
      .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .leftJoin("userRoles as ur", "ur.userId", "u.userId")
      .select([
        "u.userId",
        "u.userName",
        "u.iidxId",
        "u.profileImage",
        "u.profileText",
        "usl.arenaRank",
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
      .where("u.isPublic", "=", 1)
      .where("u.userId", "!=", viewerId);

    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      query = query.where((eb) =>
        eb.or([
          eb("u.userName", "like", searchPattern),
          eb("u.iidxId", "like", searchPattern),
        ]),
      );
    }

    if (order === "newest") {
      query = query.orderBy("usl.createdAt", "desc");
    } else if (order === "desc") {
      query = query.orderBy(sql.ref(`${sortColumn}`), "desc");
    } else {
      query = query.orderBy(
        sql`ABS(${viewerValue} - ${sql.ref(sortColumn as string)})`,
        "asc",
      );
    }

    return await query.limit(limit).offset(offset).execute();
  }

  /**
   * 全ユーザーの BPI ランキングデータを取得する。
   *
   * `category` が radar カテゴリ（notes/chord/peak/charge/scratch/soflan）の場合は
   * `userRadarCache` を INNER JOIN してそのカテゴリ値で降順ソートする（最新バージョンのみ）。
   * それ以外は `userStatusLogs.totalBpi` で降順ソートする。
   *
   * @param version - バージョン番号
   * @param category - ソート対象カテゴリ（デフォルト: "totalBpi"）
   */
  async getGlobalRanking(version: string, category: string = "totalBpi") {
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

    const latestStatusSubquery = db
      .selectFrom("userStatusLogs")
      .select(["userId", (eb) => eb.fn.max("id").as("maxId")])
      .where("version", "=", version)
      .groupBy("userId");

    if (isRadarCategory) {
      return await db
        .selectFrom("users as u")
        .innerJoin("userRadarCache as r", (join) =>
          join.onRef("u.userId", "=", "r.userId").on("r.version", "=", version),
        )
        .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
        .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
        .select([
          "u.userId",
          "u.userName",
          "u.profileImage",
          "u.isPublic",
          "u.iidxId",
          "usl.totalBpi",
          "usl.arenaRank",
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

    return await db
      .selectFrom("users as u")
      .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
      .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .select([
        "u.userId",
        "u.userName",
        "u.profileImage",
        "u.isPublic",
        "u.iidxId",
        "usl.totalBpi",
        "usl.arenaRank",
      ])
      .where("usl.id", "is not", null)
      .orderBy(
        (eb) => eb.fn("coalesce", [eb.ref("usl.totalBpi"), eb.val(-15)]),
        "desc",
      )
      .execute();
  }

  private async getRelationship(myId: string, targetId: string) {
    const follow = await db
      .selectFrom("follows")
      .select("id")
      .where("followerId", "=", myId)
      .where("followingId", "=", targetId)
      .executeTakeFirst();
    const followedBy = await db
      .selectFrom("follows")
      .select("id")
      .where("followerId", "=", targetId)
      .where("followingId", "=", myId)
      .executeTakeFirst();
    return {
      isFollowing: !!follow,
      isFollowedBy: !!followedBy,
      isMutual: !!follow && !!followedBy,
    };
  }

  /**
   * ユーザープロフィールの全情報を取得する。
   *
   * フォロワー数・フォロー中数・フォロー関係・バージョン別ステータス履歴を含む。
   *
   * @param userId - 取得対象のユーザー ID
   * @param myId - 閲覧者のユーザー ID（フォロー関係の判定に使用、省略時はゲスト扱い）
   * @returns プロフィールオブジェクト、ユーザーが存在しない場合は `null`
   */
  async getUserProfileSummary(userId: string, myId?: string) {
    const userBase = await db
      .selectFrom("users as u")
      .leftJoin("userRoles as ur", "ur.userId", "u.userId")
      .select([
        "u.userId",
        "u.userName",
        "u.profileText",
        "u.profileImage",
        "u.iidxId",
        "u.xId",
        "u.isPublic",
        "ur.role",
        "ur.description",
        "ur.grantedAt",
        (eb) =>
          eb
            .selectFrom("follows")
            .select(eb.fn.countAll<number>().as("count"))
            .where("followingId", "=", userId)
            .as("followerCount"),
        (eb) =>
          eb
            .selectFrom("follows")
            .select(eb.fn.countAll<number>().as("count"))
            .where("followerId", "=", userId)
            .as("followingCount"),
        (eb) =>
          eb
            .selectFrom("follows")
            .select(eb.fn.countAll<number>().as("count"))
            .where("followerId", "=", myId ?? "GUEST")
            .where("followingId", "=", userId)
            .as("isFollowing"),
        (eb) =>
          eb
            .selectFrom("follows")
            .select(eb.fn.countAll<number>().as("count"))
            .where("followerId", "=", userId)
            .where("followingId", "=", myId ?? "GUEST")
            .as("isFollowedBy"),
      ])
      .where("u.userId", "=", userId)
      .executeTakeFirst();

    if (!userBase) return null;

    const history = await db
      .selectFrom("userStatusLogs as usl")
      .innerJoin(
        (eb) =>
          eb
            .selectFrom("userStatusLogs")
            .select(["version", (sub) => sub.fn.max("id").as("maxId")])
            .where("userId", "=", userId)
            .groupBy("version")
            .as("latest"),
        (join) => join.onRef("usl.id", "=", "latest.maxId"),
      )
      .select(["usl.version", "usl.totalBpi", "usl.arenaRank", "usl.updatedAt"])
      .orderBy("usl.version", "desc")
      .execute();

    const formattedHistory = history.map((h) => ({
      ...h,
      totalBpi: Number(h.totalBpi),
    }));

    return {
      userId: userBase.userId,
      userName: userBase.userName,
      profileText: userBase.profileText,
      profileImage: userBase.profileImage,
      iidxId: userBase.iidxId,
      xId: userBase.xId,
      isPublic: userBase.isPublic,
      follows: {
        followers: Number(userBase.followerCount ?? 0),
        following: Number(userBase.followingCount ?? 0),
      },
      relationship: {
        isFollowing: Number(userBase.isFollowing ?? 0) > 0,
        isFollowedBy: Number(userBase.isFollowedBy ?? 0) > 0,
        isMutual:
          Number(userBase.isFollowing ?? 0) > 0 &&
          Number(userBase.isFollowedBy ?? 0) > 0,
        isSelf: userBase.userId === myId,
      },
      role: userBase.role
        ? {
            role: userBase.role,
            description: userBase.description ?? "",
            grantedAt: userBase.grantedAt,
          }
        : null,
      history: formattedHistory,
      current: formattedHistory[0] || null,
    };
  }

  /**
   * ユーザープロフィールを作成または更新する（UPSERT）。
   *
   * トランザクション内でユーザー名の重複チェックを行い、
   * `users` テーブルを UPSERT した後に `userStatusLogs` にもレコードを追加する。
   *
   * @param params.userId - ユーザー ID
   * @param params.userName - ユーザー名（他ユーザーと重複不可）
   * @param params.iidxId - IIDX プレイヤー ID
   * @param params.profileText - プロフィールテキスト
   * @param params.profileImage - プロフィール画像 URL
   * @param params.isPublic - 公開設定（`1`: 公開、`0`: 非公開）
   * @param params.arenaRank - アリーナランク
   * @param params.version - バージョン番号
   * @param params.batchId - バッチ ID
   * @returns `{ success: true }`
   * @throws ユーザー名が重複する場合は `status: 409` を持つエラー
   */
  async upsertUserProfile(params: {
    userId: string;
    userName: string;
    iidxId: string | null;
    profileText: string | null;
    profileImage: string | null;
    isPublic: number;
    arenaRank: string | null;
    version: string;
    batchId: string;
  }) {
    const {
      userId,
      userName,
      iidxId,
      profileText,
      profileImage,
      isPublic,
      arenaRank,
      version,
      batchId,
    } = params;

    return await db.transaction().execute(async (trx) => {
      const existingUser = await trx
        .selectFrom("users")
        .select("userId")
        .where("userName", "=", userName)
        .where("userId", "!=", userId)
        .executeTakeFirst();

      if (existingUser) {
        const error = new Error("UserName is already taken");
        Object.assign(error, { status: 409 });
        throw error;
      }

      const lastStatus = await trx
        .selectFrom("userStatusLogs")
        .select(["totalBpi", "arenaRank"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .orderBy("id", "desc")
        .limit(1)
        .executeTakeFirst();

      await trx
        .insertInto("users")
        .values({
          userId,
          userName,
          iidxId,
          profileText,
          profileImage,
          isPublic,
          updatedAt: new Date(),
        })
        .onDuplicateKeyUpdate({
          userName,
          iidxId,
          profileText,
          profileImage,
          isPublic,
          updatedAt: new Date(),
        })
        .execute();

      await trx
        .insertInto("userStatusLogs")
        .values({
          userId,
          totalBpi: lastStatus?.totalBpi ?? -15,
          arenaRank: arenaRank || lastStatus?.arenaRank,
          version,
          batchId,
        })
        .execute();

      return { success: true };
    });
  }
}

export const usersRepo = new UsersRepository();
