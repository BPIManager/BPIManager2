"use client";

import { useState } from "react";
import { Difficulties, FilterParamsFrontend } from "@/types/songs/withScore";
import { toggleArrayItem } from "@/hooks/common/useToggleArray";

/** タイムラインの表示モード。`"all"` 全件、`"played"` 自分もプレイ済み、`"overtaken"` 抜かれた楽曲 */
export type TimelineMode = "all" | "played" | "overtaken";

/**
 * タイムラインのモード・フィルター状態を管理するフック。
 *
 * @returns モード・フィルターパラメータ・更新関数・レベル/難易度トグル関数
 */
export function useTimelineFilter() {
  const [mode, setMode] = useState<TimelineMode>("all");
  const [filterParams, setFilterParams] = useState<FilterParamsFrontend>({
    levels: [11, 12],
    difficulties: ["HYPER", "ANOTHER", "LEGGENDARIA"],
    search: "",
  });

  const updateParams = (newParams: Partial<FilterParamsFrontend>) => {
    setFilterParams((prev) => ({ ...prev, ...newParams }));
  };

  const toggleLevel = (lv: number) =>
    updateParams({ levels: toggleArrayItem(filterParams.levels, lv) });

  const toggleDifficulty = (diff: Difficulties) =>
    updateParams({
      difficulties: toggleArrayItem(filterParams.difficulties, diff),
    });

  return {
    mode,
    setMode,
    filterParams,
    updateParams,
    toggleLevel,
    toggleDifficulty,
  };
}
