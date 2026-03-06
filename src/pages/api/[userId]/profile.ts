import { latestVersion } from "@/constants/latestVersion";
import { db } from "@/lib/db";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { validateUserName } from "@/utils/common/nameValidation";
import { sql } from "kysely";
import type { NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const data = req.body;
    const batchId = uuidv4();
    const validation = validateUserName(data.userName);
    if (!validation.isValid) {
      const error = new Error(validation.message!);
      (error as any).status = 400;
      throw error;
    }

    const result = await db.transaction().execute(async (trx) => {
      const existingUser = await trx
        .selectFrom("users")
        .select("userId")
        .where("userName", "=", data.userName)
        .where("userId", "!=", data.userId)
        .executeTakeFirst();

      if (existingUser) {
        const error = new Error("UserName is already taken");
        (error as any).status = 409;
        throw error;
      }

      const lastStatus = await trx
        .selectFrom("userStatusLogs")
        .select("totalBpi")
        .where("userId", "=", data.userId)
        .orderBy("id", "desc")
        .limit(1)
        .executeTakeFirst();

      const latestBpi = lastStatus?.totalBpi ?? -15;

      await trx
        .insertInto("users")
        .values({
          userId: data.userId,
          userName: data.userName,
          iidxId: data.iidxId,
          xId: data.xId,
          profileText: data.profileText,
          profileImage: data.profileImage,
          isPublic: data.isPublic,
          createdAt: sql`NOW()`,
          updatedAt: sql`NOW()`,
        })
        .onDuplicateKeyUpdate({
          userName: data.userName,
          iidxId: data.iidxId,
          xId: data.xId,
          profileText: data.profileText,
          profileImage: data.profileImage,
          isPublic: data.isPublic,
          updatedAt: sql`NOW()`,
        })
        .execute();

      await trx
        .insertInto("userStatusLogs")
        .values({
          userId: data.userId,
          totalBpi: latestBpi,
          arenaRank: data.arenaRank,
          version: data.version || latestVersion,
          batchId: batchId,
          createdAt: sql`NOW()`,
          updatedAt: sql`NOW()`,
        })
        .execute();

      return { success: true, userId: data.userId };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.status === 409) {
      return res.status(409).json({ message: error.message });
    }
    console.error("Database error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default withAuth(handler);
