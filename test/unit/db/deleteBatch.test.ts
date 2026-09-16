import { describe, it, expect, vi, afterEach } from "vitest";

const { createTrxSpy, dbMock } = vi.hoisted(() => {
  function createTrxSpy(latestBatchRow: { batchId: string } | undefined = {
    batchId: "batch-1",
  }) {
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
      // #448: deleteBatchが削除直前に行ロック付きで最新バッチを再判定するための
      // selectFromチェーン。テストでは常に`latestBatchRow`をそのまま返す
      selectFrom: () => {
        const builder = {
          select: () => builder,
          where: () => builder,
          orderBy: () => builder,
          limit: () => builder,
          forUpdate: () => builder,
          executeTakeFirst: async () => latestBatchRow,
        };
        return builder;
      },
    };
    return { trx, calls };
  }

  const dbMock = {
    lastTrxSpy: null as ReturnType<typeof createTrxSpy> | null,
    nextLatestBatchRow: undefined as { batchId: string } | undefined,
    transaction() {
      return {
        execute: async (cb: (trx: unknown) => Promise<unknown>) => {
          const spy = createTrxSpy(dbMock.nextLatestBatchRow);
          dbMock.lastTrxSpy = spy;
          return cb(spy.trx);
        },
      };
    },
  };

  return { createTrxSpy, dbMock };
});

vi.mock("@/lib/db", () => ({ db: dbMock }));

import { scoresRepo } from "@/lib/db/domains/scores";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import {
  deleteBatch,
  BatchNotLatestError,
} from "@/lib/db/orchestrators/batchDeletion";

describe("バッチ削除まわりのリポジトリ", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    dbMock.nextLatestBatchRow = undefined;
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

      await deleteBatch("user-1", "batch-1", "34");

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

    it("トランザクション内の再判定で対象バッチが最新でなくなっていた場合、削除せずBatchNotLatestErrorを投げること(#448)", async () => {
      dbMock.nextLatestBatchRow = { batchId: "batch-2" };
      const scoresSpy = vi
        .spyOn(scoresRepo, "deleteByBatch")
        .mockResolvedValue(undefined);

      await expect(
        deleteBatch("user-1", "batch-1", "34"),
      ).rejects.toBeInstanceOf(BatchNotLatestError);

      expect(scoresSpy).not.toHaveBeenCalled();
      expect(dbMock.lastTrxSpy?.calls).toEqual([]);
    });
  });
});
