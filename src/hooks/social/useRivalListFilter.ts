"use client";

import { useState } from "react";
import { toggleArrayItem } from "@/hooks/common/useToggleArray";

export type RivalSortOrder = "win_desc" | "lose_desc" | "updated_desc";

export const RIVAL_SORT_LABELS: Record<RivalSortOrder, string> = {
  win_desc: "勝ち越しが多い順",
  lose_desc: "負け越しが多い順",
  updated_desc: "最終更新が新しい順",
};

/**
 * ライバル一覧のフィルター（レベル・難易度・並び替え）状態を管理するフック。
 * デフォルトはレベル 11/12・全難易度・勝ち越し順。
 */
export function useRivalListFilter() {
  const [levels, setLevels] = useState<string[]>(["11", "12"]);
  const [difficulties, setDifficulties] = useState<string[]>([
    "HYPER",
    "ANOTHER",
    "LEGGENDARIA",
  ]);
  const [sortOrder, setSortOrder] = useState<RivalSortOrder>("win_desc");

  const handleToggleLevel = (lv: string) =>
    setLevels((prev) => toggleArrayItem(prev, lv));

  const handleToggleDifficulty = (diff: string) =>
    setDifficulties((prev) => toggleArrayItem(prev, diff));

  return {
    levels,
    difficulties,
    sortOrder,
    handleToggleLevel,
    handleToggleDifficulty,
    setSortOrder,
  };
}
