import { describe, it, expect } from "vitest";
import { needsUnplayedSongs } from "@/utils/songs/playState";

describe("needsUnplayedSongs", () => {
  it("未指定（既定=すべて）・any・false は未プレイ曲が必要", () => {
    expect(needsUnplayedSongs(undefined)).toBe(true);
    expect(needsUnplayedSongs("any")).toBe(true);
    expect(needsUnplayedSongs("false")).toBe(true);
  });

  it("true（プレイ済みのみ）は不要", () => {
    expect(needsUnplayedSongs("true")).toBe(false);
  });

  it("配列で渡された場合は先頭を使う", () => {
    expect(needsUnplayedSongs(["true", "false"])).toBe(false);
  });
});
