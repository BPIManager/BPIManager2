import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { socialRepo } from "@/lib/db/social";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();
  const { userId, version, levels, difficulties } = req.query;

  if (!userId || !version) {
    return res.status(400).json({ message: "userId and version are required" });
  }

  const access = await checkUserAccess(req, userId as string);
  const viewerId = access.user?.userId;
  if (!viewerId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const normalize = (val: string | string[] | undefined): string[] => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    };

    const levelArray = normalize(levels).map(Number);
    const diffArray = normalize(difficulties);

    const summary = await socialRepo.getFollowedWinLossSummary({
      viewerId,
      version: version as string,
      levels: levelArray,
      difficulties: diffArray,
    });

    return res.status(200).json(summary);
  } catch (error) {
    console.error("Followed Summary API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
