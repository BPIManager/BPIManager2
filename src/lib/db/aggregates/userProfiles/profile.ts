import { db } from "@/lib/db";
import {
  getLatestArenaStatsPerVersion,
  getBestArenaClassPerVersion,
} from "@/lib/db/domains/arenaHistory";
import { getStatsPrivacy } from "@/lib/db/domains/arenaPrivacy";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";
import { followsRepo } from "@/lib/db/domains/follow";

/**
 * 公開プロフィールページ・自分のダッシュボード用の複合ビューを担当するリポジトリクラス。
 *
 * users・userStatusLogs・officialArenaStats・userRoles・follows・statsPrivacy等を
 * 横断してユーザー向けの複合ビューを組み立てる。
 */
class UserProfileRepository {
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
        followsRepo.followerCountSubquery(userId).as("followerCount"),
        followsRepo.followingCountSubquery(userId).as("followingCount"),
        followsRepo
          .isFollowingSubquery(myId ?? "GUEST", userId)
          .as("isFollowing"),
        followsRepo
          .isFollowingSubquery(userId, myId ?? "GUEST")
          .as("isFollowedBy"),
      ])
      .where("u.userId", "=", userId)
      .executeTakeFirst();

    if (!userBase) return null;

    const isSelf = userBase.userId === myId;

    const [bpiHistory, rawArenaStats, bestArenaStats, privacy] =
      await Promise.all([
        userStatusLogsRepo.getBpiHistoryByVersion(userId),
        getLatestArenaStatsPerVersion(userId),
        getBestArenaClassPerVersion(userId),
        getStatsPrivacy(userId),
      ]);

    const bpiMap = new Map(
      bpiHistory.map((h) => [h.version, Number(h.totalBpi)]),
    );
    const arenaMap = new Map(rawArenaStats.map((s) => [s.version, s]));
    const allVersions = [
      ...new Set([...bpiMap.keys(), ...arenaMap.keys()]),
    ].sort((a, b) => {
      if (a === "INF") return 1;
      if (b === "INF") return -1;
      return b.localeCompare(a);
    });

    const stats = allVersions.map((version) => {
      const arena = arenaMap.get(version);
      const best = bestArenaStats.get(version);
      const showArena = isSelf || privacy.showArenaClass;
      return {
        version,
        totalBpi: bpiMap.get(version) ?? null,
        arenaClass: arena && showArena ? arena.arenaClass : null,
        arenaRank:
          arena && (isSelf || privacy.showArenaRank) ? arena.arenaRank : null,
        area: arena && (isSelf || privacy.showArea) ? arena.area : null,
        gradeSp: arena && (isSelf || privacy.showGrade) ? arena.gradeSp : null,
        gradeDp: arena && (isSelf || privacy.showGrade) ? arena.gradeDp : null,
        updatedAt: arena?.fetchedAt ?? null,
        bestArenaClass: best && showArena ? best.arenaClass : null,
        bestArenaClassAt: best && showArena ? best.fetchedAt : null,
      };
    });

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
        isSelf,
      },
      role: userBase.role
        ? {
            role: userBase.role,
            description: userBase.description ?? "",
            grantedAt: userBase.grantedAt,
          }
        : null,
      stats,
      statsPrivacy: {
        showArenaClass: !!privacy.showArenaClass,
        showArenaRank: !!privacy.showArenaRank,
        showArea: !!privacy.showArea,
        showGrade: !!privacy.showGrade,
      },
    };
  }

  async getMe(userId: string, version: string) {
    const user = await db
      .selectFrom("users as u")
      .leftJoin(
        userStatusLogsRepo.latestRowSubquery(userId, version).as("latest"),
        (join) => join.onRef("u.userId", "=", "latest.userId"),
      )
      .leftJoin("userRoles as ur", "ur.userId", "u.userId")
      .select([
        "u.userId",
        "u.userName",
        "u.profileText",
        "u.profileImage",
        "u.iidxId",
        "u.xId",
        "u.isPublic",
        "u.createdAt",
        "u.updatedAt",
        "latest.totalBpi",
        "latest.arenaRank",
        "ur.role",
        "ur.description",
        "ur.grantedAt",
        followsRepo.followingCountSubquery(userId).as("followingCount"),
        followsRepo.followerCountSubquery(userId).as("followerCount"),
      ])
      .where("u.userId", "=", userId)
      .executeTakeFirst();

    if (!user) return null;

    return {
      ...user,
      followingCount: Number(user.followingCount || 0),
      followerCount: Number(user.followerCount || 0),
      role: user.role
        ? {
            role: user.role,
            description: user.description ?? "",
            grantedAt: user.grantedAt,
          }
        : null,
    };
  }
}

export const userProfileRepo = new UserProfileRepository();
