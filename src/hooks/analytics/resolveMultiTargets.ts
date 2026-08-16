import { authFetch, fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { BpiCalculator } from "@/lib/bpi";
import type { AnalyticsTarget } from "@/types/analytics";
import type { SongWithRival, SongWithScore } from "@/types/songs/score";
import {
  SCORE_RATE,
  toBpiParams,
  type ArenaAverageRow,
  type RivalAvgRow,
  type RivalTopRow,
  type BestEverRow,
} from "./comparisonRows";

type FbUser = { getIdToken: (forceRefresh?: boolean) => Promise<string> };

export interface MultiTargetValue {
  exScore: number | null;
  bpi: number | null;
}

/** 楽曲を一意に識別するキー（`title`しか持たないアリーナ集計との突合にも使う） */
export const songKey = (s: { title: string; difficulty: string }) =>
  `${s.title}__${s.difficulty}`;

/** `AnalyticsTarget`1件を一意に識別するキー（同じkindでも`param`違いは別ターゲット） */
export const targetKey = (t: AnalyticsTarget) => `${t.kind}:${t.param ?? ""}`;

async function fetchJson<T>(url: string, fbUser: FbUser | null): Promise<T> {
  const res = await authFetch(url, "GET", fbUser);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

/**
 * 1件の`AnalyticsTarget`を、楽曲キー付きのEX/BPIマップに解決する。
 *
 * `useAnalyticsComparison`(単一ターゲット版)が`kind`ごとに使い分けている
 * 既存のAPIエンドポイント・計算ロジックをそのまま再利用する。新規の
 * サーバー実装を増やさず、複数ターゲット分を並列に解決するためだけの層。
 *
 * @param myUserId - 自分のユーザー ID
 * @param target - 解決対象のターゲット
 * @param version - IIDX バージョン
 * @param myScores - 自分のスコア一覧（aaa/max-/wr/アリーナの算出に使う。未取得の場合は空扱い）
 * @param fbUser - 認証付きfetch用のFirebaseユーザー
 */
export async function resolveTarget(
  myUserId: string,
  target: AnalyticsTarget,
  version: string,
  myScores: SongWithScore[],
  fbUser: FbUser | null,
): Promise<Map<string, MultiTargetValue>> {
  const map = new Map<string, MultiTargetValue>();

  switch (target.kind) {
    case "rival": {
      if (!target.param) return map;
      const rows = await fetchJson<SongWithRival[]>(
        `${API_PREFIX}/users/${myUserId}/rivals/${target.param}/scores?version=${version}`,
        fbUser,
      );
      for (const row of rows) {
        map.set(songKey(row), {
          exScore: row.rival.exScore,
          bpi: row.rival.bpi,
        });
      }
      return map;
    }

    case "self-version": {
      if (!target.param) return map;
      const rows = await fetchJson<SongWithRival[]>(
        `${API_PREFIX}/users/${myUserId}/scores/self-version?currentVersion=${version}&targetVersion=${target.param}`,
        fbUser,
      );
      for (const row of rows) {
        map.set(songKey(row), {
          exScore: row.rival.exScore,
          bpi: row.rival.bpi,
        });
      }
      return map;
    }

    case "self-best":
    case "self-best-excl": {
      const excludeCurrent = target.kind === "self-best-excl";
      const rows = await fetchJson<BestEverRow[]>(
        `${API_PREFIX}/users/${myUserId}/scores/best-ever?currentVersion=${version}&excludeCurrent=${excludeCurrent}`,
        fbUser,
      );
      for (const row of rows) {
        map.set(songKey(row), { exScore: row.bestExScore, bpi: row.bestBpi });
      }
      return map;
    }

    case "rival-avg": {
      const rows = await fetchJson<RivalAvgRow[]>(
        `${API_PREFIX}/users/${myUserId}/rivals/following/avg-scores?version=${version}`,
        fbUser,
      );
      for (const row of rows) {
        map.set(songKey(row), {
          exScore: row.avgExScore !== null ? Math.round(row.avgExScore) : null,
          bpi: row.avgBpi,
        });
      }
      return map;
    }

    case "rival-top": {
      const rows = await fetchJson<RivalTopRow[]>(
        `${API_PREFIX}/users/${myUserId}/rivals/following/top-scores?version=${version}`,
        fbUser,
      );
      for (const row of rows) {
        map.set(songKey(row), {
          exScore: row.topExScore !== null ? Math.round(row.topExScore) : null,
          bpi: row.topBpi,
        });
      }
      return map;
    }

    case "arena": {
      const rank = target.param ?? "A1";
      // useComparisonSources.useArenaJsonと同じくバージョンは"32"に固定
      // (アリーナ集計データが現状v32分のみ存在するため)
      const [rows11, rows12] = await Promise.all([
        fetcher(`/data/metrics/arena/32_11.json`).catch(() => []),
        fetcher(`/data/metrics/arena/32_12.json`).catch(() => []),
      ]) as [ArenaAverageRow[], ArenaAverageRow[]];
      const arenaRows = [...rows11, ...rows12];

      const songIdsByKey = new Map<string, Set<number>>();
      for (const s of myScores) {
        const key = songKey(s);
        if (!songIdsByKey.has(key)) songIdsByKey.set(key, new Set());
        songIdsByKey.get(key)!.add(s.songId);
      }

      for (const row of arenaRows) {
        const avg = row.averages[rank];
        if (!avg) continue;
        const key = songKey(row);
        // 同名リメイク曲(同じtitle__difficultyで異なるsongId)が混在する場合は
        // 誤った平均と静かにマージされてしまうため、突合自体をスキップする
        if ((songIdsByKey.get(key)?.size ?? 0) > 1) continue;
        map.set(key, {
          exScore: Math.round(avg.avgExScore),
          bpi: avg.avgBpi ?? null,
        });
      }
      return map;
    }

    case "aaa":
    case "max-":
    case "wr": {
      for (const s of myScores) {
        const params = toBpiParams(s);
        const maxScore = s.notes * 2;
        const targetEx: number | null =
          target.kind === "wr"
            ? (s.wrScore ?? null)
            : maxScore > 0
              ? Math.ceil(maxScore * SCORE_RATE[target.kind as "aaa" | "max-"])
              : null;
        const targetBpi =
          targetEx !== null && params.kaidenAvg && params.wrScore
            ? (BpiCalculator.calc(targetEx, params) ?? null)
            : null;
        map.set(songKey(s), { exScore: targetEx, bpi: targetBpi });
      }
      return map;
    }

    default:
      return map;
  }
}
