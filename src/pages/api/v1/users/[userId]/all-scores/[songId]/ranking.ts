import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { allScoresRepo } from "@/lib/db/allScores";
import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  const { songId } = req.query;
  const viewerId = req.authUid;

  const songIdNum = parseInt(songId as string);
  if (isNaN(songIdNum)) {
    return res.status(400).json({ message: "Invalid songId" });
  }

  const rawVersion = String(req.query.version ?? "");
  const version = (IIDX_VERSIONS as readonly string[]).includes(rawVersion)
    ? rawVersion
    : latestVersion;

  try {
    const result = await allScoresRepo.getAllSongRanking(
      songIdNum,
      version,
      viewerId,
    );
    return res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}

export default withAuth(handler);
