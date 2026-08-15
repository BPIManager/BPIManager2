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

import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followsRepo } from "@/lib/db/domains/follow";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";
import { approveFollowRequest } from "@/lib/db/orchestrators/followRequestApproval";

describe("approveFollowRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("リクエストの削除・followsの作成・承認通知の記録を1トランザクションで行うこと", async () => {
    vi.spyOn(followRequestsRepo, "getById").mockResolvedValue({
      id: 1,
      requesterId: "requester-1",
      targetUserId: "target-1",
      createdAt: new Date(),
    });
    const deleteByIdSpy = vi
      .spyOn(followRequestsRepo, "deleteById")
      .mockResolvedValue(undefined);
    const followsCreateSpy = vi
      .spyOn(followsRepo, "create")
      .mockResolvedValue(undefined);
    const notifyCreateSpy = vi
      .spyOn(followApprovalNotificationsRepo, "create")
      .mockResolvedValue(undefined);

    const result = await approveFollowRequest(1, "target-1");

    expect(result).toBe("requester-1");
    const trx = dbMock.lastTrx;
    expect(deleteByIdSpy).toHaveBeenCalledWith(trx, 1);
    expect(followsCreateSpy).toHaveBeenCalledWith(
      trx,
      "requester-1",
      "target-1",
    );
    expect(notifyCreateSpy).toHaveBeenCalledWith(trx, {
      recipientId: "requester-1",
      actorId: "target-1",
    });
  });

  it("リクエストが存在しない場合nullを返し、書き込みを一切行わないこと", async () => {
    vi.spyOn(followRequestsRepo, "getById").mockResolvedValue(undefined);
    const deleteByIdSpy = vi
      .spyOn(followRequestsRepo, "deleteById")
      .mockResolvedValue(undefined);

    const result = await approveFollowRequest(999, "target-1");

    expect(result).toBeNull();
    expect(deleteByIdSpy).not.toHaveBeenCalled();
  });

  it("targetUserIdがリクエスト先と一致しない場合nullを返すこと(なりすまし承認の防止)", async () => {
    vi.spyOn(followRequestsRepo, "getById").mockResolvedValue({
      id: 1,
      requesterId: "requester-1",
      targetUserId: "target-1",
      createdAt: new Date(),
    });
    const deleteByIdSpy = vi
      .spyOn(followRequestsRepo, "deleteById")
      .mockResolvedValue(undefined);

    const result = await approveFollowRequest(1, "someone-else");

    expect(result).toBeNull();
    expect(deleteByIdSpy).not.toHaveBeenCalled();
  });
});
