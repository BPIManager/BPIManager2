import { db } from "@/lib/db";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { sql } from "kysely";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version, date } = req.query;

  if (!userId || !version || !date) {
    return res.status(400).json({ message: "Parameters are missing." });
  }

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const dailyBatches = await db
      .selectFrom("logs")
      .select(["batchId", "createdAt", "totalBpi"])
      .where("userId", "=", userId as string)
      .where("version", "=", version as string)
      .where(sql`DATE(createdAt)`, "=", date as string)
      .orderBy("createdAt", "asc")
      .execute();

    if (dailyBatches.length === 0) {
      return res.status(404).json({ message: "No logs found for this date." });
    }

    const firstBatchCreatedAt = dailyBatches[0].createdAt;
    const lastBatch = dailyBatches[dailyBatches.length - 1];
    const dailyBatchIds = dailyBatches.map((b) => b.batchId);

    const prevBatch = await db
      .selectFrom("logs")
      .select(["batchId", "createdAt", "totalBpi"])
      .where("userId", "=", userId as string)
      .where("version", "=", version as string)
      .where("createdAt", "<", firstBatchCreatedAt)
      .orderBy("createdAt", "desc")
      .executeTakeFirst();

    const nextDayBatch = await db
      .selectFrom("logs")
      .select([sql`DATE(createdAt)`.as("nextDate")])
      .where("userId", "=", userId as string)
      .where("version", "=", version as string)
      .where(sql`DATE(createdAt)`, ">", date as string)
      .orderBy("createdAt", "asc")
      .executeTakeFirst();

    const prevDayBatch = await db
      .selectFrom("logs")
      .select([sql`DATE(createdAt)`.as("prevDate")])
      .where("userId", "=", userId as string)
      .where("version", "=", version as string)
      .where(sql`DATE(createdAt)`, "<", date as string)
      .orderBy("createdAt", "desc")
      .executeTakeFirst();

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
              .where("sub.createdAt", "<", firstBatchCreatedAt),
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
            .where("isCurrent", "=", 1)
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
      .where("current.batchId", "in", dailyBatchIds)
      .where("current.userId", "=", userId as string)
      .where("current.logId", "in", (qb) =>
        qb
          .selectFrom("scores")
          .select((eb) => eb.fn.max("logId").as("logId"))
          .where("batchId", "in", dailyBatchIds)
          .groupBy("songId"),
      )
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
        next: null,
        current: lastBatch,
        dailyBatchIds: dailyBatchIds,
        dailyBatchCount: dailyBatchIds.length,
        prevDate: prevDayBatch?.prevDate || null,
        nextDate: nextDayBatch?.nextDate || null,
      },
    });
  } catch (error: any) {
    console.error("Daily details error:", error);
    return res.status(500).json({ message: error.message });
  }
}
