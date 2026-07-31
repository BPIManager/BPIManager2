import { describe, it, expect, vi, afterEach } from "vitest";

const { createTrxSpy, dbMock } = vi.hoisted(() => {
  function createTrxSpy() {
    const calls: { table: string; wheres: unknown[][] }[] = [];
    const trx = {
      deleteFrom: (table: string) => {
        const wheres: unknown[][] = [];
        const builder = {
          where: (...args: unknown[]) => {
            wheres.push(args);
            return builder;
          },
          execute: async () => {
            calls.push({ table, wheres });
          },
        };
        return builder;
      },
    };
    return { trx, calls };
  }

  const dbMock = {
    lastTrxSpy: null as ReturnType<typeof createTrxSpy> | null,
    transaction() {
      return {
        execute: async (cb: (trx: unknown) => Promise<unknown>) => {
          const spy = createTrxSpy();
          dbMock.lastTrxSpy = spy;
          return cb(spy.trx);
        },
      };
    },
  };

  return { createTrxSpy, dbMock };
});

vi.mock("@/lib/db", () => ({ db: dbMock }));

import { scoresRepo } from "@/lib/db/scores";
import { allScoresRepo } from "@/lib/db/allScores";
import { deleteBatch } from "@/lib/db/orchestrators/batchDeletion";

describe("バッチ削除まわりのリポジトリ", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("scoresRepo.deleteByBatch", () => {
    it("scores テーブルを batchId と userId で絞り込んで削除すること", async () => {
      const { trx, calls } = createTrxSpy();

      await scoresRepo.deleteByBatch(
        trx as never,
        "user-1",
        "batch-1",
      );

      expect(calls).toEqual([
        {
          table: "scores",
          wheres: [
            ["batchId", "=", "batch-1"],
            ["userId", "=", "user-1"],
          ],
        },
      ]);
    });
  });

  describe("allScoresRepo.deleteByBatch", () => {
    it("allScores テーブルを batchId と userId で絞り込んで削除すること", async () => {
      const { trx, calls } = createTrxSpy();

      await allScoresRepo.deleteByBatch(
        trx as never,
        "user-1",
        "batch-1",
      );

      expect(calls).toEqual([
        {
          table: "allScores",
          wheres: [
            ["batchId", "=", "batch-1"],
            ["userId", "=", "user-1"],
          ],
        },
      ]);
    });
  });

  describe("batchDeletion.deleteBatch", () => {
    it("scoresRepo/allScoresRepoに委譲しつつ、logs系テーブルは自身で削除すること", async () => {
      const scoresSpy = vi
        .spyOn(scoresRepo, "deleteByBatch")
        .mockResolvedValue(undefined);
      const allScoresSpy = vi
        .spyOn(allScoresRepo, "deleteByBatch")
        .mockResolvedValue(undefined);

      await deleteBatch("user-1", "batch-1");

      const usedTrx = dbMock.lastTrxSpy?.trx;
      expect(scoresSpy).toHaveBeenCalledWith(usedTrx, "user-1", "batch-1");
      expect(allScoresSpy).toHaveBeenCalledWith(usedTrx, "user-1", "batch-1");

      expect(dbMock.lastTrxSpy?.calls).toEqual([
        {
          table: "userStatusLogs",
          wheres: [
            ["batchId", "=", "batch-1"],
            ["userId", "=", "user-1"],
          ],
        },
        {
          table: "logs",
          wheres: [
            ["batchId", "=", "batch-1"],
            ["userId", "=", "user-1"],
          ],
        },
      ]);
    });
  });
});
