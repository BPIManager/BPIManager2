import { describe, it, expect } from "vitest";
import { scoresRepo } from "@/lib/db/domains/scores";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { getManualBatchPrefix, mintManualBatchId } from "@/lib/scores/manualBatchId";

/**
 * `selectFrom` の結果だけ差し替えられる簡易trxモック。
 * `insertInto`/`updateTable` の呼び出しを記録し、テストごとに
 * "現在の最新行" を自由に設定して分岐（UPDATE vs INSERT）を検証する。
 */
function createTrxMock(latestRow: unknown) {
  const calls: { method: string; args: unknown[] }[] = [];

  function selectBuilder() {
    const builder = {
      select: (...a: unknown[]) => {
        calls.push({ method: "select", args: a });
        return builder;
      },
      where: (...a: unknown[]) => {
        calls.push({ method: "where", args: a });
        return builder;
      },
      orderBy: (...a: unknown[]) => {
        calls.push({ method: "orderBy", args: a });
        return builder;
      },
      limit: (...a: unknown[]) => {
        calls.push({ method: "limit", args: a });
        return builder;
      },
      executeTakeFirst: async () => latestRow,
    };
    return builder;
  }

  function updateBuilder(table: string) {
    const builder = {
      set: (values: unknown) => {
        calls.push({ method: "updateTable.set", args: [table, values] });
        return builder;
      },
      where: (...a: unknown[]) => {
        calls.push({ method: "where", args: a });
        return builder;
      },
      execute: async () => {
        calls.push({ method: "updateTable.execute", args: [table] });
      },
    };
    return builder;
  }

  function insertBuilder(table: string) {
    const builder = {
      values: (values: unknown) => {
        calls.push({ method: "insertInto.values", args: [table, values] });
        return builder;
      },
      execute: async () => {
        calls.push({ method: "insertInto.execute", args: [table] });
      },
    };
    return builder;
  }

  const trx = {
    selectFrom: (table: string) => {
      calls.push({ method: "selectFrom", args: [table] });
      return selectBuilder();
    },
    updateTable: (table: string) => updateBuilder(table),
    insertInto: (table: string) => insertBuilder(table),
  };

  return { trx, calls };
}

describe("getManualBatchPrefix", () => {
  it("userId・version・当日日付(JST)から決定的なプレフィックスを生成すること", () => {
    const id1 = getManualBatchPrefix("user-1", "34");
    const id2 = getManualBatchPrefix("user-1", "34");
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^manual-user-1-34-\d{4}-\d{2}-\d{2}$/);
  });

  it("userId・versionが異なれば別のプレフィックスになること", () => {
    expect(getManualBatchPrefix("user-1", "34")).not.toBe(
      getManualBatchPrefix("user-2", "34"),
    );
    expect(getManualBatchPrefix("user-1", "34")).not.toBe(
      getManualBatchPrefix("user-1", "33"),
    );
  });
});

describe("mintManualBatchId", () => {
  it("プレフィックスを含み、呼び出すたびに一意なIDを発行すること", () => {
    const prefix = getManualBatchPrefix("user-1", "34");
    const id1 = mintManualBatchId("user-1", "34");
    const id2 = mintManualBatchId("user-1", "34");
    expect(id1.startsWith(prefix)).toBe(true);
    expect(id2.startsWith(prefix)).toBe(true);
    expect(id1).not.toBe(id2);
  });
});

describe("scoresRepo.upsertManual", () => {
  const baseParams = {
    userId: "user-1",
    songId: 1,
    definitionId: 10,
    version: "34",
    batchId: "manual-user-1-34-2026-09-17",
    exScore: 900,
    bpi: 50,
    clearState: "HARD",
    missCount: 0,
    lastPlayed: new Date("2026-09-17T00:00:00Z"),
  };

  it("最新行が同じbatchIdならUPDATEすること（新規行を増やさない）", async () => {
    const { trx, calls } = createTrxMock({
      logId: 999,
      batchId: baseParams.batchId,
    });

    await scoresRepo.upsertManual(trx as never, baseParams);

    expect(calls.some((c) => c.method === "updateTable.execute")).toBe(true);
    expect(calls.some((c) => c.method === "insertInto.execute")).toBe(false);
  });

  it("最新行が別のbatchId（間に他バッチが挟まった）ならINSERTにフォールバックすること", async () => {
    const { trx, calls } = createTrxMock({
      logId: 999,
      batchId: "csv-some-other-batch",
    });

    await scoresRepo.upsertManual(trx as never, baseParams);

    expect(calls.some((c) => c.method === "insertInto.execute")).toBe(true);
    expect(calls.some((c) => c.method === "updateTable.execute")).toBe(false);
  });

  it("最新行が存在しない（未プレイ曲）ならINSERTすること", async () => {
    const { trx, calls } = createTrxMock(undefined);

    await scoresRepo.upsertManual(trx as never, baseParams);

    expect(calls.some((c) => c.method === "insertInto.execute")).toBe(true);
    expect(calls.some((c) => c.method === "updateTable.execute")).toBe(false);
  });
});

describe("navigationRepo.upsertManualBatch", () => {
  const baseParams = {
    userId: "user-1",
    version: "34",
    batchId: "manual-user-1-34-2026-09-17",
    totalBpi: 42.5,
  };

  it("最新バッチが同じbatchIdならUPDATEすること", async () => {
    const { trx, calls } = createTrxMock({ id: 1, batchId: baseParams.batchId });

    await navigationRepo.upsertManualBatch(trx as never, baseParams);

    expect(calls.some((c) => c.method === "updateTable.execute")).toBe(true);
    expect(calls.some((c) => c.method === "insertInto.execute")).toBe(false);
  });

  it("最新バッチが別のbatchIdならINSERTにフォールバックすること", async () => {
    const { trx, calls } = createTrxMock({ id: 1, batchId: "csv-some-other-batch" });

    await navigationRepo.upsertManualBatch(trx as never, baseParams);

    expect(calls.some((c) => c.method === "insertInto.execute")).toBe(true);
    expect(calls.some((c) => c.method === "updateTable.execute")).toBe(false);
  });
});
