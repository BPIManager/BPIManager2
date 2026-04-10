import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebase/admin";
import { statsRepo } from "@/lib/db/stats";
import { latestVersion, IIDX_VERSIONS } from "@/constants/latestVersion";

/** Bearer トークンが有効なら uid を返し、なければ空文字を返す */
async function resolveViewerId(req: NextApiRequest): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return "";
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return "";
  }
}

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
    ? rawVersion
    : latestVersion;

  try {
    // ログイン済みなら viewerId を解決して自分の順位を isSelf=true にする
    const viewerId = await resolveViewerId(req);
    const result = await statsRepo.getSongRanking(songIdNum, version, viewerId);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
