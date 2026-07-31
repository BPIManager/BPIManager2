import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { unplayedSongsAggregateRepo } from "@/lib/db/aggregates/unplayedSongs";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";
import topElements from "@/constants/iidx/radars/topElements";

const radarLookup = new Map<string, string>(
  (topElements as { title: string; difficulty: string; top: string }[]).map(
    (e) => [`${e.title}__${e.difficulty}`, e.top],
  ),
);

async function handleGetUnplayed(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
) {
  const { version, ...filterParams } = req.query;

  if (!version || typeof version !== "string") {
    return res
      .status(400)
      .json({ message: "Missing or invalid version parameter." });
  }

  const rows = await unplayedSongsAggregateRepo.getUnplayedSongs(
    userId,
    version,
  );

  const songs = rows.map((row) => ({
    songId: Number(row.songId),
    title: row.title,
    notes: Number(row.notes || 0),
    bpm: row.bpm,
    difficulty: row.difficulty,
    difficultyLevel: Number(row.difficultyLevel),
    releasedVersion: row.releasedVersion ? Number(row.releasedVersion) : null,
    logId: null,
    exScore: null,
    bpi: null,
    clearState: null,
    missCount: null,
    scoreAt: null,
    wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
    kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
    coef: row.coef !== null ? Number(row.coef) : null,
    radarTop: radarLookup.get(`${row.title}__${row.difficulty}`) ?? null,
  }));

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
        return await handleGetUnplayed(req, res, userId);
      default:
        res.setHeader("Allow", ["GET"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
