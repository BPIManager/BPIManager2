import { db } from "@/lib/db";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { SongWithScore } from "@/types/songs/withScore";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version, at, ...filterParams } = req.query;

  if (!userId || !version || !at) {
    return res.status(400).json({ message: "Parameters are missing." });
  }

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const isLatest = at === "latest";
    const targetTime = isLatest ? new Date() : new Date(at as string);

    if (isNaN(targetTime.getTime())) {
      return res.status(400).json({ message: "Invalid timestamp format." });
    }

    const query = db
      .selectFrom("songs as s")
      .innerJoin(
        (qb) =>
          qb
            .selectFrom("scores")
            .select([
              "songId as l_songId",
              (eb) => eb.fn.max("logId").as("maxLogId"),
            ])
            .where("userId", "=", userId as string)
            .where("version", "=", version as string)
            .where("createdAt", "<=", targetTime)
            .groupBy("songId")
            .as("latest_sc"),
        (join) => join.onRef("latest_sc.l_songId", "=", "s.songId"),
      )
      .innerJoin("scores as sc", (join) =>
        join.onRef("sc.logId", "=", "latest_sc.maxLogId"),
      )
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("songDef")
            .select([
              "songId as l_defSongId",
              "difficulty as l_defDiff",
              (eb) => eb.fn.max("defId").as("maxDefId"),
            ])
            .where("updatedAt", "<=", targetTime)
            .groupBy(["songId", "difficulty"])
            .as("latest_sd"),
        (join) =>
          join
            .onRef("latest_sd.l_defSongId", "=", "s.songId")
            .onRef("latest_sd.l_defDiff", "=", "s.difficulty"),
      )
      .leftJoin("songDef as sd", "sd.defId", "latest_sd.maxDefId")
      .select([
        "s.songId",
        "s.title",
        "s.notes",
        "s.bpm",
        "s.difficultyLevel",
        "s.difficulty",
        "s.releasedVersion",
        "sc.logId",
        "sc.exScore",
        "sc.bpi",
        "sc.clearState",
        "sc.missCount",
        "sc.lastPlayed as scoreAt",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
      ])
      .where((eb) =>
        eb.or([
          eb("s.deletedAt", "is", null),
          eb("s.deletedAt", ">", version as string),
        ]),
      )
      .orderBy("s.difficultyLevel", "desc")
      .orderBy("s.title", "asc");

    const results = await query.execute();
    const processedData = sortSongs(
      filterSongsServerSide(
        results as unknown as SongWithScore[],
        filterParams,
      ),
      filterParams,
    );

    return res.status(200).json(processedData);
  } catch (error: any) {
    console.error("Fetch snapshot scores error:", error);
    return res.status(500).json({ message: error.message });
  }
}
