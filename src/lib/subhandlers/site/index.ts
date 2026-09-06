import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { BpiCalculator } from "@/lib/bpi";
import { getArenaAverages } from "@/lib/cache/arenaAverages";
import { getSongWithDefCached } from "@/lib/cache/songDefs";
import { scoresRepo } from "@/lib/db/domains/scores";
import { supportersRepo } from "@/lib/db/aggregates/userProfiles/supporters";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { IIDX_VERSIONS, latestVersion } from "@/constants/iidx/iidxVersions";
import { resolveVersion, toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";
import type { SongPlayerEntry } from "@/types/siteStats";
import type { NextApiRequest } from "next";

/**
 * site 系（`/api/*` 直下の非ユーザースコープ・公開エンドポイント）の subhandler。
 * ユーザーコンテキストを持たないため `HandlerResult` をそのまま返し、meta は付けない。
 */

async function readJsonFile(relPath: string): Promise<unknown> {
  const raw = await fs.readFile(path.join(process.cwd(), relPath), "utf-8");
  return JSON.parse(raw);
}

/** GET /site/stats */
export async function handleSiteStats(): Promise<HandlerResult<unknown>> {
  try {
    return ok(await readJsonFile("public/data/info/stats.json"));
  } catch {
    return err(503, "Stats data is not yet available. Please try again later.");
  }
}

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

/** GET /site/arena/official */
export async function handleOfficialArena(
  req: NextApiRequest,
): Promise<HandlerResult<unknown>> {
  const version = resolveVersion(req.query.version);
  try {
    return ok(
      await readJsonFile(
        `public/data/info/arena_official/${version}/latest.json`,
      ),
    );
  } catch {
    return err(503, "Official arena data is not yet available.");
  }
}

/** GET /supporters */
export async function handleSupporters(): Promise<HandlerResult<unknown>> {
  try {
    const supporters = await supportersRepo.getSupporters(latestVersion);
    return ok({
      supporters: supporters.map((u) => ({
        userId: u.userId,
        userName: u.userName,
        iidxId: u.iidxId,
        profileImage: u.profileImage,
        totalBpi:
          u.totalBpi !== null && u.totalBpi !== undefined
            ? Number(u.totalBpi)
            : null,
        role: {
          role: u.role,
          description: u.description ?? "",
          grantedAt: u.grantedAt,
        },
      })),
    });
  } catch (error: unknown) {
    return err(500, toErrorMessage(error));
  }
}

const bpiCalcQuerySchema = z.object({
  title: z.string().min(1),
  difficulty: z.enum(IIDX_DIFFICULTIES),
  exScore: z.coerce.number().int().min(0),
  version: z
    .enum(IIDX_VERSIONS)
    .optional()
    .transform((v) => v ?? latestVersion),
  includeRank: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

/** GET /bpi/calc */
export async function handleBpiCalc(
  req: NextApiRequest,
): Promise<HandlerResult<unknown>> {
  const parsed = bpiCalcQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return err(400, "Invalid parameters");
  }

  const { title, difficulty, exScore, version, includeRank } = parsed.data;

  try {
    const song = await getSongWithDefCached(title, difficulty);
    if (!song) return err(404, "Song not found");

    if (exScore > song.notes * 2) {
      return err(400, `exScore exceeds maximum (${song.notes * 2})`);
    }

    const bpi = BpiCalculator.calc(exScore, {
      notes: song.notes,
      kaidenAvg: song.kaidenAvg ?? null,
      wrScore: song.wrScore ?? null,
      coef: song.coef ?? null,
    });

    const estimatedRankByFormula =
      bpi !== null ? BpiCalculator.estimateRank(bpi) : null;

    const { rank: bpimRank, total: bpimTotal } = includeRank
      ? await scoresRepo.getSongBpimRank(song.songId, exScore, version)
      : { rank: null, total: null };

    let arenaAverages = null;
    if (song.difficultyLevel === 11 || song.difficultyLevel === 12) {
      const entries = await getArenaAverages(version, song.difficultyLevel);
      const entry = entries?.find(
        (e) => e.title === song.title && e.difficulty === song.difficulty,
      );
      arenaAverages = entry?.averages ?? null;
    }

    return ok({
      song: {
        title: song.title,
        difficulty: song.difficulty,
        difficultyLevel: song.difficultyLevel,
        notes: song.notes,
      },
      bpi,
      rank: { estimatedRank: estimatedRankByFormula, bpimRank, bpimTotal },
      metadata: { version, arenaAverages },
    });
  } catch (error: unknown) {
    console.error("BPI calc error:", error);
    return err(500, toErrorMessage(error));
  }
}
