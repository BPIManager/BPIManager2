import fs from "fs/promises";
import path from "path";

export type ArenaAverageEntry = {
  avgExScore: number;
  rate: number;
  count: number;
  avgBpi?: number;
};

type ArenaEntry = {
  title: string;
  difficulty: string;
  averages: Record<string, ArenaAverageEntry>;
};

type CacheEntry = {
  data: ArenaEntry[];
  date: string; // YYYY-MM-DD (JST)
};

const cache = new Map<string, CacheEntry>();

function todayJst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

/**
 * バージョン + レベルのアリーナ平均データを返す。
 * ローカルの public/data/metrics/arena/<version>_<level>.json を読み込み、
 * 同日内はメモリキャッシュから返す。
 */
export async function getArenaAverages(
  version: string,
  level: number,
): Promise<ArenaEntry[] | null> {
  const key = `${version}_${level}`;
  const today = todayJst();
  const cached = cache.get(key);

  if (cached && cached.date === today) {
    return cached.data;
  }

  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "metrics",
    "arena",
    `${key}.json`,
  );

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data: ArenaEntry[] = JSON.parse(raw);
    cache.set(key, { data, date: today });
    return data;
  } catch {
    return null;
  }
}

/**
 * アリーナ平均キャッシュを全破棄する。
 * generateArenaJson() 完了後に呼び出すこと。
 */
export function invalidateArenaAveragesCache(): void {
  cache.clear();
}
