import { statsRepo } from "@/lib/db/stats";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import type { NextApiRequest, NextApiResponse } from "next";

export interface AvailablePeriodsData {
  months: string[]; // YYYY-MM, desc order
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const userId = req.query.userId as string;
  const version = req.query.version as string;

  if (!version) {
    return res.status(400).json({ message: "Missing param: version" });
  }

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const months = await statsRepo.getAvailableMonths(userId, version);
    return res.status(200).json({ months } satisfies AvailablePeriodsData);
  } catch (error) {
    console.error("[available-periods]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
