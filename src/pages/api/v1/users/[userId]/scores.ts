import { NextApiRequest, NextApiResponse } from "next";
import dayjs from "@/lib/dayjs";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { mapToFlatSong } from "@/utils/logs/getMapFlatten";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { scoresQuerySchema } from "@/schemas/scores/query";

async function handleGetScores(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
) {
  const body = parseQuery(scoresQuerySchema, req.query, res);
  if (!body) return;

  const { version, asOf, ...filterParams } = body;

  const time =
    !asOf || asOf === "latest"
      ? dayjs.tz().utc().toDate()
      : dayjs.tz(asOf).utc().toDate();

  const results = await scoreDetailRepo.getScoresWithDetails(userId, version, {
    targetTime: time,
  });

  const songs = results.map(mapToFlatSong);
  const processed = sortSongs(
    filterSongsServerSide(songs, filterParams),
    filterParams,
  );

  return res.status(200).json(processed);
}

export default withUserApiHandler(
  (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ message: "Invalid userId" });
      return null;
    }
    return { userId };
  },
  async (req, res, { userId }) => {
    switch (req.method) {
      case "GET":
        return await handleGetScores(req, res, userId);

      default:
        res.setHeader("Allow", ["GET"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  },
  {
    onError: (error, res) => {
      console.error("Scores API Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Internal Server Error";
      return res.status(500).json({ message: errorMessage });
    },
  },
);
