import { err, ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";
import type { SongPlayerEntry } from "@/types/siteStats";
import type { NextApiRequest } from "next";
import { readJsonFile } from "./_shared";

/** GET /site/songs/popular */
export async function handleSongPopulation(
  req: NextApiRequest,
): Promise<HandlerResult<unknown>> {
  const order = req.query.order === "bottom" ? "bottom" : "top";
  const offset = Math.max(0, parseInt(String(req.query.offset ?? "0"), 10) || 0);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(String(req.query.limit ?? "10"), 10) || 10),
  );

  try {
    const { songs: allSongs } = (await readJsonFile(
      "public/data/info/songs.json",
    )) as { songs: SongPlayerEntry[] };

    // top = 降順（ファイルは playerCount 降順で保存済み） / bottom = 逆順
    const ordered = order === "bottom" ? [...allSongs].reverse() : allSongs;
    const page = ordered.slice(offset, offset + limit);

    return ok({
      songs: page,
      total: allSongs.length,
      hasMore: offset + page.length < allSongs.length,
    });
  } catch {
    return err(
      503,
      "Song data is not yet available. Please try again later.",
    );
  }
}
