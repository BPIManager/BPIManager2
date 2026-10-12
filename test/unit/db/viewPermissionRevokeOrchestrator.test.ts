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

import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";
import { followsRepo } from "@/lib/db/domains/follow";
import { revokeViewPermission } from "@/lib/db/orchestrators/viewPermissionRevoke";

describe("revokeViewPermission", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("承認記録だけをトランザクション内で削除し、followsには触れないこと", async () => {
    const deleteSpy = vi
      .spyOn(followApprovalNotificationsRepo, "deleteForPair")
      .mockResolvedValue(2);
    const removeSpy = vi.spyOn(followsRepo, "removeInTransaction");

    const result = await revokeViewPermission("follower-1", "target-1");

    expect(result).toBe(true);
    expect(deleteSpy).toHaveBeenCalledWith(
      dbMock.lastTrx,
      "follower-1",
      "target-1",
    );
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it("承認記録が無ければfalseを返すこと", async () => {
    vi.spyOn(followApprovalNotificationsRepo, "deleteForPair").mockResolvedValue(
      0,
    );
    expect(await revokeViewPermission("follower-1", "target-1")).toBe(false);
  });
});
