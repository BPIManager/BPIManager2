import { describe, it, expect } from "vitest";
import {
  encodeTarget,
  decodeTarget,
  encodeTargets,
  decodeTargets,
} from "@/hooks/analytics/targetCodec";
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

describe("encodeTargets/decodeTargets(#287: 複数ターゲット比較)", () => {
  it("複数ターゲットをラウンドトリップできること", () => {
    const targets: AnalyticsTarget[] = [
      { kind: "rival", param: "user-1", label: "ライバル太郎" },
      { kind: "wr", param: undefined, label: "WR" },
      { kind: "arena", param: "A1", label: "アリーナ平均 A1" },
    ];

    expect(decodeTargets(encodeTargets(targets))).toEqual(targets);
  });

  it("ラベルにカンマを含んでいても、個々のターゲットの区切りを誤らないこと", () => {
    const targets: AnalyticsTarget[] = [
      { kind: "rival", param: "user-1", label: "太郎, 二郎" },
      { kind: "aaa", param: undefined, label: "AAA" },
    ];

    expect(decodeTargets(encodeTargets(targets))).toEqual(targets);
  });

  it("空配列はエンコードすると空文字列になり、デコードすると空配列に戻ること", () => {
    expect(encodeTargets([])).toBe("");
    expect(decodeTargets("")).toEqual([]);
  });

  it("undefinedを渡すと空配列を返すこと", () => {
    expect(decodeTargets(undefined)).toEqual([]);
  });

  it("一部の要素のデコードに失敗しても、残りの要素は読み飛ばして返すこと", () => {
    const valid = encodeTarget({ kind: "wr", label: "WR" });
    expect(decodeTargets(`${valid},%`)).toEqual([
      { kind: "wr", param: undefined, label: "WR" },
    ]);
  });
});
