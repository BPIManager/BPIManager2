import { readFileSync } from "fs";
import path from "path";
import type { OgpSectionKey } from "@/lib/monthly-review/ogpSections";

import { getRankDetail } from "@/constants/iidx/rankBorders";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";

import type { ArenaVersionHistoryEntry } from "@/types/stats/monthlyReview";

export interface OgpRenderData {
  heading: string;
  userName: string;
  profileImage: string | null;
  bpiEnd: number;
  sections: [OgpSectionKey, OgpSectionKey];
  topSongs: {
    songId: number;
    title: string;
    difficulty: string;
    bpi: number;
    exScore: number;
    notes: number;
  }[];
  topRadar: { element: string; bpiEnd: number }[];
  growthHistory: { date: string; value: number }[];
  arenaCurrent: {
    version: string;
    arenaClass: string;
    arenaRank: number | null;
  } | null;
  arenaHistory: ArenaVersionHistoryEntry[];
  /** 全期間(version)モードのみ。前バージョンとの比較。比較対象が無い場合はnull */
  compareBadge: { version: string; diff: number } | null;
}

export const WIDTH = 1200;

export const HEIGHT = 630;

export const TOP_SONGS_COUNT = 5;

export const RADAR_ELEMENTS_COUNT = 6;

/** アリーナ戦績ブロックの過去バージョン履歴の表示件数（現在バージョン分は別枠） */
export const ARENA_HISTORY_COUNT = 3;

let regularFontCache: Buffer | null = null;
let boldFontCache: Buffer | null = null;

/** satoriはWOFF2非対応・TTF/OTFのみ扱えるため、バンドル済みの静的インスタンス(可変フォントではない)を使う */
export function loadFont(weight: "regular" | "bold"): Buffer {
  if (weight === "bold") {
    if (!boldFontCache) {
      boldFontCache = readFileSync(
        path.join(process.cwd(), "src/assets/fonts/NotoSansJP-Bold.ttf"),
      );
    }
    return boldFontCache;
  }
  if (!regularFontCache) {
    regularFontCache = readFileSync(
      path.join(process.cwd(), "src/assets/fonts/NotoSansJP-Regular.ttf"),
    );
  }
  return regularFontCache;
}

/**
 * satori は SVG パーサーが弱く dicebear の SVG アバターを読み込めない（無言で欠落する）ため、dicebear の URL のみ PNG に変換する。
 */
export function toSatoriSafeImageUrl(url: string): string {
  if (url.includes("api.dicebear.com") && url.includes("/svg")) {
    return url.replace("/svg", "/png");
  }
  return url;
}

/** TopSongsSection/ScoreSublineと同じロジック（AAA以上はAAA+n、それ未満は現ランク+n） */
export function scoreLabelOf(exScore: number, notes: number): string {
  const maxEx = notes * 2;
  const aboveAaa = exScore - Math.ceil(maxEx * (8 / 9));
  if (aboveAaa >= 0) return `AAA+${aboveAaa}`;
  const rd = getRankDetail(exScore, maxEx);
  return `${rd.label}+${rd.surplus}`;
}

export function versionLabelOf(version: string): string {
  return version === "INF"
    ? "INF"
    : `IIDX ${getVersionNameFromNumber(version)}`;
}

/** バッジ背景に16進のアルファ接尾辞を付けて使うため、rgba()ではなくhexカラーで統一する */
export function compareDiffColor(diff: number): string {
  return diff > 0 ? "#34d399" : diff < 0 ? "#f87171" : "#94a3b8";
}

/** TopSongsSectionと同じ配色・略記（H/A/L）。曲名の前に難易度バッジとして付ける */
export const DIFF_COLORS: Record<string, string> = {
  HYPER: "#f59e0b",
  ANOTHER: "#ef4444",
  LEGGENDARIA: "#a855f7",
};

export const DIFF_LABELS: Record<string, string> = {
  HYPER: "H",
  ANOTHER: "A",
  LEGGENDARIA: "L",
};
