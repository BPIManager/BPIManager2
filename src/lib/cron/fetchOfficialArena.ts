import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { latestVersion } from "@/constants/latestVersion";
import { ARENA_RANK_ORDER } from "@/lib/db/siteStats";
import { upsertOfficialArenaStats } from "@/lib/db/officialArenaStats";
import type { IIDXVersion } from "@/types/iidx/version";

const UA = "Nodejs";

const GRADE_IDS = [0];

interface EagatePlayer {
  id: string;
  arena_class: string;
  area: string;
  grade_sp: string;
  grade_dp: string;
  rank: number;
  win: string;
}

function getUrls(version: IIDXVersion) {
  const BASE = `https://p.eagate.573.jp/game/2dx/${version}/ranking`;
  return {
    sessionUrl: `${BASE}/arena/top_ranking.html`,
    rankingUrl: `${BASE}/json/arena_class.html`,
  };
}

function getOutputFile(version: IIDXVersion) {
  return path.join(
    process.cwd(),
    `public/data/info/arena_official/${version}/latest.json`,
  );
}

function getMetricsDir(version: IIDXVersion) {
  return path.join(
    process.cwd(),
    `public/data/metrics/arena_official/${version}`,
  );
}

/**
 * ImprevaのCookie拾いつつarena_classをfetchする
 */
async function acquireSessionCookie(sessionUrl: string): Promise<string> {
  const cookieMap = new Map<string, string>();

  const collectCookies = (headers: Headers) => {
    const raw = headers.getSetCookie?.() ?? [];
    const lines =
      raw.length > 0
        ? raw
        : (headers.get("set-cookie") ?? "").split(/,(?=[^ ].*?=)/);
    for (const line of lines) {
      const pair = line.split(";")[0].trim();
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      cookieMap.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  };

  let url = sessionUrl;
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": UA,
        Cookie: [...cookieMap.entries()]
          .map(([k, v]) => `${k}=${v}`)
          .join("; "),
      },
      redirect: "manual",
    });
    collectCookies(res.headers);

    const location = res.headers.get("location");
    if (!location || res.status < 300 || res.status >= 400) break;

    const next = location.startsWith("/")
      ? `https://p.eagate.573.jp${location}`
      : location;
    if (!next.startsWith("https://p.eagate.573.jp")) break;
    url = next;
  }
  return [...cookieMap.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function fetchGrade(
  gradeId: number,
  cookie: string,
  rankingUrl: string,
  sessionUrl: string,
): Promise<EagatePlayer[]> {
  console.log(`[fetchGrade] Starting fetch for grade_id=${gradeId}`);
  const allPlayers: EagatePlayer[] = [];

  for (let page = 0; page <= 10; page++) {
    console.log(`[fetchGrade] Fetching grade_id=${gradeId}, page=${page}...`);

    const res = await fetch(rankingUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": UA,
        Cookie: cookie,
        Referer: sessionUrl,
        Origin: "https://p.eagate.573.jp",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: new URLSearchParams({
        grade_id: String(gradeId),
        play_style: "0",
        page: String(page),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `grade_id=${gradeId}, page=${page} failed: HTTP ${res.status}\n${body.slice(0, 200)}`,
      );
    }

    const json = await res.json();
    const list = (json.list ?? []) as EagatePlayer[];

    if (list.length === 0) {
      console.log(`[fetchGrade] Reached the end of data at page=${page}.`);
      break;
    }

    allPlayers.push(...list);

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(
    `[fetchGrade] Total fetched for grade_id=${gradeId}: ${allPlayers.length} players.`,
  );
  return allPlayers;
}

function normalizeId(id: string): string {
  return id.replace(/-/g, "");
}

export async function fetchOfficialArenaDistribution(
  version: IIDXVersion = latestVersion,
) {
  console.log(`[OfficialArena] version=${version} Acquiring session cookie...`);
  const { sessionUrl, rankingUrl } = getUrls(version);
  const outputFile = getOutputFile(version);
  const metricsDir = getMetricsDir(version);

  const cookie = await acquireSessionCookie(sessionUrl);
  if (!cookie) {
    console.warn("[OfficialArena] Failed to acquire session cookie, skipping.");
    return;
  }
  console.log(
    `[OfficialArena] Session acquired (${cookie.split(";").length} cookies). Fetching all grade_ids...`,
  );

  const results = await Promise.all(
    GRADE_IDS.map((id) => fetchGrade(id, cookie, rankingUrl, sessionUrl)),
  );

  const playerClassMap = new Map<string, string>();
  for (const list of results) {
    for (const p of list) {
      playerClassMap.set(normalizeId(p.id), p.arena_class.toUpperCase());
    }
  }

  const users = await db
    .selectFrom("users")
    .select(["userId", "iidxId"])
    .where("iidxId", "is not", null)
    .execute();

  const fetchedAt = new Date();
  const rawByNormalizedId = new Map<string, (typeof results)[0][0]>();
  for (const list of results) {
    for (const p of list) {
      rawByNormalizedId.set(normalizeId(p.id), p);
    }
  }

  const countMap = new Map<string, number>();
  const statsRecords: Parameters<typeof upsertOfficialArenaStats>[0] = [];

  for (const user of users) {
    if (!user.iidxId) continue;
    const nid = normalizeId(user.iidxId);
    const arenaClass = playerClassMap.get(nid);
    if (arenaClass) {
      countMap.set(arenaClass, (countMap.get(arenaClass) ?? 0) + 1);
    }
    const raw = rawByNormalizedId.get(nid);
    if (raw) {
      statsRecords.push({
        userId: user.userId,
        version,
        area: raw.area ?? null,
        arenaClass: raw.arena_class.toUpperCase(),
        gradeSp: raw.grade_sp || null,
        gradeDp: raw.grade_dp || null,
        arenaRank: typeof raw.rank === "number" ? raw.rank : null,
        wins: (() => {
          const n = parseInt(raw.win ?? "");
          return isNaN(n) ? null : n;
        })(),
        fetchedAt,
      });
    }
  }

  const { inserted, skipped } = await upsertOfficialArenaStats(statsRecords);
  console.log(
    `[OfficialArena] DB upsert: inserted=${inserted}, skipped=${skipped}`,
  );

  const distribution = ARENA_RANK_ORDER.map((rank) => ({
    rank,
    count: countMap.get(rank) ?? 0,
  }));
  const totalMatched = distribution.reduce((s, r) => s + r.count, 0);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const metricsFile = path.join(metricsDir, `${dateStr}.json`);

  await fs.mkdir(metricsDir, { recursive: true });
  await fs.writeFile(
    metricsFile,
    JSON.stringify(
      {
        fetchedAt: now.toISOString(),
        grades: GRADE_IDS.map((id, i) => ({
          grade_id: id,
          players: results[i],
        })),
      },
      null,
      2,
    ),
  );

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(
    outputFile,
    JSON.stringify({
      distribution,
      totalMatched,
      totalPlayers: playerClassMap.size,
      generatedAt: now.toISOString(),
    }),
  );

  console.log(
    `[OfficialArena] Done. version=${version} Matched ${totalMatched}/${users.length} users (${playerClassMap.size} in rankings).`,
  );
}
