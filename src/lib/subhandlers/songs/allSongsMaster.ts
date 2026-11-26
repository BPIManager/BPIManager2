import { createHash } from "node:crypto";
import { allSongsRepo } from "@/lib/db/domains/allSongs";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import type { HandlerResult } from "@/types/api";

export interface AllSongsMasterEntry {
  songId: number;
  title: string;
  /** アーティスト名。未登録の曲では省略する */
  artist?: string;
  playStyle: "SP";
  difficulty: string;
  level: number;
  notes: number;
}

export interface AllSongsMasterBody {
  /** 内容のハッシュ。クライアントが更新有無の判定に使う */
  version: string;
  songs: AllSongsMasterEntry[];
}

type Row = Awaited<ReturnType<typeof allSongsRepo.getPublicMaster>>[number];

/** DB 行を配信形式に整形し、内容から version を決める（純粋関数） */
export function buildAllSongsMaster(rows: Row[]): AllSongsMasterBody {
  const songs: AllSongsMasterEntry[] = rows.map((r) => ({
    songId: r.songId,
    title: r.title,
    ...(r.artist ? { artist: r.artist } : {}),
    playStyle: "SP" as const,
    difficulty: r.difficulty,
    level: r.difficultyLevel,
    notes: r.notes,
  }));
  const version = createHash("sha1").update(JSON.stringify(songs)).digest("hex").slice(0, 16);
  return { version, songs };
}

/** GET /songs/master */
export async function handleAllSongsMaster(): Promise<HandlerResult<AllSongsMasterBody>> {
  try {
    return ok(buildAllSongsMaster(await allSongsRepo.getPublicMaster()));
  } catch (error: unknown) {
    return err(500, toErrorMessage(error));
  }
}
