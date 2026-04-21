import type { NextApiRequest, NextApiResponse } from "next";
import { songsRepo } from "@/lib/db/songs";
import { latestVersion, IIDX_VERSIONS } from "@/constants/latestVersion";
import { IIDXVersion } from "@/types/iidx/version";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { songId } = req.query;
  if (!songId || Array.isArray(songId))
    return res.status(400).json({ message: "Invalid songId" });

  const songIdNum = parseInt(songId, 10);
  if (isNaN(songIdNum))
    return res.status(400).json({ message: "Invalid songId" });

  const rawVersion = String(req.query.version ?? "");
  const version = (IIDX_VERSIONS as readonly string[]).includes(rawVersion)
    ? (rawVersion as IIDXVersion)
    : latestVersion;

  const rawLimit = parseInt(String(req.query.limit ?? "10"), 10);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 10 : Math.min(rawLimit, 50);

  const mode = req.query.mode === "global" ? "global" : "profile";

  try {
    const result = await songsRepo.getSimilarSongs(
      songIdNum,
      version,
      limit,
      mode,
    );
    return res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
