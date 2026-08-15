import { describe, it, expect, vi, afterEach } from "vitest";

import { usersRepo } from "@/lib/db/domains/users";
import { followInviteLinksRepo } from "@/lib/db/domains/followInviteLinks";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followsRepo } from "@/lib/db/domains/follow";
import { submitFollowRequest } from "@/lib/db/orchestrators/followRequestSubmission";

describe("submitFollowRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("トークンが無効な場合invalid_tokenを返すこと", async () => {
    vi.spyOn(followInviteLinksRepo, "getByToken").mockResolvedValue(undefined);

    const result = await submitFollowRequest("requester-1", "bad-token");

    expect(result).toEqual({ status: "invalid_token" });
  });

  it("招待発行者が自分自身の場合selfを返すこと", async () => {
    vi.spyOn(followInviteLinksRepo, "getByToken").mockResolvedValue({
      userId: "requester-1",
      token: "tok",
      createdAt: new Date(),
    });

    const result = await submitFollowRequest("requester-1", "tok");

    expect(result).toEqual({ status: "self" });
  });

  it("対象ユーザーが存在しない場合target_not_foundを返すこと", async () => {
    vi.spyOn(followInviteLinksRepo, "getByToken").mockResolvedValue({
      userId: "target-1",
      token: "tok",
      createdAt: new Date(),
    });
    vi.spyOn(usersRepo, "getAccessInfo").mockResolvedValue(undefined);

    const result = await submitFollowRequest("requester-1", "tok");

    expect(result).toEqual({ status: "target_not_found" });
  });

  it("対象が非公開の場合followRequestsにpendingで作成しrequestedを返すこと", async () => {
    vi.spyOn(followInviteLinksRepo, "getByToken").mockResolvedValue({
      userId: "target-1",
      token: "tok",
      createdAt: new Date(),
    });
    vi.spyOn(usersRepo, "getAccessInfo").mockResolvedValue({
      userId: "target-1",
      isPublic: 0,
    });
    vi.spyOn(followsRepo, "isFollowing").mockResolvedValue(false);
    const createSpy = vi
      .spyOn(followRequestsRepo, "create")
      .mockResolvedValue(undefined);

    const result = await submitFollowRequest("requester-1", "tok");

    expect(result).toEqual({ status: "requested" });
    expect(createSpy).toHaveBeenCalledWith("requester-1", "target-1");
  });

  it("対象が非公開かつ既に承認済み(follows済み)の場合、重複したリクエストを作らずfollowedを返すこと", async () => {
    vi.spyOn(followInviteLinksRepo, "getByToken").mockResolvedValue({
      userId: "target-1",
      token: "tok",
      createdAt: new Date(),
    });
    vi.spyOn(usersRepo, "getAccessInfo").mockResolvedValue({
      userId: "target-1",
      isPublic: 0,
    });
    vi.spyOn(followsRepo, "isFollowing").mockResolvedValue(true);
    const createSpy = vi
      .spyOn(followRequestsRepo, "create")
      .mockResolvedValue(undefined);

    const result = await submitFollowRequest("requester-1", "tok");

    expect(result).toEqual({ status: "followed" });
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("対象が(招待発行後に)公開に変わっていた場合、保留リクエストを作らず即時followsを作成しfollowedを返すこと", async () => {
    vi.spyOn(followInviteLinksRepo, "getByToken").mockResolvedValue({
      userId: "target-1",
      token: "tok",
      createdAt: new Date(),
    });
    vi.spyOn(usersRepo, "getAccessInfo").mockResolvedValue({
      userId: "target-1",
      isPublic: 1,
    });
    vi.spyOn(followsRepo, "isFollowing").mockResolvedValue(false);
    const toggleSpy = vi
      .spyOn(followsRepo, "toggleFollow")
      .mockResolvedValue(true);
    const createSpy = vi
      .spyOn(followRequestsRepo, "create")
      .mockResolvedValue(undefined);

    const result = await submitFollowRequest("requester-1", "tok");

    expect(result).toEqual({ status: "followed" });
    expect(toggleSpy).toHaveBeenCalledWith("requester-1", "target-1");
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("対象が公開かつ既にフォロー済みの場合、toggleFollowを呼ばず(誤って解除しない)followedを返すこと", async () => {
    vi.spyOn(followInviteLinksRepo, "getByToken").mockResolvedValue({
      userId: "target-1",
      token: "tok",
      createdAt: new Date(),
    });
    vi.spyOn(usersRepo, "getAccessInfo").mockResolvedValue({
      userId: "target-1",
      isPublic: 1,
    });
    vi.spyOn(followsRepo, "isFollowing").mockResolvedValue(true);
    const toggleSpy = vi
      .spyOn(followsRepo, "toggleFollow")
      .mockResolvedValue(true);

    const result = await submitFollowRequest("requester-1", "tok");

    expect(result).toEqual({ status: "followed" });
    expect(toggleSpy).not.toHaveBeenCalled();
  });
});
