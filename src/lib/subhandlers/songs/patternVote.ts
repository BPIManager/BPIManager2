import type { NextApiRequest } from "next";
import { songPatternsRepo } from "@/lib/db/domains/songPatterns";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { num, type HandleOutcome } from "./_shared";
import type { VoteType } from "@/types/db";

export async function handleSongPatternVote(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const songId = num(req.query.songId);
  if (songId === null) {
    return {
      result: err(400, "Invalid songId"),
      targetUserId: "",
      viewerId: null,
    };
  }
  const pattern = req.query.pattern;
  if (!pattern || Array.isArray(pattern)) {
    return {
      result: err(400, "Invalid pattern"),
      targetUserId: "",
      viewerId: null,
    };
  }
  const uid = (await resolveOptionalUid(req)) ?? null;
  const b = { targetUserId: uid ?? "", viewerId: uid };
  if (!uid) return { result: err(401, "Unauthorized"), ...b };

  if (req.method === "POST") {
    const { voteType } = req.body ?? {};
    if (voteType !== "upvote" && voteType !== "downvote") {
      return {
        result: err(400, "voteType must be upvote or downvote"),
        ...b,
      };
    }
    await songPatternsRepo.vote(songId, pattern, uid, voteType as VoteType);
    return { result: ok({ ok: true }), ...b };
  }

  await songPatternsRepo.deleteVote(songId, pattern, uid);
  return { result: ok({ ok: true }), ...b };
}
