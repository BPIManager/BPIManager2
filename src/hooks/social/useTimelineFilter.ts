"use client";

import { useState } from "react";
import { FilterParamsFrontend } from "@/types/songs/score";
import { toggleArrayItem } from "@/hooks/common/useToggleArray";

import type { TimelineMode } from "@/types/social/timeline";
import { IidxDifficulty } from "@/types/iidx/difficulty";

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

  const toggleDifficulty = (diff: IidxDifficulty) =>
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
