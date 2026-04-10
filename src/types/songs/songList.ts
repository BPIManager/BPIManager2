import type { AttrSortKey } from "@/constants/songAttributes";

export type SortKey = "title" | "notes" | "bpm" | AttrSortKey;

export type SortDir = "asc" | "desc";

/** 楽曲属性の表示モード: 譜面内評価(p_) or 難易度間比較(g_) */
export type AttrMode = "profile" | "global";
