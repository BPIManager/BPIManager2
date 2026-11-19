import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { todayJst } from "@/lib/dayjs";
import { correctInfinitasTitle } from "@/utils/csv/correct-title";

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

/** マスタ更新（songs / songDef の追加・再計算）が日中に反映されるまでの最大待ち時間 */
const CACHE_TTL_MS = 60 * 60 * 1000;

type CacheEntry = {
  data: Map<string, CachedSongWithDef>;
  date: string;
  loadedAt: number;
};

let cache: CacheEntry | null = null;
let loadingPromise: Promise<CacheEntry> | null = null;
/** 無効化のたびに増やし、読み込み中に無効化されたときに古いデータで上書きしないために使う */
let generation = 0;

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
  if (cache && cache.date === today && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache;
  }

  if (!loadingPromise) {
    const startedGeneration = generation;
    loadingPromise = loadCache()
      .then((data) => {
        const entry = { data, date: today, loadedAt: Date.now() };
        if (startedGeneration === generation) cache = entry;
        loadingPromise = null;
        return entry;
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

/**
 * 完全一致で見つからなかった INFINITAS の曲名を、固定の1:1対応表（infinitas-title-corrections.json）で
 * アーケード表記に直して探し直す。対応表に載っている曲名だけが対象で、あいまい照合はしない。
 *
 * @returns 対応表で直した結果の曲。対応表に無い、または直した先にも曲が無ければ null
 */
export async function findSongWithDefByCorrectedTitle(
  title: string,
  difficulty: string,
): Promise<CachedSongWithDef | null> {
  const corrected = correctInfinitasTitle(title.trim());
  if (corrected === title.trim()) return null;
  const { data } = await getOrLoadCache();
  return data.get(`${corrected}::${difficulty}`) ?? null;
}

export function invalidateSongDefsCache(): void {
  generation += 1;
  cache = null;
  loadingPromise = null;
}
