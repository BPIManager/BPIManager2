import { describe, it, expect } from "vitest";
import { encodeTarget, decodeTarget } from "@/hooks/analytics/targetCodec";
import type { AnalyticsTarget } from "@/types/analytics";

describe("encodeTarget/decodeTarget", () => {
  it("エンコードしたものをデコードすると元のターゲットに戻ること", () => {
    const target: AnalyticsTarget = {
      kind: "rival",
      param: "rival-user-id",
      label: "ライバル太郎",
    };

    expect(decodeTarget(encodeTarget(target))).toEqual(target);
  });

  it("paramが無いターゲットもラウンドトリップできること", () => {
    const target: AnalyticsTarget = {
      kind: "aaa",
      param: undefined,
      label: "AAA",
    };

    expect(decodeTarget(encodeTarget(target))).toEqual(target);
  });

  it("labelにコロンを含んでいても復元できること", () => {
    const target: AnalyticsTarget = {
      kind: "self-version",
      param: "26",
      label: "旧verとの比較: v26",
    };

    expect(decodeTarget(encodeTarget(target))).toEqual(target);
  });

  it("kindが空の不正な文字列をデコードするとnullを返すこと", () => {
    expect(decodeTarget(encodeURIComponent("::no-kind"))).toBeNull();
  });

  it("decodeURIComponentが失敗する不正な文字列を渡すとnullを返すこと", () => {
    expect(decodeTarget("%")).toBeNull();
  });
});
