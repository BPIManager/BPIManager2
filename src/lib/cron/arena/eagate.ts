
import type { IIDXVersion } from "@/types/iidx/version";

export const UA = "Nodejs";

export const GRADE_IDS = [0];

export interface EagatePlayer {
  id: string;
  arena_class: string;
  area: string;
  grade_sp: string;
  grade_dp: string;
  rank: number;
  win: string;
  a1continue: string;
}

export function getUrls(version: IIDXVersion) {
  const BASE = `https://p.eagate.573.jp/game/2dx/${version}/ranking`;
  return {
    sessionUrl: `${BASE}/arena/top_ranking.html`,
    rankingUrl: `${BASE}/json/arena_class.html`,
  };
}

/**
 * ImprevaのCookie拾いつつarena_classをfetchする
 */
export async function acquireSessionCookie(sessionUrl: string): Promise<string> {
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

export async function fetchGrade(
  gradeId: number,
  cookie: string,
  rankingUrl: string,
  sessionUrl: string,
): Promise<EagatePlayer[]> {
  console.log(`[fetchGrade] Starting fetch for grade_id=${gradeId}`);
  const seen = new Map<string, EagatePlayer>();

  for (let page = 0; page <= 12; page++) {
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

    // ページ超過時は最終ページと同じデータが返ってくるため、既出IDで判定して打ち切る
    const beforeSize = seen.size;
    for (const p of list) {
      seen.set(p.id, p);
    }
    if (seen.size === beforeSize) {
      console.log(
        `[fetchGrade] Duplicate page detected at page=${page}, stopping.`,
      );
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const players = Array.from(seen.values());
  console.log(
    `[fetchGrade] Total fetched for grade_id=${gradeId}: ${players.length} players (unique).`,
  );
  return players;
}

export function normalizeId(id: string): string {
  return id.replace(/-/g, "");
}
