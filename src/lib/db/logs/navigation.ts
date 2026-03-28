import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";

class LogNavigationRepository {
  getJstRange(dateString: string, unit: "day" | "week" | "month" = "day") {
    const baseDate = dayjs.tz(dateString);

    return {
      start: baseDate.startOf(unit).utc().toDate(),
      end: baseDate.endOf(unit).utc().toDate(),
      label: baseDate.format("YYYY-MM-DD"),
      unit,
    };
  }

  async getRangeNavigation(
    userId: string,
    version: string,
    range: { start: Date; end: Date; unit: string },
    groupedBy: "createdAt" | "lastPlayed" = "createdAt",
  ) {
    const { start, end } = range;
    const isLastPlayed = groupedBy === "lastPlayed";
    const dateCol = isLastPlayed ? "lastPlayed" : "createdAt";
    const columns: ("lastPlayed" | "createdAt" | "totalBpi")[] = isLastPlayed
      ? [dateCol]
      : [dateCol, "totalBpi"];
    const table = isLastPlayed ? "scores" : "logs";

    const [prevRow, nextRow] = await Promise.all([
      db
        .selectFrom(table)
        .select(columns)
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where(dateCol, "<", start)
        .orderBy(dateCol, "desc")
        .executeTakeFirst(),
      db
        .selectFrom(table)
        .select(columns)
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where(dateCol, ">", end)
        .orderBy(dateCol, "asc")
        .executeTakeFirst(),
    ]);

    return {
      prevDate: prevRow,
      nextDate: nextRow,
    };
  }

  async getBatchNavigation(
    userId: string,
    version: string,
    currentCreatedAt: Date,
    range?: { start: Date; end: Date; unit: "day" | "week" | "month" },
  ) {
    const [prevBatch, nextBatch, rangeNav] = await Promise.all([
      db
        .selectFrom("logs")
        .select(["batchId", "createdAt", "totalBpi"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("createdAt", "<", currentCreatedAt)
        .orderBy("createdAt", "desc")
        .executeTakeFirst(),
      db
        .selectFrom("logs")
        .select(["batchId", "createdAt", "totalBpi"])
        .where("userId", "=", userId)
        .where("version", "=", version)
        .where("createdAt", ">", currentCreatedAt)
        .orderBy("createdAt", "asc")
        .executeTakeFirst(),
      range
        ? this.getRangeNavigation(userId, version, range)
        : Promise.resolve({ prevDate: null, nextDate: null }),
    ]);

    return {
      prev: prevBatch || null,
      next: nextBatch || null,
      ...rangeNav,
    };
  }

  /**
   * 特定のバッチIDからログ情報を取得します
   */
  async findBatchById(batchId: string) {
    return await db
      .selectFrom("logs")
      .select(["batchId", "createdAt", "totalBpi"])
      .where("batchId", "=", batchId)
      .executeTakeFirst();
  }

  /**
   * 指定されたJSTの期間内に含まれる全てのバッチを取得します
   */
  async findBatchesInRange(
    userId: string,
    version: string,
    start: Date,
    end: Date,
  ) {
    return await db
      .selectFrom("logs")
      .select(["batchId", "createdAt", "totalBpi"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .orderBy("createdAt", "asc")
      .execute();
  }
}

export const navigationRepo = new LogNavigationRepository();
