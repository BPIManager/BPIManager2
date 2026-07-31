import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { followListAggregateRepo } from "@/lib/db/aggregates/followList";

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
    const rivals = await followListAggregateRepo.getPublicFollowingUsers(
      userId as string,
    );

    return res.status(200).json({ rivals });
  } catch (error) {
    console.error("Rival list API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
