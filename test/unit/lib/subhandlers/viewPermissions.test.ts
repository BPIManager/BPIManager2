import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest } from "next";

const listApprovedFollowersMock = vi.fn();
const revokeViewPermissionMock = vi.fn();

vi.mock("@/lib/db/aggregates/followAccess", () => ({
  followAccessAggregateRepo: {
    listApprovedFollowers: (...a: unknown[]) => listApprovedFollowersMock(...a),
  },
}));
vi.mock("@/lib/db/orchestrators/viewPermissionRevoke", () => ({
  revokeViewPermission: (...a: unknown[]) => revokeViewPermissionMock(...a),
}));

const {
  handleViewPermissionsList,
  handleRevokeViewPermission,
} = await import("@/lib/subhandlers/follows/viewPermissions");

const authReq = (query: Record<string, string> = {}) =>
  ({ authUid: "me", query }) as unknown as NextApiRequest;

describe("handleViewPermissionsList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("自分を承認者とした承認済みフォロワーを返すこと", async () => {
    listApprovedFollowersMock.mockResolvedValue([
      {
        followerId: "f1",
        followerName: "A",
        followerImage: null,
        followedAt: new Date("2026-08-01T00:00:00Z"),
        approvedAt: new Date("2026-08-02T00:00:00Z"),
      },
    ]);

    const { result } = await handleViewPermissionsList(authReq());

    expect(listApprovedFollowersMock).toHaveBeenCalledWith("me");
    expect(result).toMatchObject({
      ok: true,
      body: { approved: [{ followerId: "f1", followerName: "A" }] },
    });
  });

  it("取得に失敗したら500を返すこと", async () => {
    listApprovedFollowersMock.mockRejectedValue(new Error("db down"));
    const { result } = await handleViewPermissionsList(authReq());
    expect(result).toMatchObject({ ok: false, status: 500 });
  });
});

describe("handleRevokeViewPermission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("followerIdが無ければ400を返すこと", async () => {
    const { result } = await handleRevokeViewPermission(authReq());
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(revokeViewPermissionMock).not.toHaveBeenCalled();
  });

  it("承認済みでなければ404を返すこと", async () => {
    revokeViewPermissionMock.mockResolvedValue(false);
    const { result } = await handleRevokeViewPermission(
      authReq({ followerId: "f1" }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("取り消しに成功したらrevokedを返し、フォロワー→自分の向きで取り消すこと", async () => {
    revokeViewPermissionMock.mockResolvedValue(true);
    const { result } = await handleRevokeViewPermission(
      authReq({ followerId: "f1" }),
    );
    expect(result).toEqual({ ok: true, body: { status: "revoked" } });
    expect(revokeViewPermissionMock).toHaveBeenCalledWith("f1", "me");
  });
});
