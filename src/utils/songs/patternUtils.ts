import type { SongListItem } from "@/types/songs/songInfo";

export type PatternBadge = "normal" | "mirror" | "r-ran" | null;

const ROTATIONS_OF_NORMAL = new Set([
  "1234567",
  "2345671",
  "3456712",
  "4567123",
  "5671234",
  "6712345",
  "7123456",
]);

export function getPatternBadge(pattern: string): PatternBadge {
  if (pattern === "1234567") return "normal";
  if (pattern === "7654321") return "mirror";
  if (ROTATIONS_OF_NORMAL.has(pattern)) return "r-ran";
  return null;
}

export function buildTextageUrl(
  song: SongListItem,
  side: 1 | 2,
  pattern: string,
): string | null {
  if (!song.textage) return null;
  return `https://textage.cc/score/${song.textage.replace("?1", "?" + side)}R0${pattern}01234567`;
}
