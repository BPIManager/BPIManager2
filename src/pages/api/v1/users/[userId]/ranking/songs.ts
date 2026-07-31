import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { statsRepo } from "@/lib/db/aggregates/stats";
import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  const viewerId = req.authUid;

  const rawVersion = String(req.query.version ?? "");
  const version = (IIDX_VERSIONS as readonly string[]).includes(rawVersion)
    ? rawVersion
    : latestVersion;

  try {
    const songs = await statsRepo.getUserSongRankings(viewerId, version);
    return res.status(200).json({ songs });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}

export default withAuth(handler);
