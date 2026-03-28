import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { db } from "@/lib/db";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";

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

  const rows = await db
    .selectFrom("songs as s")
    .innerJoin(
      (qb) =>
        qb
          .selectFrom("songDef")
          .select([
            "songId as l_defSongId",
            (eb) => eb.fn.max("defId").as("maxDefId"),
          ])
          .where("isCurrent", "=", 1)
          .groupBy("songId")
          .as("latest_sd"),
      (join) => join.onRef("latest_sd.l_defSongId", "=", "s.songId"),
    )
    .leftJoin("songDef as sd", "sd.defId", "latest_sd.maxDefId")
    .leftJoin(
      (qb) =>
        qb
          .selectFrom("scores as sc")
          .select([
            "sc.songId as sc_songId",
            "sc.exScore",
            "sc.bpi",
            "sc.clearState",
            "sc.missCount",
            "sc.lastPlayed",
            "sc.logId",
          ])
          .where("sc.userId", "=", userId)
          .where("sc.version", "=", version)
          .where("sc.logId", "=", (eb) =>
            eb
              .selectFrom("scores as sc2")
              .select((s) => s.fn.max("logId").as("m"))
              .where("sc2.userId", "=", userId)
              .where("sc2.version", "=", version)
              .whereRef("sc2.songId", "=", "sc.songId"),
          )
          .as("my"),
      (join) => join.onRef("my.sc_songId", "=", "s.songId"),
    )
    .select([
      "s.songId",
      "s.title",
      "s.notes",
      "s.bpm",
      "s.difficulty",
      "s.difficultyLevel",
      "s.releasedVersion",
      "sd.wrScore",
      "sd.kaidenAvg",
      "sd.coef",
    ])
    .where("my.sc_songId", "is", null)
    .where((eb) =>
      eb.or([eb("s.deletedAt", "is", null), eb("s.deletedAt", ">", version)]),
    )
    .orderBy("s.difficultyLevel", "desc")
    .orderBy("s.title", "asc")
    .execute();

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
