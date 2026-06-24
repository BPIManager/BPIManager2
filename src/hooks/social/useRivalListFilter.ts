"use client";

import { useState } from "react";
import { toggleArrayItem } from "@/hooks/common/useToggleArray";
import { IIDX_LEVELS, IIDX_DIFFICULTIES } from "@/constants/iidx/diffs";
import type { TranslationKey } from "@/lib/i18n/translations";

export type RivalSortOrder = "win_desc" | "lose_desc" | "updated_desc";

export const RIVAL_SORT_LABELS: Record<RivalSortOrder, TranslationKey> = {
  win_desc: "rivals.filter.winDesc",
  lose_desc: "rivals.filter.loseDesc",
  updated_desc: "rivals.filter.updatedDesc",
};

/**
 * ライバル一覧のフィルター（レベル・難易度・並び替え）状態を管理するフック。
 * デフォルトはレベル 11/12・全難易度・勝ち越し順。
 */
export function useRivalListFilter() {
  const [levels, setLevels] = useState<string[]>([...IIDX_LEVELS]);
  const [difficulties, setDifficulties] = useState<string[]>([
    ...IIDX_DIFFICULTIES,
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
