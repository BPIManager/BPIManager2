import { db } from "@/lib/db";
import { latestVersion } from "@/constants/latestVersion";

export type CachedSongWithDef = {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
};

type CacheEntry = {
  data: Map<string, CachedSongWithDef>;
  date: string;
};

let cache: CacheEntry | null = null;

function todayJst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function loadCache(): Promise<Map<string, CachedSongWithDef>> {
  const rows = await db
    .selectFrom("songs as s")
    .leftJoin(
      (qb) =>
        qb
          .selectFrom("songDef")
          .select(["songId", "wrScore", "kaidenAvg", "coef"])
          .where("isCurrent", "=", 1)
          .as("def"),
      (join) => join.onRef("def.songId", "=", "s.songId"),
    )
    .select([
      "s.songId",
      "s.title",
      "s.difficulty",
      "s.difficultyLevel",
      "s.notes",
      "def.wrScore",
      "def.kaidenAvg",
      "def.coef",
    ])
    .where((eb) =>
      eb.or([
        eb("s.deletedAt", "is", null),
        eb("s.deletedAt", ">", latestVersion),
      ]),
    )
    .execute();

  return new Map(
    rows.map((row) => [
      `${row.title}::${row.difficulty}`,
      row as CachedSongWithDef,
    ]),
  );
}

export async function getSongWithDefCached(
  title: string,
  difficulty: string,
): Promise<CachedSongWithDef | null> {
  const today = todayJst();
  if (!cache || cache.date !== today) {
    cache = { data: await loadCache(), date: today };
  }
  return cache.data.get(`${title}::${difficulty}`) ?? null;
}

export function invalidateSongDefsCache(): void {
  cache = null;
}
