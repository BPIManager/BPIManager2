import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNotifications,
  markNotificationsRead,
  getUnreadCount,
} from "@/lib/subhandlers/notifications";

const getNotificationsMock = vi.fn();
const getUnreadCountMock = vi.fn();
const updateLastReadMock = vi.fn();

vi.mock("@/lib/db/aggregates/notifications", () => ({
  notificationsAggregateRepo: {
    getNotifications: (...args: unknown[]) => getNotificationsMock(...args),
    getUnreadCount: (...args: unknown[]) => getUnreadCountMock(...args),
  },
}));

vi.mock("@/lib/db/domains/notifications", () => ({
  notificationsRepo: {
    updateLastRead: (...args: unknown[]) => updateLastReadMock(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getNotifications", () => {
  it("クエリ省略時は既定値(all / page 0 / limit 20)で取得し ok を返す", async () => {
    const rows = [{ type: "follow" }];
    getNotificationsMock.mockResolvedValue(rows);

    const result = await getNotifications("u1", {});

    expect(result).toEqual({ ok: true, body: rows });
    expect(getNotificationsMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", type: "all", limit: 20, offset: 0 }),
    );
  });

  it("page/limit から offset を計算する", async () => {
    getNotificationsMock.mockResolvedValue([]);

    await getNotifications("u1", { page: "2", limit: "10", type: "follow" });

    expect(getNotificationsMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "follow", limit: 10, offset: 20 }),
    );
  });

  it("クエリが不正なら err(400) を返し、リポジトリを呼ばない", async () => {
    const result = await getNotifications("u1", { limit: "999" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
    expect(getNotificationsMock).not.toHaveBeenCalled();
  });
});

describe("markNotificationsRead", () => {
  it("updateLastRead を呼び ok({ success: true }) を返す", async () => {
    updateLastReadMock.mockResolvedValue(undefined);

    const result = await markNotificationsRead("u1");

    expect(result).toEqual({ ok: true, body: { success: true } });
    expect(updateLastReadMock).toHaveBeenCalledWith("u1");
  });
});

describe("getUnreadCount", () => {
  it("集計結果をそのまま ok で返す", async () => {
    getUnreadCountMock.mockResolvedValue({ total: 7 });

    const result = await getUnreadCount("u1");

    expect(result).toEqual({ ok: true, body: { total: 7 } });
    expect(getUnreadCountMock).toHaveBeenCalledWith("u1", expect.any(String));
  });
});
