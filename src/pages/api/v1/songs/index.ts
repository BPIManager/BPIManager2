import type { NextApiRequest, NextApiResponse } from "next";
import { songsRepo } from "@/lib/db/songs";
import { latestVersion, IIDX_VERSIONS } from "@/constants/latestVersion";
import { IIDXVersion } from "@/types/iidx/version";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const rawVersion = String(req.query.version ?? "");
  const version = (IIDX_VERSIONS as readonly string[]).includes(rawVersion)
    ? (rawVersion as IIDXVersion)
    : latestVersion;

  try {
    const songs = await songsRepo.getSongList(version);
    return res.status(200).json(songs);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
