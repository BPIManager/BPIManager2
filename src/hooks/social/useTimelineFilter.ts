"use client";

import { useState } from "react";
import { Difficulties, FilterParamsFrontend } from "@/types/songs/withScore";
import { toggleArrayItem } from "@/hooks/common/useToggleArray";

export type TimelineMode = "all" | "played" | "overtaken";

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
