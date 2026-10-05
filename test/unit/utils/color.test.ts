import { describe, expect, it } from "vitest";
import { hslTripletToHex } from "@/utils/common/color";

describe("hslTripletToHex", () => {
  it("shadcn形式のHSLを#rrggbbに変換する", () => {
    expect(hslTripletToHex("313 100% 65%")).toBe("#ff4dd8");
    expect(hslTripletToHex("217 91% 60%")).toBe("#3c83f6");
  });

  it("無彩色と色相の範囲外を扱える", () => {
    expect(hslTripletToHex("0 0% 100%")).toBe("#ffffff");
    expect(hslTripletToHex("0 0% 0%")).toBe("#000000");
    expect(hslTripletToHex("360 100% 50%")).toBe("#ff0000");
  });

  it("解釈できない文字列はnullを返す", () => {
    expect(hslTripletToHex("")).toBeNull();
    expect(hslTripletToHex("#ff4fd8")).toBeNull();
  });
});
