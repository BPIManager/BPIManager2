import { describe, it, expect, vi, afterEach } from "vitest";

import { followsRepo } from "@/lib/db/domains/follow";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";

describe("followAccessAggregateRepo.hasApprovedFollowAccess", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("followsが存在しない場合、承認記録を確認せずfalseを返すこと", async () => {
    vi.spyOn(followsRepo, "isFollowing").mockResolvedValue(false);
    const existsSpy = vi.spyOn(followApprovalNotificationsRepo, "existsForPair");

    const result = await followAccessAggregateRepo.hasApprovedFollowAccess(
      "follower-1",
      "target-1",
    );

    expect(result).toBe(false);
    expect(existsSpy).not.toHaveBeenCalled();
  });

  it("followsは存在するが承認記録がない場合falseを返すこと(公開時代の既存フォロー)", async () => {
    vi.spyOn(followsRepo, "isFollowing").mockResolvedValue(true);
    vi.spyOn(followApprovalNotificationsRepo, "existsForPair").mockResolvedValue(
      false,
    );

    const result = await followAccessAggregateRepo.hasApprovedFollowAccess(
      "follower-1",
      "target-1",
    );

    expect(result).toBe(false);
  });

  it("followsと承認記録の両方が存在する場合trueを返すこと", async () => {
    vi.spyOn(followsRepo, "isFollowing").mockResolvedValue(true);
    vi.spyOn(followApprovalNotificationsRepo, "existsForPair").mockResolvedValue(
      true,
    );

    const result = await followAccessAggregateRepo.hasApprovedFollowAccess(
      "follower-1",
      "target-1",
    );

    expect(result).toBe(true);
  });
});
