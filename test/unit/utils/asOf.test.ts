import { describe, expect, it } from "vitest";
import { resolveAsOfTime } from "@/lib/dayjs";
import { asOfSchema } from "@/schemas/common/asOf";
import { scoresQuerySchema } from "@/schemas/scores/query";

describe("resolveAsOfTime", () => {
  it("日付指定はJSTのその日の終わり(23:59:59.999 JST)として解釈し、当日のプレーを含める", () => {
    expect(resolveAsOfTime("2026-10-05").toISOString()).toBe(
      "2026-10-05T14:59:59.999Z",
    );
  });

  it("latest・未指定は現在時刻を返す", () => {
    const before = Date.now();
    const latest = resolveAsOfTime("latest").getTime();
    const unspecified = resolveAsOfTime(undefined).getTime();
    expect(latest).toBeGreaterThanOrEqual(before);
    expect(unspecified).toBeGreaterThanOrEqual(before);
  });
});

describe("asOfSchema", () => {
  it("latestと実在するYYYY-MM-DDを受け付ける", () => {
    expect(asOfSchema.safeParse("latest").success).toBe(true);
    expect(asOfSchema.safeParse("2026-10-05").success).toBe(true);
    expect(asOfSchema.safeParse("2024-02-29").success).toBe(true);
  });

  it("不正な形式・存在しない日付は弾く", () => {
    for (const v of ["2026-13-01", "2026-02-31", "2026-2-3", "yesterday", "", "2026-10-05T00:00:00"]) {
      expect(asOfSchema.safeParse(v).success, v).toBe(false);
    }
  });

  it("scoresQuerySchemaのasOfにも適用される", () => {
    expect(scoresQuerySchema.safeParse({ version: "33", asOf: "bad" }).success).toBe(false);
    expect(scoresQuerySchema.safeParse({ version: "33", asOf: "2026-10-05" }).success).toBe(true);
  });
});
