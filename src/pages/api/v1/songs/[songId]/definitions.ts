import { db } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { songId } = req.query;

  if (!songId || Array.isArray(songId)) {
    return res.status(400).json({ message: "songId is required" });
  }

  try {
    const definitions = await db
      .selectFrom("songDef")
      .select([
        "defId",
        "wrScore",
        "kaidenAvg",
        "coef",
        "isCurrent",
        "updatedAt",
      ])
      .where("songId", "=", Number(songId))
      .orderBy("defId", "desc")
      .execute();

    return res.status(200).json(definitions);
  } catch (error: unknown) {
    console.error("Fetch song definitions error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
