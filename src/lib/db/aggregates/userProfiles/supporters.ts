import { db } from "@/lib/db";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";

/**
 * サポーター一覧を担当するリポジトリクラス。
 *
 * users・userStatusLogs・userRolesを横断してユーザー向けの複合ビューを
 * 組み立てる（#181で`userProfiles/index.ts`から分割）。
 */
class SupportersRepository {
  async getSupporters(version: string) {
    const latestStatusSubquery =
      userStatusLogsRepo.latestPerUserSubquery(version);

    return await db
      .selectFrom("users as u")
      .innerJoin("userRoles as ur", "ur.userId", "u.userId")
      .leftJoin(latestStatusSubquery.as("ls"), "u.userId", "ls.userId")
      .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .select([
        "u.userId",
        "u.userName",
        "u.iidxId",
        "u.profileImage",
        "usl.totalBpi",
        "ur.role",
        "ur.description",
        "ur.grantedAt",
      ])
      .where("u.isPublic", "=", 1)
      .orderBy("ur.grantedAt", "asc")
      .execute();
  }
}

export const supportersRepo = new SupportersRepository();
