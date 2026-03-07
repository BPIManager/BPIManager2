import { db } from "@/lib/db";
import { checkUserAccess } from "@/middlewares/api/withApi";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userId, songId } = req.query;

  if (!userId || !songId) {
    return res.status(400).json({ message: "Parameters are missing." });
  }

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }
    const history = await db
      .selectFrom("scores")
      .selectAll()
      .where("userId", "=", userId as string)
      .where("songId", "=", Number(songId))
      .orderBy("lastPlayed", "desc")
      .execute();

    const groupedHistory = history.reduce(
      (acc, record) => {
        const v = record.version || "unknown";
        if (!acc[v]) {
          acc[v] = [];
        }
        acc[v].push(record);
        return acc;
      },
      {} as Record<string, typeof history>,
    );

    return res.status(200).json(groupedHistory);
  } catch (error: any) {
    console.error("Fetch score history error:", error);
    return res.status(500).json({ message: error.message });
  }
}
