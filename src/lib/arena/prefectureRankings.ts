import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
  rmSync,
} from "fs";
import { join } from "path";
import { latestVersion } from "@/constants/iidx/iidxVersions";

export interface AreaRankInfo {
  area: string;
  areaRank: number;
  totalInArea: number;
}

const CACHE_VERSION = 1;

interface CacheFile {
  version: number;
  sourceFile: string;
  generatedAt: string;
  rankings: Record<string, AreaRankInfo>;
}

interface ArenaPlayer {
  id: string;
  area: string;
  arena_class: string;
  rank: number;
}

interface ArenaGrade {
  grade_id: number;
  players: ArenaPlayer[];
}

interface ArenaJson {
  fetchedAt: string;
  grades: ArenaGrade[];
}

const DATA_DIR = join(
  process.cwd(),
  "public",
  "data",
  "metrics",
  "arena_official",
);
const CACHE_DIR = join(DATA_DIR, "cache");
const CACHE_FILE = join(CACHE_DIR, "prefecture_rankings.json");

let memoryCache: CacheFile | null = null;
let latestDateJsonCache: { result: { absolutePath: string; sourceFile: string } | null; checkedAt: number } | null = null;
const LATEST_JSON_TTL_MS = 60_000;

function getLatestDateJson(): {
  absolutePath: string;
  sourceFile: string;
} | null {
  const now = Date.now();
  if (latestDateJsonCache && now - latestDateJsonCache.checkedAt < LATEST_JSON_TTL_MS) {
    return latestDateJsonCache.result;
  }

  const versionDir = join(DATA_DIR, latestVersion);
  if (!existsSync(versionDir)) {
    latestDateJsonCache = { result: null, checkedAt: now };
    return null;
  }

  const files = readdirSync(versionDir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();

  if (files.length === 0) {
    latestDateJsonCache = { result: null, checkedAt: now };
    return null;
  }

  const latest = files[files.length - 1];
  const result = {
    absolutePath: join(versionDir, latest),
    sourceFile: `${latestVersion}/${latest}`,
  };
  latestDateJsonCache = { result, checkedAt: now };
  return result;
}

function buildRankings(data: ArenaJson): Record<string, AreaRankInfo> {
  const areaPlayers: Record<
    string,
    { id: string; arenaClass: string; rank: number }[]
  > = {};

  for (const grade of data.grades) {
    for (const player of grade.players) {
      if (!player.id || !player.area) continue;
      const cls = player.arena_class?.toLowerCase() ?? "";
      if (!cls.startsWith("a")) continue;
      if (!areaPlayers[player.area]) areaPlayers[player.area] = [];
      areaPlayers[player.area].push({
        id: player.id,
        arenaClass: cls,
        rank: player.rank,
      });
    }
  }

  const rankings: Record<string, AreaRankInfo> = {};
  for (const [area, players] of Object.entries(areaPlayers)) {
    players.sort((a, b) =>
      a.arenaClass !== b.arenaClass
        ? a.arenaClass < b.arenaClass
          ? -1
          : 1
        : a.rank - b.rank,
    );
    const total = players.length;
    players.forEach((p, i) => {
      rankings[p.id] = { area, areaRank: i + 1, totalInArea: total };
    });
  }

  return rankings;
}

function generateCache(): CacheFile | null {
  const latest = getLatestDateJson();
  if (!latest) return null;

  const raw = readFileSync(latest.absolutePath, "utf-8");
  const data: ArenaJson = JSON.parse(raw);
  const rankings = buildRankings(data);

  const cache: CacheFile = {
    version: CACHE_VERSION,
    sourceFile: latest.sourceFile,
    generatedAt: new Date().toISOString(),
    rankings,
  };

  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(cache), "utf-8");
  } catch {}

  return cache;
}

function isCacheValid(cache: CacheFile, sourceFile: string): boolean {
  return cache.version === CACHE_VERSION && cache.sourceFile === sourceFile;
}

function loadCache(): CacheFile | null {
  const latest = getLatestDateJson();
  if (!latest) return null;

  if (memoryCache && isCacheValid(memoryCache, latest.sourceFile)) {
    return memoryCache;
  }
  memoryCache = null;

  if (existsSync(CACHE_FILE)) {
    try {
      const raw = readFileSync(CACHE_FILE, "utf-8");
      const cache: CacheFile = JSON.parse(raw);
      if (isCacheValid(cache, latest.sourceFile)) {
        memoryCache = cache;
        return cache;
      }
      rmSync(CACHE_FILE, { force: true });
    } catch {}
  }

  const cache = generateCache();
  if (cache) memoryCache = cache;
  return cache;
}

export function getUserAreaRank(
  rawIidxId: string | null | undefined,
): AreaRankInfo | null {
  if (!rawIidxId) return null;

  const cache = loadCache();
  if (!cache) return null;

  const normalized = rawIidxId.replace(/^(\d{4})(\d{4})$/, "$1-$2");

  return cache.rankings[normalized] ?? cache.rankings[rawIidxId] ?? null;
}
