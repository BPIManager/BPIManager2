import { db } from "@/lib/db";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import type { NextApiResponse } from "next";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const user = await db
      .selectFrom("users as u")
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("userStatusLogs")
            .select(["userId", "totalBpi", "arenaRank", "id"])
            .where("userId", "=", req.authUid)
            .orderBy("id", "desc")
            .limit(1)
            .as("latest"),
        (join) => join.onRef("u.userId", "=", "latest.userId"),
      )
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
        (eb) =>
          eb
            .selectFrom("follows")
            .select(eb.fn.count("id").as("count"))
            .where("followerId", "=", req.authUid)
            .as("followingCount"),
        (eb) =>
          eb
            .selectFrom("follows")
            .select(eb.fn.count("id").as("count"))
            .where("followingId", "=", req.authUid)
            .as("followerCount"),
      ])
      .where("u.userId", "=", req.authUid)
      .executeTakeFirst();

    return res.status(200).json({
      exists: !!user,
      user: user
        ? {
            ...user,
            followingCount: Number(user.followingCount || 0),
            followerCount: Number(user.followerCount || 0),
          }
        : null,
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default withAuth(handler);
