import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";

const scoresUpdateMock = vi.fn();
const allScoresUpdateMock = vi.fn();

vi.mock("@/lib/db/domains/scores/write", () => ({
  scoreWriteRepo: { updateUseOption: (...a: unknown[]) => scoresUpdateMock(...a) },
}));
vi.mock("@/lib/db/domains/allScores", () => ({
  allScoresRepo: { updateUseOption: (...a: unknown[]) => allScoresUpdateMock(...a) },
}));

const { handleScoreUseOption } = await import("@/lib/subhandlers/scores/useOption");

const req = (body: Record<string, unknown>) => ({ body, authUid: "me", headers: {} }) as unknown as AuthenticatedNextApiRequest;

beforeEach(() => vi.clearAllMocks());

describe("handleScoreUseOption (#708)", () => {
  it("自分の記録の使用オプションを更新する（☆11/12 は scores、全難易度は allScores）", async () => {
    scoresUpdateMock.mockResolvedValue(true);
    allScoresUpdateMock.mockResolvedValue(true);
    expect((await handleScoreUseOption(req({ logId: 5, songDomain: "bpi", useOption: "RANDOM" }))).result).toMatchObject({ ok: true });
    expect(scoresUpdateMock).toHaveBeenCalledWith("me", 5, "RANDOM");
    expect((await handleScoreUseOption(req({ logId: 6, songDomain: "allSongs", useOption: null }))).result).toMatchObject({ ok: true });
    expect(allScoresUpdateMock).toHaveBeenCalledWith("me", 6, null);
  });

  it("他人の記録や存在しない logId（更新できなかった）は 404", async () => {
    scoresUpdateMock.mockResolvedValue(false);
    expect((await handleScoreUseOption(req({ logId: 5, songDomain: "bpi", useOption: "MIRROR" }))).result).toMatchObject({ ok: false, status: 404 });
  });

  it("不正な本文は 400", async () => {
    expect((await handleScoreUseOption(req({ logId: -1, songDomain: "bpi", useOption: "RANDOM" }))).result).toMatchObject({ ok: false, status: 400 });
    expect((await handleScoreUseOption(req({ logId: 1, songDomain: "x", useOption: "RANDOM" }))).result).toMatchObject({ ok: false, status: 400 });
    expect(scoresUpdateMock).not.toHaveBeenCalled();
  });
});
