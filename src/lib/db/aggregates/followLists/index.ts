import { db } from "@/lib/db";

/**
 * フォローリスト（`followLists`）を、所属メンバー数やフォロー中ユーザーの
 * 所属状況といった複合データと組み合わせて組み立てるリポジトリクラス。
 *
 * `followLists`ドメイン本来の責務（単一テーブルの読み書き）を超えた
 * クロスドメイン参照のため、`domains/followLists`ではなくここに置く。
 * どのメソッドも本人（リスト所有者）専用の集計であり、第三者への公開は
 * 想定していない。
 */
class FollowListsAggregateRepository {
  /**
   * 指定ユーザーが作成した全リストを、所属メンバー数付きで取得する。
   *
   * Vaulドロワーでのリスト管理（一覧表示）に使う。
   *
   * @param userId - リスト所有者のユーザー ID
   */
  async getListsWithMemberCount(userId: string) {
    const rows = await db
      .selectFrom("followLists as fl")
      .leftJoin("followListMembers as flm", "flm.listId", "fl.id")
      .select([
        "fl.id",
        "fl.name",
        "fl.isPublic",
        "fl.createdAt",
        (eb) => eb.fn.count<number>("flm.id").as("memberCount"),
      ])
      .where("fl.userId", "=", userId)
      .groupBy(["fl.id", "fl.name", "fl.isPublic", "fl.createdAt"])
      .orderBy("fl.createdAt", "asc")
      .execute();

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      isPublic: Number(r.isPublic) === 1,
      createdAt: r.createdAt,
      memberCount: Number(r.memberCount),
    }));
  }

  /**
   * 指定ユーザーがフォロー中の全ユーザーを、それぞれが所属する
   * （このユーザー自身が作成した）リストID一覧付きで取得する。
   *
   * `/rivals`編集モードの行リスト（ユーザー×所属リストのSelect）に使う。
   *
   * @param userId - フォローしている側のユーザー ID
   */
  async getFollowingWithListMembership(userId: string) {
    const rows = await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "f.followingId", "u.userId")
      .leftJoin("followListMembers as flm", "flm.followingId", "f.followingId")
      .leftJoin("followLists as fl", (join) =>
        join.onRef("fl.id", "=", "flm.listId").on("fl.userId", "=", userId),
      )
      .select(["u.userId", "u.userName", "u.profileImage", "fl.id as listId"])
      .where("f.followerId", "=", userId)
      .orderBy("u.userName", "asc")
      .execute();

    const byUser = new Map<
      string,
      { userId: string; userName: string | null; profileImage: string | null; listIds: number[] }
    >();
    for (const row of rows) {
      let entry = byUser.get(row.userId);
      if (!entry) {
        entry = {
          userId: row.userId,
          userName: row.userName,
          profileImage: row.profileImage,
          listIds: [],
        };
        byUser.set(row.userId, entry);
      }
      if (row.listId != null) entry.listIds.push(row.listId);
    }

    return Array.from(byUser.values());
  }
}

export const followListsAggregateRepo = new FollowListsAggregateRepository();
