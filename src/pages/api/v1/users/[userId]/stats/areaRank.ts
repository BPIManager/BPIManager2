import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserAreaRank } from "@/lib/arena/prefectureRankings";

const schema = z.object({ userId: z.string() });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body = parseQuery(schema, req.query, res);
  if (!body) return;

  const { userId } = body;

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
    }

    const user = await db
      .selectFrom("users")
      .select(["iidxId"])
      .where("userId", "=", userId)
      .executeTakeFirst();

    if (!user) return res.status(404).json({ message: "User not found" });

    const areaRank = getUserAreaRank(user.iidxId);
    return res.status(200).json(areaRank ?? null);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
