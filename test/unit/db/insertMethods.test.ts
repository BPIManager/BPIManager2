import { describe, it, expect } from "vitest";

import { scoresRepo } from "@/lib/db/scores";
import { allScoresRepo } from "@/lib/db/allScores";
import { navigationRepo } from "@/lib/db/logs/navigation";

function createTrxSpy() {
  const calls: { table: string; values: unknown }[] = [];
  const trx = {
    insertInto: (table: string) => {
      const builder = {
        values: (values: unknown) => {
          calls.push({ table, values });
          return builder;
        },
        execute: async () => undefined,
      };
      return builder;
    },
  };
  return { trx, calls };
}

describe("insert系メソッド", () => {
  describe("scoresRepo.insert", () => {
    it("scores テーブルへ挿入すること", async () => {
      const { trx, calls } = createTrxSpy();
      const values = [{ userId: "user-1", songId: 1 }];

      await scoresRepo.insert(trx as never, values as never);

      expect(calls).toEqual([{ table: "scores", values }]);
    });
  });

  describe("allScoresRepo.insert", () => {
    it("1000件以下なら1回のinsertInto呼び出しで済むこと", async () => {
      const { trx, calls } = createTrxSpy();
      const values = [{ userId: "user-1", songId: 1 }];

      await allScoresRepo.insert(trx as never, values as never);

      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual({ table: "allScores", values });
    });

    it("1000件を超える場合はチャンク分割して複数回insertすること", async () => {
      const { trx, calls } = createTrxSpy();
      const values = Array.from({ length: 1500 }, (_, i) => ({
        userId: "user-1",
        songId: i,
      }));

      await allScoresRepo.insert(trx as never, values as never);

      expect(calls).toHaveLength(2);
      expect((calls[0].values as unknown[]).length).toBe(1000);
      expect((calls[1].values as unknown[]).length).toBe(500);
    });

    it("空配列の場合はinsertを実行しないこと", async () => {
      const { trx, calls } = createTrxSpy();

      await allScoresRepo.insert(trx as never, [] as never);

      expect(calls).toHaveLength(0);
    });
  });

  describe("navigationRepo.insert", () => {
    it("logs テーブルへ挿入すること", async () => {
      const { trx, calls } = createTrxSpy();
      const values = { userId: "user-1", totalBpi: 50, version: "32" };

      await navigationRepo.insert(trx as never, values as never);

      expect(calls).toEqual([{ table: "logs", values }]);
    });
  });
});
