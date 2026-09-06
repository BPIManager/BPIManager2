import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest } from "next";

const getUserProfileSummaryMock = vi.fn();
const getWinLossStatsMock = vi.fn();
const getUserRadarMock = vi.fn();
const getMeMock = vi.fn();
const getUserNameMock = vi.fn();
const upsertUserProfileMock = vi.fn();
const backupAndDeleteUserMock = vi.fn();
const deleteUserMock = vi.fn();

vi.mock("@/lib/db/aggregates/userProfiles/profile", () => ({
  userProfileRepo: {
    getUserProfileSummary: (...a: unknown[]) => getUserProfileSummaryMock(...a),
    getMe: (...a: unknown[]) => getMeMock(...a),
  },
}));
vi.mock("@/lib/db/aggregates/rivalScores/comparison", () => ({
  socialComparisonRepo: {
    getWinLossStats: (...a: unknown[]) => getWinLossStatsMock(...a),
    getUserRadar: (...a: unknown[]) => getUserRadarMock(...a),
  },
}));
vi.mock("@/lib/db/domains/users", () => ({
  usersRepo: { getUserName: (...a: unknown[]) => getUserNameMock(...a) },
}));
vi.mock("@/lib/db/orchestrators/userProfileUpsert", () => ({
  upsertUserProfile: (...a: unknown[]) => upsertUserProfileMock(...a),
}));
vi.mock("@/lib/db/orchestrators/userDeletion", () => ({
  backupAndDeleteUser: (...a: unknown[]) => backupAndDeleteUserMock(...a),
}));
vi.mock("@/lib/db/domains/arenaPrivacy", () => ({ upsertStatsPrivacy: vi.fn() }));
vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: { deleteUser: (...a: unknown[]) => deleteUserMock(...a) },
}));
vi.mock("@/lib/arena/prefectureRankings", () => ({
  getUserAreaRank: () => null,
}));

import {
  getProfile,
  createProfile,
  updateProfile,
  getMe,
  deleteAccount,
} from "@/lib/subhandlers/profile";

const grant = (viewerId?: string) => ({ hasAccess: true, viewerId });
const deny = { hasAccess: false, error: { status: 403, message: "private" } };
const body = (b: unknown) => ({ body: b }) as unknown as NextApiRequest;

beforeEach(() => vi.clearAllMocks());

describe("getProfile", () => {
  it("アクセス拒否は err(403)", async () => {
    const { result } = await getProfile("u1", deny, false);
    expect(result).toMatchObject({ ok: false, status: 403 });
  });

  it("プロフィール無しは err(404)", async () => {
    getUserProfileSummaryMock.mockResolvedValue(null);
    const { result } = await getProfile("u1", grant("v"), false);
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("本人は statsPrivacy を含める", async () => {
    getUserProfileSummaryMock.mockResolvedValue({
      iidxId: "1",
      statsPrivacy: { showArea: 0 },
    });
    const { result, viewerId } = await getProfile("me", grant("me"), false);
    expect(viewerId).toBe("me");
    if (!result.ok) throw new Error();
    const b = result.body as { statsPrivacy?: unknown; profile: unknown };
    expect(b.statsPrivacy).toEqual({ showArea: 0 });
  });

  it("他人には statsPrivacy を含めない", async () => {
    getUserProfileSummaryMock.mockResolvedValue({
      iidxId: "1",
      statsPrivacy: { showArea: 1 },
    });
    const { result } = await getProfile("them", grant("me"), false);
    if (!result.ok) throw new Error();
    expect((result.body as { statsPrivacy?: unknown }).statsPrivacy).toBeUndefined();
  });

  it("compare=true で compare を含める", async () => {
    getUserProfileSummaryMock.mockResolvedValue({ iidxId: "1", statsPrivacy: {} });
    getWinLossStatsMock.mockResolvedValue({ win: 1 });
    getUserRadarMock.mockResolvedValue(null);
    const { result } = await getProfile("them", grant("me"), true);
    if (!result.ok) throw new Error();
    expect((result.body as { compare?: unknown }).compare).toEqual({
      winLoss: { win: 1 },
      radar: null,
    });
  });
});

describe("createProfile / updateProfile", () => {
  it("createProfile: 既存ありは err(409)", async () => {
    getUserProfileSummaryMock.mockResolvedValue({ iidxId: "1" });
    const { result } = await createProfile(body({}), "u1");
    expect(result).toMatchObject({ ok: false, status: 409 });
  });

  it("updateProfile: 既存なしは err(404)", async () => {
    getUserProfileSummaryMock.mockResolvedValue(null);
    const { result } = await updateProfile(body({}), "u1");
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("updateProfile: body 不正は err(400)", async () => {
    getUserProfileSummaryMock.mockResolvedValue({ iidxId: "1" });
    const { result } = await updateProfile(body({ userName: 123 }), "u1");
    expect(result).toMatchObject({ ok: false, status: 400 });
  });
});

describe("getMe", () => {
  it("user があれば exists:true", async () => {
    getMeMock.mockResolvedValue({ userId: "u1" });
    const { result } = await getMe("u1");
    expect(result).toEqual({
      ok: true,
      body: { exists: true, user: { userId: "u1" } },
    });
  });

  it("DB エラーは err(500)", async () => {
    getMeMock.mockRejectedValue(new Error("x"));
    const { result } = await getMe("u1");
    expect(result).toMatchObject({ ok: false, status: 500 });
  });
});

describe("deleteAccount", () => {
  it("ユーザー名不一致は err(400)", async () => {
    getUserNameMock.mockResolvedValue("realname");
    const { result } = await deleteAccount(
      body({ confirmUserName: "wrong" }),
      "u1",
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(backupAndDeleteUserMock).not.toHaveBeenCalled();
  });

  it("一致すれば削除して ok", async () => {
    getUserNameMock.mockResolvedValue("realname");
    backupAndDeleteUserMock.mockResolvedValue(undefined);
    deleteUserMock.mockResolvedValue(undefined);
    const { result } = await deleteAccount(
      body({ confirmUserName: "realname" }),
      "u1",
    );
    expect(result.ok).toBe(true);
    expect(backupAndDeleteUserMock).toHaveBeenCalledWith("u1");
    expect(deleteUserMock).toHaveBeenCalledWith("u1");
  });

  it("削除中の例外は err(500)", async () => {
    getUserNameMock.mockResolvedValue("realname");
    backupAndDeleteUserMock.mockRejectedValue(new Error("boom"));
    const { result } = await deleteAccount(
      body({ confirmUserName: "realname" }),
      "u1",
    );
    expect(result).toMatchObject({ ok: false, status: 500 });
  });
});
