import { db } from "@/lib/db";
import { checkUserAccess } from "@/middlewares/api/withApi";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version, batchId } = req.query;

  if (!userId || !version || !batchId) {
    return res.status(400).json({ message: "Parameters are missing." });
  }

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const targetBatch = await db
      .selectFrom("logs")
      .select(["createdAt", "batchId"])
      .where("batchId", "=", batchId as string)
      .executeTakeFirst();

    if (!targetBatch) {
      return res.status(404).json({ message: "Batch not found." });
    }

    const batchCreatedAt = targetBatch.createdAt;

    const [prevBatch, nextBatch] = await Promise.all([
      db
        .selectFrom("logs")
        .select(["batchId", "createdAt"])
        .where("userId", "=", userId as string)
        .where("version", "=", version as string)
        .where("createdAt", "<", batchCreatedAt)
        .orderBy("createdAt", "desc")
        .executeTakeFirst(),
      db
        .selectFrom("logs")
        .select(["batchId", "createdAt"])
        .where("userId", "=", userId as string)
        .where("version", "=", version as string)
        .where("createdAt", ">", batchCreatedAt)
        .orderBy("createdAt", "asc")
        .executeTakeFirst(),
    ]);

    const results = await db
      .selectFrom("scores as current")
      .innerJoin("songs as s", "s.songId", "current.songId")
      .leftJoin("scores as prev", (join) =>
        join
          .onRef("prev.songId", "=", "current.songId")
          .on("prev.userId", "=", userId as string)
          .on("prev.version", "=", version as string)
          .on("prev.logId", "=", (qb) =>
            qb
              .selectFrom("scores as sub")
              .select((eb) => eb.fn.max("sub.logId").as("maxLogId"))
              .whereRef("sub.songId", "=", "current.songId")
              .where("sub.userId", "=", userId as string)
              .where("sub.createdAt", "<", batchCreatedAt),
          ),
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
            .where("updatedAt", "<=", batchCreatedAt)
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
        "current.exScore",
        "current.bpi",
        "current.clearState",
        "current.missCount",
        "current.lastPlayed as scoreAt",
        "prev.exScore as p_exScore",
        "prev.bpi as p_pbi",
        "prev.clearState as p_clearState",
        "prev.missCount as p_missCount",
        "sd.wrScore",
        "sd.kaidenAvg",
        "sd.coef",
      ])
      .where("current.batchId", "=", batchId as string)
      .where("current.userId", "=", userId as string)
      .orderBy("s.difficultyLevel", "desc")
      .orderBy("s.title", "asc")
      .execute();

    const songs = results.map((row) => {
      const notes = Number(row.notes || 0);
      const currentEx = Number(row.exScore);
      const prevEx = row.p_exScore !== null ? Number(row.p_exScore) : null;
      const currentBpi = Number(row.bpi);
      const prevBpi = row.p_pbi !== null ? Number(row.p_pbi) : null;

      return {
        songId: row.songId,
        title: row.title,
        difficulty: row.difficulty,
        difficultyLevel: row.difficultyLevel,
        level: row.difficultyLevel,
        notes: notes,
        bpm: row.bpm,
        releasedVersion: row.releasedVersion,

        current: {
          exScore: currentEx,
          bpi: currentBpi,
          clearState: row.clearState,
          missCount: row.missCount,
          lastPlayedAt: row.scoreAt,
        },
        previous:
          prevEx !== null
            ? {
                exScore: prevEx,
                bpi: prevBpi,
                clearState: row.p_clearState,
                missCount: row.p_missCount,
              }
            : null,
        diff: {
          exScore: prevEx !== null ? currentEx - prevEx : currentEx,
          bpi:
            prevBpi !== null
              ? Math.round((currentBpi - prevBpi) * 100) / 100
              : Math.round((currentBpi + 15) * 100) / 100,
        },

        wrScore: row.wrScore,
        kaidenAvg: row.kaidenAvg,
        coef: row.coef,
      };
    });

    return res.status(200).json({
      songs,
      pagination: {
        prev: prevBatch || null,
        next: nextBatch || null,
        current: targetBatch,
      },
    });
  } catch (error: any) {
    console.error("Batch details error:", error);
    return res.status(500).json({ message: error.message });
  }
}
