import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { db } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ message: "userId is required" });

  const access = await checkUserAccess(req, userId as string);
  if (!access.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const rivals = await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "f.followingId", "u.userId")
      .select(["u.userId", "u.userName", "u.profileImage"])
      .where("f.followerId", "=", userId as string)
      .where("u.isPublic", "=", 1)
      .orderBy("u.userName", "asc")
      .execute();

    return res.status(200).json({ rivals });
  } catch (error) {
    console.error("Rival list API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
