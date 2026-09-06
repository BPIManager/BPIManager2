import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest } from "next";
import {
  handleFollowsList,
  handleFollow,
  handleUnfollow,
  handleGetInviteToken,
  handleRegenerateInvite,
  handleFollowListsList,
  handleCreateFollowList,
  handleUpdateFollowList,
  handleDeleteFollowList,
  handleAddListMember,
  handleRemoveListMember,
  handleFollowRequestsList,
  handleApproveFollowRequest,
  handleRejectFollowRequest,
  handleRemoveFollower,
  handleApproveLegacyFollower,
} from "@/lib/subhandlers/follows";

const checkProfileAccessMock = vi.fn();
const isFollowingMock = vi.fn();
const toggleFollowMock = vi.fn();
const unfollowAndCleanupListsMock = vi.fn();
const getFollowListMock = vi.fn();
const inviteGetByUserIdMock = vi.fn();
const inviteRegenerateMock = vi.fn();
const listsCreateMock = vi.fn();
const listsUpdateMock = vi.fn();
const listsRemoveMock = vi.fn();
const listsGetByIdMock = vi.fn();
const getListsWithMemberCountMock = vi.fn();
const addMemberMock = vi.fn();
const removeMemberMock = vi.fn();
const listPendingForTargetMock = vi.fn();
const listUnapprovedFollowersMock = vi.fn();
const approveFollowRequestMock = vi.fn();
const rejectMock = vi.fn();
const recordApprovalMock = vi.fn();
const withdrawMock = vi.fn();

vi.mock("@/middlewares/api/withApiOnProfile", () => ({
  checkProfileAccess: (...a: unknown[]) => checkProfileAccessMock(...a),
}));
vi.mock("@/lib/db/domains/follow", () => ({
  followsRepo: {
    isFollowing: (...a: unknown[]) => isFollowingMock(...a),
    toggleFollow: (...a: unknown[]) => toggleFollowMock(...a),
  },
}));
vi.mock("@/lib/db/orchestrators/unfollow", () => ({
  unfollowAndCleanupLists: (...a: unknown[]) => unfollowAndCleanupListsMock(...a),
}));
vi.mock("@/lib/db/orchestrators/followRequestApproval", () => ({
  approveFollowRequest: (...a: unknown[]) => approveFollowRequestMock(...a),
}));
vi.mock("@/lib/db/aggregates/followList", () => ({
  followListAggregateRepo: {
    getFollowList: (...a: unknown[]) => getFollowListMock(...a),
  },
}));
vi.mock("@/lib/db/aggregates/followLists", () => ({
  followListsAggregateRepo: {
    getListsWithMemberCount: (...a: unknown[]) =>
      getListsWithMemberCountMock(...a),
    getFollowingWithListMembership: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock("@/lib/db/aggregates/followRequests", () => ({
  followRequestsAggregateRepo: {
    listPendingForTarget: (...a: unknown[]) => listPendingForTargetMock(...a),
  },
}));
vi.mock("@/lib/db/aggregates/followAccess", () => ({
  followAccessAggregateRepo: {
    listUnapprovedFollowers: (...a: unknown[]) =>
      listUnapprovedFollowersMock(...a),
  },
}));
vi.mock("@/lib/db/domains/followLists", () => ({
  followListsRepo: {
    create: (...a: unknown[]) => listsCreateMock(...a),
    update: (...a: unknown[]) => listsUpdateMock(...a),
    remove: (...a: unknown[]) => listsRemoveMock(...a),
    getById: (...a: unknown[]) => listsGetByIdMock(...a),
  },
}));
vi.mock("@/lib/db/domains/followListMembers", () => ({
  followListMembersRepo: {
    addMember: (...a: unknown[]) => addMemberMock(...a),
    removeMember: (...a: unknown[]) => removeMemberMock(...a),
  },
}));
vi.mock("@/lib/db/domains/followInviteLinks", () => ({
  followInviteLinksRepo: {
    getByUserId: (...a: unknown[]) => inviteGetByUserIdMock(...a),
    regenerate: (...a: unknown[]) => inviteRegenerateMock(...a),
  },
}));
vi.mock("@/lib/db/domains/followRequests", () => ({
  followRequestsRepo: {
    reject: (...a: unknown[]) => rejectMock(...a),
    withdraw: (...a: unknown[]) => withdrawMock(...a),
  },
}));
vi.mock("@/lib/db/domains/followApprovalNotifications", () => ({
  followApprovalNotificationsRepo: {
    recordApproval: (...a: unknown[]) => recordApprovalMock(...a),
  },
}));

/** withAuth 済みルート想定: req.authUid を持つ */
function authReq(query: Record<string, unknown> = {}, body?: unknown) {
  return { query: { userId: "me", ...query }, body, authUid: "me" } as unknown as NextApiRequest;
}
function profileReq(query: Record<string, unknown>) {
  return { query, headers: {} } as unknown as NextApiRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleFollowsList", () => {
  it("アクセス拒否はその status を返す", async () => {
    checkProfileAccessMock.mockResolvedValue({
      hasAccess: false,
      error: { status: 403, message: "private" },
    });
    const { result } = await handleFollowsList(
      profileReq({ userId: "u1", type: "following" }),
    );
    expect(result).toMatchObject({ ok: false, status: 403 });
  });

  it("type が不正なら err(400)", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true, viewerId: "v" });
    const { result } = await handleFollowsList(
      profileReq({ userId: "u1", type: "bogus" }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("正常時は getFollowList の結果を ok", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true, viewerId: "v" });
    getFollowListMock.mockResolvedValue({ users: [], totalCount: 0 });
    const { result } = await handleFollowsList(
      profileReq({ userId: "u1", type: "followers" }),
    );
    expect(result).toEqual({ ok: true, body: { users: [], totalCount: 0 } });
  });
});

describe("handleFollow", () => {
  it("viewerId が無ければ err(401)", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true });
    const { result } = await handleFollow(profileReq({ userId: "u1" }));
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("自分自身へのフォローは err(400)", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true, viewerId: "u1" });
    const { result } = await handleFollow(profileReq({ userId: "u1" }));
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("未フォローなら toggleFollow して ok", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true, viewerId: "v" });
    isFollowingMock.mockResolvedValue(false);
    toggleFollowMock.mockResolvedValue(true);
    const { result } = await handleFollow(profileReq({ userId: "u1" }));
    expect(result).toMatchObject({
      ok: true,
      body: { isFollowing: true, message: "Followed" },
    });
  });

  it("フォロー済みなら Already followed を ok", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true, viewerId: "v" });
    isFollowingMock.mockResolvedValue(true);
    const { result } = await handleFollow(profileReq({ userId: "u1" }));
    expect(result).toMatchObject({
      ok: true,
      body: { message: "Already followed" },
    });
    expect(toggleFollowMock).not.toHaveBeenCalled();
  });
});

describe("handleUnfollow", () => {
  it("未フォローなら Already unfollowed を ok", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true, viewerId: "v" });
    isFollowingMock.mockResolvedValue(false);
    const { result } = await handleUnfollow(profileReq({ userId: "u1" }));
    expect(result).toMatchObject({
      ok: true,
      body: { message: "Already unfollowed" },
    });
    expect(unfollowAndCleanupListsMock).not.toHaveBeenCalled();
  });

  it("フォロー中なら unfollowAndCleanupLists して ok", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true, viewerId: "v" });
    isFollowingMock.mockResolvedValue(true);
    const { result } = await handleUnfollow(profileReq({ userId: "u1" }));
    expect(result).toMatchObject({ ok: true, body: { message: "Unfollowed" } });
    expect(unfollowAndCleanupListsMock).toHaveBeenCalledWith("v", "u1");
  });
});

describe("follow-invite", () => {
  it("GET はトークンを ok（無ければ null）", async () => {
    inviteGetByUserIdMock.mockResolvedValue(null);
    const { result, targetUserId, viewerId } =
      await handleGetInviteToken(authReq());
    expect(result).toEqual({ ok: true, body: { token: null } });
    expect(targetUserId).toBe("me");
    expect(viewerId).toBe("me");
  });

  it("POST は再発行トークンを ok", async () => {
    inviteRegenerateMock.mockResolvedValue("tok123");
    const { result } = await handleRegenerateInvite(authReq());
    expect(result).toEqual({ ok: true, body: { token: "tok123" } });
  });
});

describe("follow-lists", () => {
  it("一覧は lists を ok", async () => {
    getListsWithMemberCountMock.mockResolvedValue([{ id: 1 }]);
    const { result } = await handleFollowListsList(authReq());
    expect(result).toEqual({ ok: true, body: { lists: [{ id: 1 }] } });
  });

  it("作成は id を ok", async () => {
    listsCreateMock.mockResolvedValue(42);
    const { result } = await handleCreateFollowList(
      authReq({}, { name: "list", isPublic: false }),
    );
    expect(result).toEqual({ ok: true, body: { id: 42 } });
  });

  it("作成: body 不正なら err(400)", async () => {
    const { result } = await handleCreateFollowList(authReq({}, { name: "" }));
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("更新: 対象なしなら err(404)", async () => {
    listsUpdateMock.mockResolvedValue(false);
    const { result } = await handleUpdateFollowList(
      authReq({ listId: "5" }, { name: "new" }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("削除: 成功で status deleted", async () => {
    listsRemoveMock.mockResolvedValue(true);
    const { result } = await handleDeleteFollowList(authReq({ listId: "5" }));
    expect(result).toEqual({ ok: true, body: { status: "deleted" } });
  });

  it("listId が不正なら err(400)", async () => {
    const { result } = await handleUpdateFollowList(
      authReq({ listId: "abc" }, { name: "x" }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });
});

describe("follow-lists members", () => {
  it("他人のリストなら err(404)", async () => {
    listsGetByIdMock.mockResolvedValue({ userId: "other" });
    const { result } = await handleAddListMember(
      authReq({ listId: "5", followingId: "f1" }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("フォローしていない相手の追加は err(400)", async () => {
    listsGetByIdMock.mockResolvedValue({ userId: "me" });
    isFollowingMock.mockResolvedValue(false);
    const { result } = await handleAddListMember(
      authReq({ listId: "5", followingId: "f1" }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("正常追加は status added", async () => {
    listsGetByIdMock.mockResolvedValue({ userId: "me" });
    isFollowingMock.mockResolvedValue(true);
    const { result } = await handleAddListMember(
      authReq({ listId: "5", followingId: "f1" }),
    );
    expect(result).toEqual({ ok: true, body: { status: "added" } });
    expect(addMemberMock).toHaveBeenCalledWith(5, "f1");
  });

  it("削除は status removed", async () => {
    listsGetByIdMock.mockResolvedValue({ userId: "me" });
    const { result } = await handleRemoveListMember(
      authReq({ listId: "5", followingId: "f1" }),
    );
    expect(result).toEqual({ ok: true, body: { status: "removed" } });
  });
});

describe("follow-requests", () => {
  it("一覧は request/legacy を統合し createdAt 昇順で ok", async () => {
    listPendingForTargetMock.mockResolvedValue([
      {
        id: 1,
        requesterId: "r1",
        requesterName: "R1",
        requesterImage: null,
        createdAt: "2024-01-02",
      },
    ]);
    listUnapprovedFollowersMock.mockResolvedValue([
      {
        followerId: "r2",
        followerName: "R2",
        followerImage: null,
        createdAt: "2024-01-01",
      },
    ]);
    const { result } = await handleFollowRequestsList(authReq());
    expect(result.ok).toBe(true);
    if (result.ok) {
      const body = result.body as { requests: Array<{ kind: string }> };
      expect(body.requests.map((r) => r.kind)).toEqual(["legacy", "request"]);
    }
  });

  it("承認: 対象なしは err(404)", async () => {
    approveFollowRequestMock.mockResolvedValue(null);
    const { result } = await handleApproveFollowRequest(
      authReq({ requestId: "7" }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("承認: 成功は requesterId 付きで ok", async () => {
    approveFollowRequestMock.mockResolvedValue("r1");
    const { result } = await handleApproveFollowRequest(
      authReq({ requestId: "7" }),
    );
    expect(result).toEqual({
      ok: true,
      body: { status: "approved", requesterId: "r1" },
    });
  });

  it("却下: 対象なしは err(404)", async () => {
    rejectMock.mockResolvedValue(false);
    const { result } = await handleRejectFollowRequest(
      authReq({ requestId: "7" }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });
});

describe("followers/[followerId]", () => {
  it("DELETE: 対象なしは err(404)", async () => {
    unfollowAndCleanupListsMock.mockResolvedValue(false);
    const { result } = await handleRemoveFollower(
      authReq({ followerId: "f1" }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("DELETE: 成功は status removed", async () => {
    unfollowAndCleanupListsMock.mockResolvedValue(true);
    const { result } = await handleRemoveFollower(
      authReq({ followerId: "f1" }),
    );
    expect(result).toEqual({ ok: true, body: { status: "removed" } });
    expect(unfollowAndCleanupListsMock).toHaveBeenCalledWith("f1", "me");
  });

  it("POST(legacy承認): フォローしていなければ err(404)", async () => {
    isFollowingMock.mockResolvedValue(false);
    const { result } = await handleApproveLegacyFollower(
      authReq({ followerId: "f1" }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("POST(legacy承認): 成功は recordApproval + withdraw して ok", async () => {
    isFollowingMock.mockResolvedValue(true);
    const { result } = await handleApproveLegacyFollower(
      authReq({ followerId: "f1" }),
    );
    expect(result).toEqual({ ok: true, body: { status: "approved" } });
    expect(recordApprovalMock).toHaveBeenCalledWith("f1", "me");
    expect(withdrawMock).toHaveBeenCalledWith("f1", "me");
  });
});
