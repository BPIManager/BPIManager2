import type { CountBreakdown } from "./summary";

export type BreakdownMode = "level" | "difficulty";

export interface BreakdownSegment {
  key: string;
  /** 凡例・バー上の短い表記（☆12 / H など） */
  label: string;
  /** ツールチップ用の名称（☆12 / HYPER など） */
  name: string;
  count: number;
  color: string;
}

const LEVELS = Array.from({ length: 12 }, (_, i) => i + 1);

/** ☆1〜12を青→赤のグラデーションで塗り分ける（レベルが上がるほど暖色） */
const levelColor = (level: number) =>
  `hsl(${Math.round(210 - ((level - 1) / 11) * 210)} 70% 55%)`;

const DIFFICULTIES = [
  { key: "BEGINNER", label: "B", color: "#22c55e" },
  { key: "NORMAL", label: "N", color: "#3b82f6" },
  { key: "HYPER", label: "H", color: "#eab308" },
  { key: "ANOTHER", label: "A", color: "#ef4444" },
  { key: "LEGGENDARIA", label: "L", color: "#a855f7" },
] as const;

/** 内訳をモードに応じた色付きセグメント（件数0は除く）に変換する。凡例用に全項目を返す場合は`includeEmpty` */
export function toSegments(
  breakdown: CountBreakdown,
  mode: BreakdownMode,
  includeEmpty = false,
): BreakdownSegment[] {
  const all: BreakdownSegment[] =
    mode === "level"
      ? LEVELS.map((lv) => ({
          key: `lv${lv}`,
          label: `☆${lv}`,
          name: `☆${lv}`,
          count: breakdown.byLevel[lv] ?? 0,
          color: levelColor(lv),
        }))
      : DIFFICULTIES.map((d) => ({
          key: d.key,
          label: d.label,
          name: d.key,
          count: breakdown.byDifficulty[d.key] ?? 0,
          color: d.color,
        }));
  return includeEmpty ? all : all.filter((s) => s.count > 0);
}
