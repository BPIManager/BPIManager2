import { latestVersion } from "@/constants/latestVersion";
import { checkUserAccess } from "@/middlewares/api/withApi";
import type { NextApiRequest, NextApiResponse } from "next";
import { parseArray } from "@/utils/common/parseArray";
import { statsRepo } from "@/lib/db/stats";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version = latestVersion, level, difficulty } = req.query;

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    if (level || difficulty) {
      const targetLevels = parseArray(level).map((v) => parseInt(v, 10));
      const targetDiffs = parseArray(difficulty);
      if (targetLevels.length === 0 && targetDiffs.length === 0) {
        return res.status(404).json({
          message: "Required parameters are missing",
        });
      }

      const activity = await statsRepo.getActivityData(
        userId as string,
        version as string,
        targetLevels,
        targetDiffs,
      );

      return res.status(200).json(activity);
    }

    return res.status(404).json({
      message: "Required parameters are missing",
    });
  } catch (error: any) {
    console.error("Activity Data Error:", error);
    return res.status(500).json({ message: error.message });
  }
}
