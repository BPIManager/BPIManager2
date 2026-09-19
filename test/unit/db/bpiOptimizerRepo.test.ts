import { describe, it, expect, vi } from "vitest";
import {
  createDbSpy,
  createTransactionalDbSpy,
  createQueryBuilderSpy,
  callsFor,
} from "../helpers/dbQuerySpy";
import { BpiCalculator } from "@/lib/bpi";
import { BpiOptimizerConstants } from "@/lib/bpi/optimizer/constants";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as ReturnType<typeof import("../helpers/dbQuerySpy")["createDbSpy"]> | null },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

const { bpiOptimizerRepo } = await import("@/lib/db/domains/bpiOptimizer");

/**
 * `optimizeGoals`/`optimizeGoalSteps`と呼び出しテーブルごとに異なる結果を
 * 返すdbスパイを作る（`getMemosByUserId`等がテーブルをまたいで2回selectFromする
 * ため、単純な`createDbSpy`では両呼び出しに同じ結果しか返せない）。
 */
function createPerTableDbSpy(resultsByTable: Record<string, unknown>) {
  const chains = new Map(
    Object.entries(resultsByTable).map(([table, result]) => [
      table,
      createQueryBuilderSpy(result),
    ]),
  );
  const db = {
    selectFrom: vi.fn((table: string) => {
      // "optimizeGoalSteps as s"のようなエイリアス付き指定にも対応する
      const baseTable = table.split(" as ")[0];
      const chain = chains.get(baseTable);
      if (!chain) throw new Error(`unexpected table: ${table}`);
      return chain.proxy;
    }),
  };
  return { db, chains };
}

const sampleStep = {
  rank: 1,
  songId: 1,
  title: "テスト曲",
  difficulty: "ANOTHER",
  difficultyLevel: 12,
  notes: 1000,
  fromBpi: 10,
  toBpi: 20,
  fromExScore: 1800,
  toExScore: 1900,
  exScoreGap: 100,
  bpiGain: 5,
  cumulativeTotalBpi: 25,
  isUnplayed: false,
  radarCategory: null,
  isRadarStrength: false,
};

describe("bpiOptimizerRepo.saveMemo", () => {
  it("optimizeGoals・optimizeGoalStepsへトランザクション内でinsertし、reportIdを返すこと", async () => {
    const { db, trx, calls } = createTransactionalDbSpy(undefined, []);
    dbHolder.current = { db, calls };

    const reportId = await bpiOptimizerRepo.saveMemo("user-1", 30, {
      steps: [sampleStep],
      currentTotalBpi: 20,
      targetTotalBpi: 30,
      achievable: true,
      alreadyAchieved: false,
      totalSongCount: 100,
    });

    expect(typeof reportId).toBe("string");

    const insertCalls = callsFor(calls, "insertInto");
    expect(insertCalls.map((c) => c.args[0])).toEqual([
      "optimizeGoals",
      "optimizeGoalSteps",
    ]);

    const valuesCalls = callsFor(calls, "values");
    const goalValues = valuesCalls[0].args[0] as {
      userId: string;
      kind: string;
      achievable: number;
    };
    expect(goalValues.userId).toBe("user-1");
    expect(goalValues.kind).toBe("auto");
    expect(goalValues.achievable).toBe(1);

    const stepValues = valuesCalls[1].args[0] as { songId: number }[];
    expect(stepValues).toHaveLength(1);
    expect(stepValues[0].songId).toBe(1);

    void trx;
  });

  it("kindを指定した場合はそのまま保存すること", async () => {
    const { db, calls } = createTransactionalDbSpy(undefined, []);
    dbHolder.current = { db, calls };

    await bpiOptimizerRepo.saveMemo(
      "user-1",
      30,
      {
        steps: [],
        currentTotalBpi: 20,
        targetTotalBpi: 30,
        achievable: true,
        alreadyAchieved: false,
        totalSongCount: 100,
      },
      "custom",
    );

    const goalValues = callsFor(calls, "values")[0].args[0] as {
      kind: string;
    };
    expect(goalValues.kind).toBe("custom");
  });
});

describe("bpiOptimizerRepo.getMemosByUserId", () => {
  it("目標が0件なら曲別データを取得せず空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await bpiOptimizerRepo.getMemosByUserId("user-1");
    expect(result).toEqual([]);
  });

  it("optimizeGoals・optimizeGoalStepsを組み合わせてreportDataを組み立てること", async () => {
    const songDef = {
      notes: sampleStep.notes,
      kaidenAvg: 1500,
      wrScore: 1900,
      coef: 1.175,
      mu: 5,
      sigma: 1,
      residualVar: null,
    };
    const { db } = createPerTableDbSpy({
      optimizeGoals: [
        {
          reportId: "r1",
          targetBpi: 30,
          kind: "custom",
          createdAt: "2025-01-01",
          currentTotalBpi: 20,
          targetTotalBpi: 30,
          achievable: 1,
          alreadyAchieved: 0,
          totalSongCount: 100,
          originalTargetTotalBpi: null,
          autoAdjustmentNote: null,
          maxAchievableBpi: null,
          coldCategories: null,
        },
      ],
      optimizeGoalSteps: [
        {
          ...sampleStep,
          ...songDef,
          reportId: "r1",
          isUnplayed: 0,
          isRadarStrength: 0,
        },
      ],
    });
    dbHolder.current = { db, calls: [] };

    const result = await bpiOptimizerRepo.getMemosByUserId("user-1");

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("custom");
    expect(result[0].reportData.achievable).toBe(true);
    expect(result[0].reportData.steps).toHaveLength(1);
    const step = result[0].reportData.steps[0];
    expect(step.songId).toBe(1);
    // fromBpi/toBpiはfromExScore/toExScoreとsongDef(mu/sigma/coef等)から
    // 都度再計算される（DBには保存しない）
    expect(step.fromBpi).toBe(
      BpiCalculator.calc(sampleStep.fromExScore!, songDef),
    );
    expect(step.toBpi).toBe(
      Math.round(
        (BpiCalculator.calc(sampleStep.toExScore, songDef) ?? 0) * 100,
      ) / 100,
    );
  });

  it("songsとのJOINで見つからない曲（title/difficulty/notes等がnull）はフォールバック値になること", async () => {
    const { db } = createPerTableDbSpy({
      optimizeGoals: [
        {
          reportId: "r1",
          targetBpi: 30,
          kind: "custom",
          createdAt: "2025-01-01",
          currentTotalBpi: 20,
          targetTotalBpi: 30,
          achievable: 1,
          alreadyAchieved: 0,
          totalSongCount: 100,
          originalTargetTotalBpi: null,
          autoAdjustmentNote: null,
          maxAchievableBpi: null,
          coldCategories: null,
        },
      ],
      optimizeGoalSteps: [
        {
          reportId: "r1",
          rank: 1,
          songId: 999,
          title: null,
          difficulty: null,
          difficultyLevel: null,
          notes: null,
          kaidenAvg: null,
          wrScore: null,
          coef: null,
          mu: null,
          sigma: null,
          residualVar: null,
          fromExScore: 1800,
          toExScore: 1900,
          exScoreGap: 100,
          bpiGain: 5,
          cumulativeTotalBpi: 25,
          isUnplayed: 0,
          radarCategory: null,
          isRadarStrength: 0,
        },
      ],
    });
    dbHolder.current = { db, calls: [] };

    const result = await bpiOptimizerRepo.getMemosByUserId("user-1");

    const step = result[0].reportData.steps[0];
    expect(step.title).toBe("(削除済み楽曲)");
    expect(step.difficulty).toBe("");
    expect(step.difficultyLevel).toBe(0);
    expect(step.notes).toBe(0);
    // mu/sigmaが無い（songDefが引けない）ためBPIは計算不能フォールバック(-15)になる
    expect(step.fromBpi).toBe(BpiOptimizerConstants.BPI_FLOOR);
    expect(step.toBpi).toBe(BpiOptimizerConstants.BPI_FLOOR);
  });

  it("kind列が空/未設定の過去データはautoにフォールバックすること", async () => {
    const { db } = createPerTableDbSpy({
      optimizeGoals: [
        {
          reportId: "r1",
          targetBpi: 30,
          kind: "",
          createdAt: "2025-01-01",
          currentTotalBpi: 20,
          targetTotalBpi: 30,
          achievable: 1,
          alreadyAchieved: 0,
          totalSongCount: 100,
          originalTargetTotalBpi: null,
          autoAdjustmentNote: null,
          maxAchievableBpi: null,
          coldCategories: null,
        },
      ],
      optimizeGoalSteps: [],
    });
    dbHolder.current = { db, calls: [] };

    const result = await bpiOptimizerRepo.getMemosByUserId("user-1");

    expect(result[0].kind).toBe("auto");
  });

  it("作成日時の降順でソートすること", async () => {
    dbHolder.current = createDbSpy([]);
    await bpiOptimizerRepo.getMemosByUserId("user-1");
    expect(callsFor(dbHolder.current.calls, "orderBy")[0].args).toEqual([
      "createdAt",
      "desc",
    ]);
  });
});

describe("bpiOptimizerRepo.deleteMemo", () => {
  it("削除件数が1件以上ならtrueを返すこと", async () => {
    dbHolder.current = createDbSpy({ numDeletedRows: 1n });
    const result = await bpiOptimizerRepo.deleteMemo("user-1", "r1");
    expect(result).toBe(true);
  });

  it("削除件数が0件ならfalseを返すこと", async () => {
    dbHolder.current = createDbSpy({ numDeletedRows: 0n });
    const result = await bpiOptimizerRepo.deleteMemo("user-1", "r1");
    expect(result).toBe(false);
  });
});

describe("bpiOptimizerRepo.updateMemo", () => {
  it("更新0件ならstepの入れ替えをせずfalseを返すこと", async () => {
    const { db, calls } = createTransactionalDbSpy(
      { numUpdatedRows: 0n },
      [],
    );
    dbHolder.current = { db, calls };

    const result = await bpiOptimizerRepo.updateMemo(
      "user-1",
      "r1",
      30,
      {
        steps: [sampleStep],
        currentTotalBpi: 20,
        targetTotalBpi: 30,
        achievable: true,
        alreadyAchieved: false,
        totalSongCount: 100,
      },
      "custom",
    );

    expect(result).toBe(false);
    expect(callsFor(calls, "deleteFrom")).toHaveLength(0);
  });

  it("更新できた場合は既存stepを全削除してから作り直すこと", async () => {
    const { db, calls } = createTransactionalDbSpy(
      { numUpdatedRows: 1n },
      [],
    );
    dbHolder.current = { db, calls };

    const result = await bpiOptimizerRepo.updateMemo(
      "user-1",
      "r1",
      30,
      {
        steps: [sampleStep],
        currentTotalBpi: 20,
        targetTotalBpi: 30,
        achievable: true,
        alreadyAchieved: false,
        totalSongCount: 100,
      },
      "custom",
    );

    expect(result).toBe(true);
    expect(callsFor(calls, "deleteFrom").map((c) => c.args[0])).toEqual([
      "optimizeGoalSteps",
    ]);
    const insertCalls = callsFor(calls, "insertInto");
    expect(insertCalls.map((c) => c.args[0])).toEqual(["optimizeGoalSteps"]);
  });
});
