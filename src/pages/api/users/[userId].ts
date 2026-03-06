import { db } from "@/lib/db";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { sql } from "kysely";
import type { NextApiResponse } from "next";

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

    const result = await db
      .insertInto("users")
      .values({
        userId: data.userId,
        userName: data.userName,
        iidxId: data.iidxId,
        xId: data.xId,
        arenaRank: data.arenaRank,
        profileText: data.profileText,
        profileImage: data.profileImage,
        isPublic: data.isPublic,
        currentTotalBpi: null,
        createdAt: sql`NOW()`,
      })
      .onDuplicateKeyUpdate({
        userName: data.userName,
        iidxId: data.iidxId,
        xId: data.xId,
        arenaRank: data.arenaRank,
        profileText: data.profileText,
        profileImage: data.profileImage,
        isPublic: data.isPublic,
        updatedAt: sql`NOW()`,
      })
      .executeTakeFirstOrThrow();

    return res.status(200).json({
      success: true,
      userId: data.userId,
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default withAuth(handler);
