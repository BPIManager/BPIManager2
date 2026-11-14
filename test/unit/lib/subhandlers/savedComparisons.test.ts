import { describe, it, expect, vi } from "vitest";
import {
  createSavedComparisonBodySchema,
  updateSavedComparisonBodySchema,
  rankingTabsBodySchema,
} from "@/schemas/savedComparisons";

vi.mock("@/lib/db/domains/users", () => ({ usersRepo: {} }));
vi.mock("@/lib/db/aggregates/followAccess", () => ({
  followAccessAggregateRepo: {},
}));

const { maskInaccessibleTargets, parseStoredTargets } = await import(
  "@/lib/subhandlers/savedComparisons/_shared"
);

const rival = (param: string) => ({
  kind: "rival" as const,
  param,
  label: `name-${param}`,
});

describe("maskInaccessibleTargets", () => {
  it("閲覧不可の rival は label を返さず accessible=false にする", async () => {
    const result = await maskInaccessibleTargets(
      "me",
      [rival("private-user"), rival("public-user")],
      async (id) => id === "public-user",
    );
    expect(result[0]).toEqual({
      kind: "rival",
      param: "private-user",
      version: undefined,
      label: "",
      accessible: false,
    });
    expect(result[1]).toMatchObject({ label: "name-public-user", accessible: true });
  });

  it("rival 以外・自分自身を指す rival は判定せず閲覧可", async () => {
    const canView = vi.fn(async () => false);
    const result = await maskInaccessibleTargets(
      "me",
      [{ kind: "wr", label: "WR" }, rival("me")],
      canView,
    );
    expect(result.every((t) => t.accessible)).toBe(true);
    expect(canView).not.toHaveBeenCalled();
  });
});

describe("parseStoredTargets", () => {
  it("不正なJSONは空配列にする", () => {
    expect(parseStoredTargets("not json")).toEqual([]);
    expect(parseStoredTargets('{"a":1}')).toEqual([]);
    expect(parseStoredTargets('[{"kind":"wr","label":"WR"}]')).toHaveLength(1);
  });
});

describe("saved comparison schemas", () => {
  const target = { kind: "wr", label: "WR" };

  it("名前と条件が必須で、条件は1〜5件", () => {
    expect(createSavedComparisonBodySchema.safeParse({ name: "a", targets: [target] }).success).toBe(true);
    expect(createSavedComparisonBodySchema.safeParse({ name: " ", targets: [target] }).success).toBe(false);
    expect(createSavedComparisonBodySchema.safeParse({ name: "a", targets: [] }).success).toBe(false);
    expect(
      createSavedComparisonBodySchema.safeParse({ name: "a", targets: Array(6).fill(target) }).success,
    ).toBe(false);
  });

  it("不明な kind は拒否する", () => {
    expect(
      createSavedComparisonBodySchema.safeParse({ name: "a", targets: [{ kind: "x", label: "l" }] }).success,
    ).toBe(false);
  });

  it("更新は name か targets のどちらかが必要", () => {
    expect(updateSavedComparisonBodySchema.safeParse({}).success).toBe(false);
    expect(updateSavedComparisonBodySchema.safeParse({ name: "b" }).success).toBe(true);
  });

  it("タブ設定はキー形式の検証と重複排除を行う", () => {
    const ok = rankingTabsBodySchema.safeParse({
      tabs: [
        { key: "weapons", visible: true },
        { key: "saved:3", visible: false, targetIndex: 1 },
      ],
    });
    expect(ok.success).toBe(true);
    expect(rankingTabsBodySchema.safeParse({ tabs: [{ key: "evil", visible: true }] }).success).toBe(false);
    expect(
      rankingTabsBodySchema.safeParse({
        tabs: [
          { key: "weapons", visible: true },
          { key: "weapons", visible: false },
        ],
      }).success,
    ).toBe(false);
  });
});
