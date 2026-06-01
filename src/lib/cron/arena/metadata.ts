import fs from "fs/promises";
import path from "path";
import { latestVersion } from "@/constants/latestVersion";
import type { IIDXVersion } from "@/types/iidx/version";
import type { ArenaEventEntry, ArenaVersionMetadata } from "./types";

const UA = "Nodejs";

interface CachedArenaPeriod {
  start: Date;
  end: Date;
  round: number;
  fetchedAt: Date;
}

let _cachedArenaPeriod: CachedArenaPeriod | null = null;
const PERIOD_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

function getMetadataFile(version: IIDXVersion): string {
  return path.join(
    process.cwd(),
    `public/data/metrics/arena_official/metadata/${version}.json`,
  );
}

async function loadMetadata(version: IIDXVersion): Promise<ArenaVersionMetadata> {
  try {
    const raw = await fs.readFile(getMetadataFile(version), "utf-8");
    return JSON.parse(raw) as ArenaVersionMetadata;
  } catch {
    return { version, events: [] };
  }
}

async function saveMetadata(metadata: ArenaVersionMetadata): Promise<void> {
  const file = getMetadataFile(metadata.version);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(metadata, null, 2));
}

function mergeEvents(
  existing: ArenaEventEntry[],
  incoming: ArenaEventEntry[],
): ArenaEventEntry[] {
  const map = new Map<number, ArenaEventEntry>();
  for (const e of existing) if (e.round > 0) map.set(e.round, e);
  for (const e of incoming) if (e.round > 0) map.set(e.round, e);
  return Array.from(map.values()).sort((a, b) => b.round - a.round);
}

function parseAllArenaEvents(html: string): ArenaEventEntry[] {
  const events: ArenaEventEntry[] = [];
  const blockPattern = /<ul class="news-main">([\s\S]*?)<\/ul>/g;
  let match;

  while ((match = blockPattern.exec(html)) !== null) {
    const block = match[1];
    if (!block.includes("ARENAモード")) continue;

    const dateMatch = block.match(/<li>(\d{4})\/\d{2}\/\d{2}<\/li>/);
    const newsYear = dateMatch ? parseInt(dateMatch[1]) : new Date().getUTCFullYear();

    // Pattern A: 開催期間はX月X日（曜日）HH:MM～X月X日（曜日）HH:MMまで
    const stdPm = block.match(
      /開催期間は(\d+)月(\d+)日[（(][^）)]*[）)]\s*(\d+):(\d+)～(\d+)月(\d+)日[（(][^）)]*[）)]\s*(\d+):(\d+)まで/,
    );
    if (stdPm) {
      const [, sm, sd, sh, smin, em, ed, eh, emin] = stdPm.map(Number);
      const endYear = em < sm ? newsYear + 1 : newsYear;
      const roundMatch = block.match(/第(\d+)回/);
      events.push({
        round: roundMatch ? parseInt(roundMatch[1]) : 0,
        start: new Date(Date.UTC(newsYear, sm - 1, sd, sh - 9, smin)).toISOString(),
        end: new Date(Date.UTC(endYear, em - 1, ed, eh - 9, emin)).toISOString(),
      });
      continue;
    }

    // Pattern B: X月X日（曜日）H時よりスタート + 第N回開催期間はX月X日（曜日）HH:MMまで
    // (round 1 style: start and end are in separate sentences)
    const startPm = block.match(
      /(\d+)月(\d+)日[（(][^）)]*[）)]\s*(\d+)時よりスタート/,
    );
    const endPm = block.match(
      /第(\d+)回開催期間は(\d+)月(\d+)日[（(][^）)]*[）)]\s*(\d+):(\d+)まで/,
    );
    if (startPm && endPm) {
      const [, stm, std, sth] = startPm.map(Number);
      const [, r, em, ed, eh, emin] = endPm.map(Number);
      const endYear = em < stm ? newsYear + 1 : newsYear;
      events.push({
        round: r,
        start: new Date(Date.UTC(newsYear, stm - 1, std, sth - 9, 0)).toISOString(),
        end: new Date(Date.UTC(endYear, em - 1, ed, eh - 9, emin)).toISOString(),
      });
    }
  }

  return events;
}

/**
 * 指定バージョンの公式infoページからアリーナ開催情報をフェッチし、
 * public/data/metrics/arena_official/metadata/{version}.json に保存する。
 */
export async function fetchArenaMetadataForVersion(
  version: IIDXVersion,
): Promise<ArenaVersionMetadata> {
  const url = `https://p.eagate.573.jp/game/2dx/${version}/info/index.html`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching info page for version ${version}`);
  const html = await res.text();
  const incoming = parseAllArenaEvents(html);
  const existing = await loadMetadata(version);
  const merged = mergeEvents(existing.events, incoming);
  const metadata: ArenaVersionMetadata = { version, events: merged };
  await saveMetadata(metadata);
  if (merged.length > existing.events.length) {
    console.log(
      `[Arena] New event(s) detected for v${version}: ${merged.length} total (was ${existing.events.length})`,
    );
  }
  return metadata;
}

export async function getArenaEventPeriod(): Promise<{
  start: Date;
  end: Date;
  round: number;
} | null> {
  const now = new Date();
  if (
    _cachedArenaPeriod &&
    now.getTime() - _cachedArenaPeriod.fetchedAt.getTime() < PERIOD_CACHE_TTL_MS
  ) {
    const { start, end, round } = _cachedArenaPeriod;
    return { start, end, round };
  }
  try {
    const { events } = await fetchArenaMetadataForVersion(latestVersion);
    if (events.length === 0) return null;
    const latest = events[0]; // sorted desc by round
    _cachedArenaPeriod = {
      start: new Date(latest.start),
      end: new Date(latest.end),
      round: latest.round,
      fetchedAt: now,
    };
    console.log(`[Arena] Period cached: Round ${latest.round}`);
    return { start: _cachedArenaPeriod.start, end: _cachedArenaPeriod.end, round: latest.round };
  } catch (err) {
    console.warn("[ArenaEvent] Failed to fetch event period:", err);
    return null;
  }
}
