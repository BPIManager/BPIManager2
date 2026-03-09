import { db } from "@/lib/db";
import { checkUserAccess } from "@/middlewares/api/withApi";
import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from "kysely";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version } = req.query;

  if (!userId || !version) {
    return res
      .status(400)
      .json({ message: "userId and version are required." });
  }

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const rows = await db
      .selectFrom((qb) =>
        qb
          .selectFrom("logs")
          .select([
            "id as l_id",
            "totalBpi as l_totalBpi",
            "batchId as l_batchId",
            "createdAt as l_createdAt",
            "version as l_version",
            sql<number | null>`LAG(totalBpi) OVER (ORDER BY createdAt ASC)`.as(
              "l_prevTotalBpi",
            ),
          ])
          .where("userId", "=", userId as string)
          .where("version", "=", version as string)
          .as("l_with_lag"),
      )
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("scores")
            .select([
              "batchId as sc_batchId",
              (eb) => eb.fn.count("logId").as("songCount"),
            ])
            .where("userId", "=", userId as string)
            .groupBy("batchId")
            .as("counts"),
        (join) => join.onRef("counts.sc_batchId", "=", "l_with_lag.l_batchId"),
      )
      .leftJoin(
        (qb) =>
          qb
            .selectFrom("scores as sc")
            .innerJoin("songs as s", "s.songId", "sc.songId")
            .select([
              "sc.batchId as ts_batchId",
              "s.title as ts_title",
              "sc.bpi as ts_bpi",
              "sc.clearState as ts_clearState",
              sql`ROW_NUMBER() OVER (PARTITION BY sc.batchId ORDER BY sc.bpi DESC)`.as(
                "rn",
              ),
            ])
            .where("sc.userId", "=", userId as string)
            .as("ranked_scores"),
        (join) =>
          join.onRef("ranked_scores.ts_batchId", "=", "l_with_lag.l_batchId"),
      )
      .selectAll()
      .where((eb) => eb.or([eb("rn", "is", null), eb("rn", "<=", 5)]))
      .orderBy("l_createdAt", "desc")
      .orderBy("ts_bpi", "desc")
      .execute();
    const processedLogs = rows.reduce((acc, row) => {
      let log = acc.find((l) => l.batchId === row.l_batchId);

      if (!log) {
        const currentBpi = Number(row.l_totalBpi);
        const prevBpi =
          row.l_prevTotalBpi !== null ? Number(row.l_prevTotalBpi) : null;

        log = {
          id: row.l_id,
          batchId: row.l_batchId,
          version: Number(row.l_version),
          totalBpi: currentBpi,
          songCount: Number(row.songCount ?? 0),
          diff:
            prevBpi !== null
              ? Math.round((currentBpi - prevBpi) * 100) / 100
              : 0,
          createdAt: row.l_createdAt,
          topScores: [],
        };
        acc.push(log);
      }

      if (row.ts_title) {
        log.topScores.push({
          title: row.ts_title,
          bpi: Number(row.ts_bpi),
          clearState: row.ts_clearState,
        });
      }

      return acc;
    }, [] as any[]);

    return res.status(200).json(processedLogs);
  } catch (error: any) {
    console.error("Fetch timeline logs error:", error);
    return res.status(500).json({ message: error.message });
  }
}
