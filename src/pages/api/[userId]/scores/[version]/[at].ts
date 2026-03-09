import { LogRepository } from "@/lib/db/logs";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";
import dayjs from "dayjs";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version, at, ...filterParams } = req.query;
  const repo = new LogRepository();
  const time =
    at === "latest" ? dayjs().toDate() : dayjs.tz(at as string).toDate();

  try {
    const access = await checkUserAccess(req, String(userId));
    if (!access.hasAccess)
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });

    const results = await repo.getScoresWithDetails(
      String(userId),
      String(version),
      { targetTime: time },
    );

    const songs = results.map(LogRepository.mapToFlatSong);
    const processed = sortSongs(
      filterSongsServerSide(songs, filterParams),
      filterParams,
    );

    return res.status(200).json(processed);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
