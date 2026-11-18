import type { NextApiRequest } from "next";
import { songPatternsRepo } from "@/lib/db/domains/songPatterns";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { type HandleOutcome } from "./_shared";
import type { VoteType } from "@/types/db";
import { invalidParam, parseIntParam } from "@/lib/validation/params";
import { parseInput } from "@/lib/validation/parse";
import { patternVoteBodySchema } from "@/schemas/songs/input";

export async function handleSongPatternVote(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const songId = parseIntParam("songId", req.query.songId);
  if (songId === null) {
    return {
      result: invalidParam("songId", req.query.songId, "Invalid songId"),
      targetUserId: "",
      viewerId: null,
    };
  }
  const pattern = req.query.pattern;
  if (!pattern || Array.isArray(pattern)) {
    return {
      result: invalidParam("pattern", req.query.pattern, "Invalid pattern"),
      targetUserId: "",
      viewerId: null,
    };
  }
  const uid = (await resolveOptionalUid(req)) ?? null;
  const b = { targetUserId: uid ?? "", viewerId: uid };
  if (!uid) return { result: err(401, "Unauthorized"), ...b };

  if (req.method === "POST") {
    const input = parseInput(patternVoteBodySchema, req.body ?? {}, { in: "body" });
    if (!input.success) {
      return { result: input.result, ...b };
    }
    const { voteType } = input.data;
    await songPatternsRepo.vote(songId, pattern, uid, voteType as VoteType);
    return { result: ok({ ok: true }), ...b };
  }

  await songPatternsRepo.deleteVote(songId, pattern, uid);
  return { result: ok({ ok: true }), ...b };
}
