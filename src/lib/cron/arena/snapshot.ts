import fs from "fs/promises";
import path from "path";

import type { IIDXVersion } from "@/types/iidx/version";

export function getOutputFile(version: IIDXVersion) {
  return path.join(
    process.cwd(),
    `public/data/info/arena_official/${version}/latest.json`,
  );
}

export function getMetricsDir(version: IIDXVersion) {
  return path.join(
    process.cwd(),
    `public/data/metrics/arena_official/${version}`,
  );
}

export interface PlayerRecord {
  id: string;
  c: string;  // arena_class
  w: number;  // wins
}

export interface PlayersSnapshot {
  fetchedAt: string;
  players: PlayerRecord[];
}

export function getPlayersFile(version: IIDXVersion) {
  return path.join(process.cwd(), `public/data/info/arena_official/${version}/latest_players.json`);
}

export function getActiveFile(version: IIDXVersion) {
  return path.join(process.cwd(), `public/data/info/arena_official/${version}/active.json`);
}

export function getActiveBackupFile(version: IIDXVersion, prevFetchedAt: string, generatedAt: string) {
  const fmt = (iso: string) => iso.slice(0, 16).replace(/[T:]/g, "-");
  return path.join(
    process.cwd(),
    `public/data/info/arena_official/${version}/old/${fmt(prevFetchedAt)}~${fmt(generatedAt)}.json`,
  );
}

export async function loadPlayersSnapshot(version: IIDXVersion): Promise<PlayersSnapshot | null> {
  try {
    const raw = await fs.readFile(getPlayersFile(version), "utf-8");
    return JSON.parse(raw) as PlayersSnapshot;
  } catch {
    // 初回実行時はスナップショットファイルが存在しないため、意図的に握りつぶしnullを返す
    return null;
  }
}

export function computeActiveByClass(
  prev: PlayersSnapshot | null,
  current: PlayerRecord[],
): Record<string, number> {
  if (!prev) return {};
  const prevMap = new Map(prev.players.map((p) => [p.id, p]));
  const byClass: Record<string, number> = {};
  for (const p of current) {
    const pp = prevMap.get(p.id);
    if (!pp || pp.w !== p.w || pp.c !== p.c) {
      byClass[p.c] = (byClass[p.c] ?? 0) + 1;
    }
  }
  return byClass;
}

export function roundTo15Min(date: Date): Date {
  const ms = 15 * 60 * 1000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}
