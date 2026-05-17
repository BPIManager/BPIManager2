import fs from "fs/promises";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { latestVersion } from "@/constants/latestVersion";

function getOfficialArenaFile(version: string) {
  return path.join(
    process.cwd(),
    `public/data/info/arena_official/${version}/latest.json`,
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const version =
    typeof req.query.version === "string" ? req.query.version : latestVersion;

  try {
    const raw = await fs.readFile(getOfficialArenaFile(version), "utf-8");
    const data = JSON.parse(raw);
    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400",
    );
    return res.status(200).json(data);
  } catch {
    return res
      .status(503)
      .json({ message: "Official arena data is not yet available." });
  }
}
