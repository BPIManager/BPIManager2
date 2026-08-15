import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Transaction } from "kysely";

/**
 * フォロー関係（`follows` テーブル）の参照・更新を担当するリポジトリクラス。
 */
class FollowRepository {
  /**
   * 指定ユーザーが別のユーザーをフォローしているか確認する。
   *
   * @param followerId - フォローする側のユーザー ID
   * @param followingId - フォローされる側のユーザー ID
   * @returns フォロー済みであれば `true`
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .selectFrom("follows")
      .select("id")
      .where("followerId", "=", followerId)
      .where("followingId", "=", followingId)
      .executeTakeFirst();

    return !!result;
  }

  /**
   * フォロー関係を作成する（呼び出し元のトランザクションに参加する版）。
   *
   * フォローリクエスト承認時など、複数ドメインへの書き込みを1トランザクションで
   * 行うオーケストレーターから呼ばれる。既に存在する場合はそのまま成功する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param followerId - フォローする側のユーザー ID
   * @param followingId - フォローされる側のユーザー ID
   */
  async create(
    trx: Transaction<Database>,
    followerId: string,
    followingId: string,
  ) {
    await trx
      .insertInto("follows")
      .values({ followerId, followingId })
      .onDuplicateKeyUpdate({ followerId })
      .execute();
  }

  /**
   * フォロー関係を確実に削除する（トグルではなく一方向の削除）。
   *
   * 「強制フォロー解除」のように、操作者(対象ユーザー)と`followerId`(削除対象の
   * フォロワー)が異なる場合に使う。`toggleFollow`は呼び出し元自身の
   * フォロー状態を反転する用途のため、この非対称な操作には使えない。
   *
   * @param followerId - フォローしている側のユーザー ID
   * @param followingId - フォローされている側のユーザー ID
   * @returns 削除対象が存在した場合は `true`
   */
  async remove(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .deleteFrom("follows")
      .where("followerId", "=", followerId)
      .where("followingId", "=", followingId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  /**
   * フォロー関係を確実に削除する（`remove`のトランザクション参加版）。
   *
   * フォロー解除時に`followListMembers`の連動削除を同一トランザクションで
   * 行う`orchestrators/unfollow`から呼ばれる。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param followerId - フォローしている側のユーザー ID
   * @param followingId - フォローされている側のユーザー ID
   * @returns 削除対象が存在した場合は `true`
   */
  async removeInTransaction(
    trx: Transaction<Database>,
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    const result = await trx
      .deleteFrom("follows")
      .where("followerId", "=", followerId)
      .where("followingId", "=", followingId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  /**
   * フォロー状態をトグルする。存在すれば削除し、なければ追加する。
   *
   * @param followerId - フォローする側のユーザー ID
   * @param followingId - フォローされる側のユーザー ID
   * @returns フォローした場合は `true`、解除した場合は `false`
   */
  async toggleFollow(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    return await db.transaction().execute(async (trx) => {
      const existing = await trx
        .selectFrom("follows")
        .select("id")
        .where("followerId", "=", followerId)
        .where("followingId", "=", followingId)
        .forUpdate()
        .executeTakeFirst();

      if (existing) {
        await trx.deleteFrom("follows").where("id", "=", existing.id).execute();
        return false;
      } else {
        await trx
          .insertInto("follows")
          .values({
            followerId,
            followingId,
          })
          .execute();
        return true;
      }
    });
  }

  /**
   * 指定ユーザーのフォロワー数を取得するスカラーサブクエリを組み立てる。
   *
   * @param userId - ユーザー ID
   */
  followerCountSubquery(userId: string) {
    return db
      .selectFrom("follows")
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .where("followingId", "=", userId);
  }

  /**
   * 指定ユーザーのフォロー中数を取得するスカラーサブクエリを組み立てる。
   *
   * @param userId - ユーザー ID
   */
  followingCountSubquery(userId: string) {
    return db
      .selectFrom("follows")
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .where("followerId", "=", userId);
  }

  /**
   * `followerId` が `followingId` をフォローしているかを表すスカラーサブクエリを組み立てる。
   *
   * @param followerId - フォローする側のユーザー ID
   * @param followingId - フォローされる側のユーザー ID
   */
  isFollowingSubquery(followerId: string, followingId: string) {
    return db
      .selectFrom("follows")
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .where("followerId", "=", followerId)
      .where("followingId", "=", followingId);
  }

  /**
   * 指定ユーザーのフォロワー数とフォロー中数を取得する。
   *
   * @param userId - ユーザー ID
   * @returns `{ followersCount, followingCount }`
   */
  async getFollowCounts(userId: string) {
    const [followers, following] = await Promise.all([
      db
        .selectFrom("follows")
        .select((eb) => eb.fn.count<number>("id").as("count"))
        .where("followingId", "=", userId)
        .executeTakeFirst(),
      db
        .selectFrom("follows")
        .select((eb) => eb.fn.count<number>("id").as("count"))
        .where("followerId", "=", userId)
        .executeTakeFirst(),
    ]);

    return {
      followersCount: Number(followers?.count ?? 0),
      followingCount: Number(following?.count ?? 0),
    };
  }

  /**
   * バックアップ用に、ユーザーが関わる全フォロー関係（フォロー・被フォロー双方）を取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("follows")
      .selectAll()
      .where((eb) =>
        eb.or([eb("followerId", "=", userId), eb("followingId", "=", userId)]),
      )
      .execute();
  }

  /**
   * ユーザーが関わる全フォロー関係（フォロー・被フォロー双方）を削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx
      .deleteFrom("follows")
      .where((eb) =>
        eb.or([eb("followerId", "=", userId), eb("followingId", "=", userId)]),
      )
      .execute();
  }
}

export const followsRepo = new FollowRepository();
