import { describe, it, expect, vi } from "vitest";

const order: string[] = [];
const trx = { id: "trx" };

vi.mock("@/lib/db", () => ({
  db: {
    transaction: () => ({
      execute: (cb: (t: unknown) => unknown) => cb(trx),
    }),
  },
}));
vi.mock("@/lib/db/shared/userWriteLock", () => ({
  lockUserForWrite: async (t: unknown, userId: string) => {
    order.push(`lock:${userId}:${t === trx}`);
  },
}));

const { withUserWriteLock } = await import(
  "@/lib/db/orchestrators/userWriteTransaction"
);

describe("withUserWriteLock", () => {
  it("同じトランザクションで先にロックを取り、その後に処理を実行して結果を返すこと", async () => {
    const result = await withUserWriteLock("u1", async (t) => {
      order.push(`work:${(t as unknown) === trx}`);
      return 42;
    });
    expect(result).toBe(42);
    expect(order).toEqual(["lock:u1:true", "work:true"]);
  });
});
