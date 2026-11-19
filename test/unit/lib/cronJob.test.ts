import { describe, expect, it, vi } from "vitest";

vi.mock("node-cron", () => ({ default: { schedule: vi.fn() } }));
vi.mock("@/lib/cron/metrics", () => ({ generateArenaJson: vi.fn() }));
vi.mock("@/lib/cron/metrics/info", () => ({ generateInfoJson: vi.fn() }));
vi.mock("@/lib/cron/arena", () => ({
  fetchOfficialArenaDistribution: vi.fn(),
  getArenaEventPeriod: vi.fn(),
}));
vi.mock("@/lib/cron/radar", () => ({ updateAllUserRadarCache: vi.fn() }));
vi.mock("@/lib/cron/songRanking", () => ({ updateAllSongRankingCache: vi.fn() }));
vi.mock("@/lib/cron/sitemaps", () => ({ generateUserSitemap: vi.fn() }));
vi.mock("@/lib/cache/arenaAverages", () => ({ invalidateArenaAveragesCache: vi.fn() }));

import { runCronJob } from "@/lib/cron/job";

describe("runCronJob", () => {
  it("同じ処理が実行中なら重ねて実行しない", async () => {
    let finish!: () => void;
    const task = vi.fn(() => new Promise<void>((r) => (finish = r)));
    const first = runCronJob("a", task);
    await runCronJob("b", task);
    expect(task).toHaveBeenCalledTimes(1);
    finish();
    await first;
    await runCronJob("c", task.mockResolvedValue(undefined));
    expect(task).toHaveBeenCalledTimes(2);
  });

  it("失敗しても次回実行をブロックしない", async () => {
    const task = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
    await runCronJob("f", task);
    await runCronJob("f", task);
    expect(task).toHaveBeenCalledTimes(2);
  });
});
