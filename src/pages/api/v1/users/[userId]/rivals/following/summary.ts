import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { scoresRepo } from "@/lib/db/aggregates/scoresFacade";
import { logsRepo } from "@/lib/db/domains/logs";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }
  const { version, levels, difficulties } = req.query;

  if (!version) {
    return res.status(400).json({ message: "version is required" });
  }

  const viewerId = req.authUid;

  try {
    const normalize = (val: string | string[] | undefined): string[] => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    };

    const levelArray = normalize(levels).map(Number);
    const diffArray = normalize(difficulties);

    const [summary, viewerBpiRecord] = await Promise.all([
      scoresRepo.getFollowedWinLossSummary({
        viewerId,
        version: version as string,
        levels: levelArray,
        difficulties: diffArray,
      }),
      logsRepo.getLatestTotalBpi(viewerId, version as string),
    ]);

    return res.status(200).json({
      rivals: summary,
      viewerBpi: viewerBpiRecord ? Number(viewerBpiRecord.totalBpi) : -15,
    });
  } catch (error) {
    console.error("Followed Summary API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
