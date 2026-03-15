import { NextApiRequest, NextApiResponse } from "next";
import dayjs from "@/lib/dayjs";
import { logsRepo } from "@/lib/db/logs";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { mapToFlatSong } from "@/utils/logs/getMapFlatten";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";

async function handleGetScores(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
) {
  const { version, asOf, ...filterParams } = req.query;

  if (!version || typeof version !== "string") {
    return res
      .status(400)
      .json({ message: "Missing or invalid version parameter." });
  }

  const time =
    !asOf || asOf === "latest"
      ? dayjs.tz().utc().toDate()
      : dayjs
          .tz(asOf as string)
          .utc()
          .toDate();

  const results = await logsRepo.getScoresWithDetails(userId, version, {
    targetTime: time,
  });

  const songs = results.map(mapToFlatSong);
  const processed = sortSongs(
    filterSongsServerSide(songs, filterParams),
    filterParams,
  );

  return res.status(200).json(processed);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "Invalid userId" });
  }

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    switch (req.method) {
      case "GET":
        return await handleGetScores(req, res, userId);

      default:
        res.setHeader("Allow", ["GET"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error: any) {
    console.error("Scores API Error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
}
