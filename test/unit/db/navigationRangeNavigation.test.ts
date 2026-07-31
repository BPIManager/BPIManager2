import { describe, it, expect, vi, afterEach } from "vitest";
import { createDbSpy, callsFor } from "../helpers/dbQuerySpy";

const { dbHolder, scoresRepoMock } = vi.hoisted(() => ({
  dbHolder: { current: null as ReturnType<typeof import("../helpers/dbQuerySpy")["createDbSpy"]> | null },
  scoresRepoMock: { getLastPlayedNavigation: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

vi.mock("@/lib/db/domains/scores", () => ({
  scoresRepo: scoresRepoMock,
}));

const { navigationRepo } = await import("@/lib/db/domains/logs/navigation");

describe("navigationRepo.getRangeNavigation", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("groupedBy='lastPlayed'の場合、scoresRepo.getLastPlayedNavigationへ委譲すること", async () => {
    scoresRepoMock.getLastPlayedNavigation.mockResolvedValue({
      prevDate: { lastPlayed: new Date("2025-01-01") },
      nextDate: undefined,
    });
    const range = { start: new Date("2025-01-10"), end: new Date("2025-01-20"), unit: "day" };

    const result = await navigationRepo.getRangeNavigation(
      "user-1",
      "33",
      range,
      "lastPlayed",
    );

    expect(scoresRepoMock.getLastPlayedNavigation).toHaveBeenCalledWith(
      "user-1",
      "33",
      range,
    );
    expect(result.prevDate).toEqual({ lastPlayed: new Date("2025-01-01") });
  });

  it("groupedBy='createdAt'(デフォルト)の場合、logsテーブルを直接検索すること", async () => {
    const spy = createDbSpy({ createdAt: new Date("2025-01-01"), totalBpi: 30 });
    dbHolder.current = spy;
    const range = { start: new Date("2025-01-10"), end: new Date("2025-01-20"), unit: "day" };

    await navigationRepo.getRangeNavigation("user-1", "33", range);

    expect(scoresRepoMock.getLastPlayedNavigation).not.toHaveBeenCalled();
    expect(callsFor(spy.calls, "selectFrom")[0].args).toEqual(["logs"]);
  });
});
