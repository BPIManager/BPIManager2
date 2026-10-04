import { describe, it, expect, vi, beforeEach } from "vitest";

const getAccessInfoMock = vi.fn();
const hasApprovedFollowAccessMock = vi.fn();

vi.mock("@/lib/db/domains/users", () => ({
  usersRepo: { getAccessInfo: (...a: unknown[]) => getAccessInfoMock(...a) },
}));
vi.mock("@/lib/db/domains/oauth", () => ({ oauthRepo: {} }));
vi.mock("@/lib/db/aggregates/followAccess", () => ({
  followAccessAggregateRepo: {
    hasApprovedFollowAccess: (...a: unknown[]) =>
      hasApprovedFollowAccessMock(...a),
  },
}));

const { checkSelfOrPublicAccess } = await import("@/lib/mcp/auth");

describe("checkSelfOrPublicAccess", () => {
  beforeEach(() => {
    getAccessInfoMock.mockReset();
    hasApprovedFollowAccessMock.mockReset();
  });

  it("自分自身はDBを引かずに許可されること", async () => {
    const result = await checkSelfOrPublicAccess("u1", "u1");
    expect(result.allowed).toBe(true);
    expect(getAccessInfoMock).not.toHaveBeenCalled();
  });

  it("存在しないユーザーは拒否されること", async () => {
    getAccessInfoMock.mockResolvedValue(undefined);
    const result = await checkSelfOrPublicAccess("u1", "ghost");
    expect(result.allowed).toBe(false);
  });

  it("公開ユーザーは許可されること", async () => {
    getAccessInfoMock.mockResolvedValue({ isPublic: 1 });
    const result = await checkSelfOrPublicAccess("u1", "u2");
    expect(result.allowed).toBe(true);
    expect(hasApprovedFollowAccessMock).not.toHaveBeenCalled();
  });

  it("非公開ユーザーは承認済みフォローが無ければ拒否されること", async () => {
    getAccessInfoMock.mockResolvedValue({ isPublic: 0 });
    hasApprovedFollowAccessMock.mockResolvedValue(false);
    const result = await checkSelfOrPublicAccess("u1", "u2");
    expect(result.allowed).toBe(false);
  });

  it("非公開ユーザーでも承認済みフォローがあれば許可されること", async () => {
    getAccessInfoMock.mockResolvedValue({ isPublic: 0 });
    hasApprovedFollowAccessMock.mockResolvedValue(true);
    const result = await checkSelfOrPublicAccess("u1", "u2");
    expect(result.allowed).toBe(true);
    expect(hasApprovedFollowAccessMock).toHaveBeenCalledWith("u1", "u2");
  });
});
