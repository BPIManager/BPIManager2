import type { NextApiRequest } from "next";
import { songsRepo } from "@/lib/db/domains/songs";
import { topElementMap } from "@/constants/iidx/radars/topElements";
import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import type { RadarCategory } from "@/types/stats/radar";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { num, resolveVersion, type HandleOutcome, type IIDXVersion } from "./_shared";

const SEARCH_LIMIT = 20;
/** 曲名指定なしで一覧表示する場合(レーダー項目/BPM帯)のDB取得上限・表示上限 */
const BROWSE_FETCH_LIMIT = 1000;
const BROWSE_DISPLAY_LIMIT = 150;

export type BpmBand = "slow" | "mid" | "fast";
const BPM_BANDS: BpmBand[] = ["slow", "mid", "fast"];

/**
 * 曲のBPM表記（"150"のような単一値・"120-180"のような可変速）から、
 * 平均値を代表値として低速(~135)/中速(135~170)/高速(170~)に分類する。
 */
function bpmBandOf(bpm: string): BpmBand {
  const parts = bpm
    .split(/[-〜~]/)
    .map((p) => Number(p.trim()))
    .filter((n) => !Number.isNaN(n));
  const avg =
    parts.length >= 2
      ? (parts[0] + parts[parts.length - 1]) / 2
      : (parts[0] ?? 0);
  if (avg < 135) return "slow";
  if (avg < 170) return "mid";
  return "fast";
}

/**
 * GET /songs/search?title=...&version=...&difficultyLevel=12
 *   &radarCategory=NOTES&bpmBand=slow
 *
 * title・radarCategory・bpmBandはいずれか1つ以上を指定する想定。titleは
 * 部分一致の絞り込み検索、radarCategory/bpmBandは曲名を介さない一覧表示
 * （ノーツレーダー項目別・BPM帯別）に使う。
 */
export async function handleSongSearch(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const title = typeof req.query.title === "string" ? req.query.title.trim() : "";
  const radarCategoryRaw =
    typeof req.query.radarCategory === "string" ? req.query.radarCategory : "";
  const radarCategory = (ALL_RADAR_CATEGORIES as string[]).includes(radarCategoryRaw)
    ? (radarCategoryRaw as RadarCategory)
    : undefined;
  const bpmBandRaw = typeof req.query.bpmBand === "string" ? req.query.bpmBand : "";
  const bpmBand = (BPM_BANDS as string[]).includes(bpmBandRaw)
    ? (bpmBandRaw as BpmBand)
    : undefined;

  if (title.length === 0 && !radarCategory && !bpmBand) {
    return { result: ok([]), ...base };
  }

  try {
    const isBrowsing = title.length === 0 && (radarCategory || bpmBand);
    const songs = await songsRepo.searchSongs({
      version: resolveVersion(req.query.version) as IIDXVersion,
      title: title || undefined,
      difficultyLevel: num(req.query.difficultyLevel) ?? undefined,
      limit: isBrowsing ? BROWSE_FETCH_LIMIT : SEARCH_LIMIT,
    });

    let filtered = songs;
    if (radarCategory) {
      filtered = filtered.filter(
        (s) => topElementMap.get(`${s.title}___${s.difficulty}`) === radarCategory,
      );
    }
    if (bpmBand) {
      filtered = filtered.filter((s) => bpmBandOf(s.bpm) === bpmBand);
    }

    return {
      result: ok(isBrowsing ? filtered.slice(0, BROWSE_DISPLAY_LIMIT) : filtered),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
