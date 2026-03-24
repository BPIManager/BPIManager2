import { NextApiRequest, NextApiResponse } from "next";
import { rejectAccess } from "@/middlewares/api/withApi";
import { allScoresRepo } from "@/lib/db/allScores";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = req.query;

  const params = {
    search: req.query.search as string,
    levels: req.query.levels as string,
    difficulties: req.query.difficulties as string,
    clearStates: req.query.clearStates as string,
    sortKey: (req.query.sortKey as string) ?? "level",
    sortOrder: (req.query.sortOrder as string) ?? "desc",
  };

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "Invalid userId" });
  }

  try {
    const access = await checkProfileAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    switch (req.method) {
      case "GET":
        const results = await allScoresRepo.getAllScoresList(userId, params);
        return results && results.length > 0
          ? res.status(200).json(results)
          : res.status(404).json({ message: "No data found" });
      default:
        res.setHeader("Allow", ["GET"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error: any) {
    console.error("AllScores API Error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
}
