import { logsRepo } from "@/lib/db/logs";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { NextApiResponse } from "next";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method Not Allowed" });

  const { version } = req.query;
  const userId = req.authUid;

  if (!userId || !version || typeof version !== "string") {
    return res.status(400).json({ message: "userId and version are required" });
  }

  try {
    const rows = await logsRepo.getRivalTopScores({
      userId,
      version,
    });

    const result = rows.map((row) => ({
      songId: Number(row.songId),
      title: row.title,
      difficulty: row.difficulty,
      difficultyLevel: Number(row.difficultyLevel),
      topExScore: row.topExScore !== null ? Number(row.topExScore) : null,
      topBpi: row.topBpi !== null ? Number(row.topBpi) : null,
      rivalCount: Number(row.rivalCount),
    }));

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("rival top-scores error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export default withAuth(handler);
