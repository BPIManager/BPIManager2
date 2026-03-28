"use client";

import { useState } from "react";
import { toggleArrayItem } from "@/hooks/common/useToggleArray";

/**
 * ライバル一覧のフィルター（レベル・難易度）状態を管理するフック。
 * デフォルトはレベル 11/12・全難易度。
 *
 * @returns levels・difficulties の現在値とそれぞれのトグル関数
 */
export function useRivalListFilter() {
  const [levels, setLevels] = useState<string[]>(["11", "12"]);
  const [difficulties, setDifficulties] = useState<string[]>([
    "HYPER",
    "ANOTHER",
    "LEGGENDARIA",
  ]);

  const handleToggleLevel = (lv: string) =>
    setLevels((prev) => toggleArrayItem(prev, lv));

  const handleToggleDifficulty = (diff: string) =>
    setDifficulties((prev) => toggleArrayItem(prev, diff));

  return { levels, difficulties, handleToggleLevel, handleToggleDifficulty };
}
