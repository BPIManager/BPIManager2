import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { todayJst } from "@/lib/dayjs";

export type CachedSongWithDef = {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
  mu: number | null;
  sigma: number | null;
  residualVar: number | null;
};

type CacheEntry = {
  data: Map<string, CachedSongWithDef>;
  date: string;
};

let cache: CacheEntry | null = null;
let loadingPromise: Promise<CacheEntry> | null = null;

async function loadCache(): Promise<Map<string, CachedSongWithDef>> {
  const rows = await songMasterRepo.getAllSongsWithCurrentDef();

  return new Map(
    rows.map((row) => [
      `${row.title}::${row.difficulty}`,
      row as CachedSongWithDef,
    ]),
  );
}

async function getOrLoadCache(): Promise<CacheEntry> {
  const today = todayJst();
  if (cache && cache.date === today) return cache;

  if (!loadingPromise) {
    loadingPromise = loadCache()
      .then((data) => {
        cache = { data, date: today };
        loadingPromise = null;
        return cache;
      })
      .catch((err) => {
        loadingPromise = null;
        throw err;
      });
  }

  return loadingPromise;
}

export async function getSongWithDefCached(
  title: string,
  difficulty: string,
): Promise<CachedSongWithDef | null> {
  const { data } = await getOrLoadCache();
  return data.get(`${title}::${difficulty}`) ?? null;
}

export function invalidateSongDefsCache(): void {
  cache = null;
}
