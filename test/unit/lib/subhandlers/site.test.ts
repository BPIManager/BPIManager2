import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest } from "next";

const readFileMock = vi.fn();
const getSupportersMock = vi.fn();

vi.mock("fs/promises", () => ({
  default: { readFile: (...a: unknown[]) => readFileMock(...a) },
}));
vi.mock("@/lib/db/aggregates/userProfiles/supporters", () => ({
  supportersRepo: { getSupporters: (...a: unknown[]) => getSupportersMock(...a) },
}));

import {
  handleSiteStats,
  handleSongPopulation,
  handleOfficialArena,
  handleSupporters,
} from "@/lib/subhandlers/site";

const req = (query: Record<string, unknown>) =>
  ({ query }) as unknown as NextApiRequest;

beforeEach(() => vi.clearAllMocks());

describe("handleSiteStats", () => {
  it("JSON ファイルの内容をそのまま ok", async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ users: 10 }));
    expect(await handleSiteStats()).toEqual({ ok: true, body: { users: 10 } });
  });

  it("ファイルが読めなければ err(503)", async () => {
    readFileMock.mockRejectedValue(new Error("ENOENT"));
    expect(await handleSiteStats()).toMatchObject({ ok: false, status: 503 });
  });
});

describe("handleSongPopulation", () => {
  const file = JSON.stringify({
    songs: [{ songId: 1 }, { songId: 2 }, { songId: 3 }],
  });

  it("offset/limit でページングし total/hasMore を返す", async () => {
    readFileMock.mockResolvedValue(file);
    const r = await handleSongPopulation(req({ offset: "1", limit: "1" }));
    expect(r).toEqual({
      ok: true,
      body: { songs: [{ songId: 2 }], total: 3, hasMore: true },
    });
  });

  it("order=bottom は逆順", async () => {
    readFileMock.mockResolvedValue(file);
    const r = await handleSongPopulation(req({ order: "bottom", limit: "1" }));
    if (!r.ok) throw new Error("expected ok");
    expect((r.body as { songs: { songId: number }[] }).songs[0].songId).toBe(3);
  });
});

describe("handleOfficialArena", () => {
  it("未知 version は最新にフォールバックしファイルパスに使う", async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ a: 1 }));
    await handleOfficialArena(req({ version: "zzz" }));
    expect(String(readFileMock.mock.calls[0][0])).not.toContain("zzz");
  });

  it("ファイルが無ければ err(503)", async () => {
    readFileMock.mockRejectedValue(new Error("no"));
    expect(await handleOfficialArena(req({}))).toMatchObject({
      ok: false,
      status: 503,
    });
  });
});

describe("handleSupporters", () => {
  it("supporters を整形して ok", async () => {
    getSupportersMock.mockResolvedValue([
      {
        userId: "u1",
        userName: "U1",
        iidxId: "1",
        profileImage: null,
        totalBpi: "12.5",
        role: "supporter",
        description: null,
        grantedAt: "2026-01-01",
      },
    ]);
    const r = await handleSupporters();
    expect(r).toEqual({
      ok: true,
      body: {
        supporters: [
          {
            userId: "u1",
            userName: "U1",
            iidxId: "1",
            profileImage: null,
            totalBpi: 12.5,
            role: {
              role: "supporter",
              description: "",
              grantedAt: "2026-01-01",
            },
          },
        ],
      },
    });
  });

  it("リポジトリが投げたら err(500)", async () => {
    getSupportersMock.mockRejectedValue(new Error("db"));
    expect(await handleSupporters()).toEqual({
      ok: false,
      status: 500,
      message: "db",
    });
  });
});
