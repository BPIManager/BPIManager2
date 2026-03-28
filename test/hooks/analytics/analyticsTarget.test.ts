import { describe, it, expect } from "vitest";
import {
  encodeTarget,
  decodeTarget,
} from "@/hooks/analytics/useAnalyticsComparison";
import type { AnalyticsTarget } from "@/types/analytics";

describe("encodeTarget", () => {
  it("kind と label だけのターゲットをエンコードできる", () => {
    const target: AnalyticsTarget = { kind: "aaa", label: "AAA" };
    const encoded = encodeTarget(target);
    expect(encoded).toBe(encodeURIComponent("aaa::AAA"));
  });

  it("param を含むターゲットをエンコードできる", () => {
    const target: AnalyticsTarget = {
      kind: "rival",
      param: "user123",
      label: "ライバル",
    };
    const encoded = encodeTarget(target);
    expect(encoded).toBe(encodeURIComponent("rival:user123:ライバル"));
  });

  it("label にコロンが含まれていてもエンコードできる", () => {
    const target: AnalyticsTarget = {
      kind: "arena",
      param: "A1",
      label: "Arena:A1",
    };
    const encoded = encodeTarget(target);
    expect(encoded).toBeTruthy();
  });
});

describe("decodeTarget", () => {
  it("エンコードされた文字列をデコードできる", () => {
    const original: AnalyticsTarget = {
      kind: "rival",
      param: "user456",
      label: "テスト",
    };
    const encoded = encodeTarget(original);
    const decoded = decodeTarget(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.kind).toBe("rival");
    expect(decoded?.param).toBe("user456");
    expect(decoded?.label).toBe("テスト");
  });

  it("param なしのターゲットをデコードできる", () => {
    const original: AnalyticsTarget = { kind: "aaa", label: "AAA目標" };
    const encoded = encodeTarget(original);
    const decoded = decodeTarget(encoded);

    expect(decoded?.kind).toBe("aaa");
    expect(decoded?.param).toBeUndefined();
    expect(decoded?.label).toBe("AAA目標");
  });

  it("label にコロンが含まれていてもデコードできる", () => {
    const original: AnalyticsTarget = {
      kind: "arena",
      param: "A1",
      label: "Arena:A1",
    };
    const encoded = encodeTarget(original);
    const decoded = decodeTarget(encoded);

    expect(decoded?.label).toBe("Arena:A1");
  });

  it("encode → decode でラウンドトリップが成立する", () => {
    const targets: AnalyticsTarget[] = [
      { kind: "rival", param: "abc", label: "Some Rival" },
      { kind: "aaa", label: "AAA" },
      { kind: "max-", label: "MAX-" },
      { kind: "wr", label: "WR" },
      { kind: "arena", param: "A1", label: "A1平均" },
      { kind: "self-version", param: "HEROIC VERSE", label: "旧バージョン" },
    ];

    for (const t of targets) {
      const decoded = decodeTarget(encodeTarget(t));
      expect(decoded?.kind).toBe(t.kind);
      expect(decoded?.param ?? undefined).toBe(t.param);
      expect(decoded?.label).toBe(t.label);
    }
  });

  it("空文字列を渡すと null を返す", () => {
    expect(decodeTarget("")).toBeNull();
  });

  it("不正な文字列でも null を返す（クラッシュしない）", () => {
    expect(decodeTarget("%%%%invalid%%%%")).toBeNull();
  });
});
