import type { NextApiRequest } from "next";
import { songNotesAggregateRepo } from "@/lib/db/aggregates/songNotes";
import { ok } from "@/middlewares/api/apiResult";
import { type HandleOutcome } from "./_shared";

export async function handleRecentSongNotes(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const PAGE_SIZE = 20;
  const sort = req.query.sort === "upvotes" ? "upvotes" : "latest";
  const page = Math.max(0, parseInt(String(req.query.page ?? "0"), 10) || 0);
  const notes = await songNotesAggregateRepo.getRecentNotes(
    sort,
    PAGE_SIZE,
    page * PAGE_SIZE,
  );
  return { result: ok(notes), targetUserId: "", viewerId: null };
}

/* ------------------------------ patterns ------------------------------ */

/** GET /songs/[songId]/patterns */
