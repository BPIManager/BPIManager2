import { describe, it, expect, vi, afterEach } from "vitest";

const { dbMock } = vi.hoisted(() => {
  const dbMock = {
    lastTrx: null as unknown,
    transaction() {
      return {
        execute: async (cb: (trx: unknown) => Promise<unknown>) => {
          const trx = { marker: "trx" };
          dbMock.lastTrx = trx;
          return cb(trx);
        },
      };
    },
  };
  return { dbMock };
});

vi.mock("@/lib/db", () => ({ db: dbMock }));

import { followsRepo } from "@/lib/db/domains/follow";
import { followListMembersRepo } from "@/lib/db/domains/followListMembers";
import { unfollowAndCleanupLists } from "@/lib/db/orchestrators/unfollow";

describe("unfollowAndCleanupLists", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("followsの削除と、解除相手を全リストから外す処理を1トランザクションで行うこと", async () => {
    const removeSpy = vi
      .spyOn(followsRepo, "removeInTransaction")
      .mockResolvedValue(true);
    const cleanupSpy = vi
      .spyOn(followListMembersRepo, "deleteByFollowingForOwner")
      .mockResolvedValue(undefined);

    const result = await unfollowAndCleanupLists("follower-1", "target-1");

    expect(result).toBe(true);
    const trx = dbMock.lastTrx;
    expect(removeSpy).toHaveBeenCalledWith(trx, "follower-1", "target-1");
    expect(cleanupSpy).toHaveBeenCalledWith(trx, "follower-1", "target-1");
  });

  it("フォロー関係が存在しなかった場合、リスト所属の削除を行わずfalseを返すこと", async () => {
    const removeSpy = vi
      .spyOn(followsRepo, "removeInTransaction")
      .mockResolvedValue(false);
    const cleanupSpy = vi
      .spyOn(followListMembersRepo, "deleteByFollowingForOwner")
      .mockResolvedValue(undefined);

    const result = await unfollowAndCleanupLists("follower-1", "target-1");

    expect(result).toBe(false);
    expect(removeSpy).toHaveBeenCalled();
    expect(cleanupSpy).not.toHaveBeenCalled();
  });
});
