import type { NextApiRequest } from "next";
import { songsRepo } from "@/lib/db/domains/songs";
import { topElementMap } from "@/constants/iidx/radars/topElements";
import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import { BPM_BANDS, bpmBandOf, type BpmBand } from "@/constants/iidx/bpm";
import type { RadarCategory } from "@/types/stats/radar";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import {
  num,
  resolveVersion,
  type HandleOutcome,
  type IIDXVersion,
} from "./_shared";

const SEARCH_LIMIT = 20;
/** 曲名指定なしで一覧表示する場合(楽曲一覧・レーダー項目/BPM帯)のDB取得上限。全件返す */
const BROWSE_FETCH_LIMIT = 2000;

export type { BpmBand };

/**
 * GET /songs/search?title=...&version=...&difficultyLevel=12
 *   &radarCategory=NOTES&bpmBand=slow
 *
 */
export async function handleSongSearch(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const title =
    typeof req.query.title === "string" ? req.query.title.trim() : "";
  const radarCategoryRaw =
    typeof req.query.radarCategory === "string" ? req.query.radarCategory : "";
  const radarCategory = (ALL_RADAR_CATEGORIES as string[]).includes(
    radarCategoryRaw,
  )
    ? (radarCategoryRaw as RadarCategory)
    : undefined;
  const bpmBandRaw =
    typeof req.query.bpmBand === "string" ? req.query.bpmBand : "";
  const bpmBand = (BPM_BANDS as string[]).includes(bpmBandRaw)
    ? (bpmBandRaw as BpmBand)
    : undefined;

  try {
    // 曲名未指定は、レーダー項目/BPM帯別のブラウズに限らず「楽曲一覧」表示としても使う
    const isBrowsing = title.length === 0;
    const songs = await songsRepo.searchSongs({
      version: resolveVersion(req.query.version) as IIDXVersion,
      title: title || undefined,
      difficultyLevel: num(req.query.difficultyLevel) ?? undefined,
      limit: isBrowsing ? BROWSE_FETCH_LIMIT : SEARCH_LIMIT,
    });

    let filtered = songs;
    if (radarCategory) {
      filtered = filtered.filter(
        (s) =>
          topElementMap.get(`${s.title}___${s.difficulty}`) === radarCategory,
      );
    }
    if (bpmBand) {
      filtered = filtered.filter((s) => bpmBandOf(s.bpm) === bpmBand);
    }

    return {
      result: ok(filtered),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
