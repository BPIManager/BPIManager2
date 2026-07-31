import { describe, it, expect, vi } from "vitest";
import { createDbSpy, callsFor } from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as unknown },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return (dbHolder.current as { db: unknown }).db;
  },
}));

const getLatestArenaStatsPerVersionMock = vi.hoisted(() => vi.fn());
const getBestArenaClassPerVersionMock = vi.hoisted(() => vi.fn());
const getStatsPrivacyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/domains/officialArenaStats", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/db/domains/officialArenaStats")>();
  return {
    ...actual,
    getLatestArenaStatsPerVersion: getLatestArenaStatsPerVersionMock,
    getBestArenaClassPerVersion: getBestArenaClassPerVersionMock,
  };
});
vi.mock("@/lib/db/domains/statsPrivacy", () => ({
  getStatsPrivacy: getStatsPrivacyMock,
}));

const { userProfilesRepo } = await import("@/lib/db/aggregates/userProfiles");

describe("userProfilesRepo.getRecommendedUsers", () => {
  it("order='supporters'の場合、自分自身の除外whereをスキップしrole絞り込みを行うこと", async () => {
    const spy = createDbSpy([]);
    dbHolder.current = spy;
    await userProfilesRepo.getRecommendedUsers({
      viewerId: "user-1",
      viewerValue: 30,
      version: "33",
      limit: 20,
      offset: 0,
      order: "supporters",
    });
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls.some((c) => c.args[0] === "u.userId")).toBe(false);
  });

  it("order未指定の場合、自分自身を除外すること", async () => {
    const spy = createDbSpy([]);
    dbHolder.current = spy;
    await userProfilesRepo.getRecommendedUsers({
      viewerId: "user-1",
      viewerValue: 30,
      version: "33",
      limit: 20,
      offset: 0,
    });
    const whereCalls = callsFor(spy.calls, "where");
    expect(
      whereCalls.some(
        (c) => c.args[0] === "u.userId" && c.args[1] === "!=",
      ),
    ).toBe(true);
  });

  it("limit/offsetが適用されること", async () => {
    const spy = createDbSpy([]);
    dbHolder.current = spy;
    await userProfilesRepo.getRecommendedUsers({
      viewerId: "user-1",
      viewerValue: 30,
      version: "33",
      limit: 15,
      offset: 5,
    });
    expect(callsFor(spy.calls, "limit")[0].args).toEqual([15]);
    expect(callsFor(spy.calls, "offset")[0].args).toEqual([5]);
  });
});

describe("userProfilesRepo.getGlobalRanking", () => {
  it("radarカテゴリの場合userRadarCacheを結合すること", async () => {
    const spy = createDbSpy([]);
    dbHolder.current = spy;
    await userProfilesRepo.getGlobalRanking("33", "notes");
    const innerJoinCalls = callsFor(spy.calls, "innerJoin");
    expect(
      innerJoinCalls.some((c) =>
        String(c.args[0]).includes("userRadarCache"),
      ),
    ).toBe(true);
  });

  it("filterAreaが指定された場合、areaでの絞り込みを行うこと", async () => {
    const spy = createDbSpy([]);
    dbHolder.current = spy;
    await userProfilesRepo.getGlobalRanking("33", "totalBpi", "東京都");
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls.some((c) => c.args[0] === "oas.area")).toBe(true);
  });
});

describe("userProfilesRepo.getMe", () => {
  it("ユーザーが存在しない場合nullを返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await userProfilesRepo.getMe("user-1", "33");
    expect(result).toBeNull();
  });

  it("follow件数を数値化しroleをオブジェクト化すること", async () => {
    dbHolder.current = createDbSpy({
      userId: "user-1",
      userName: "テスト",
      followingCount: "3",
      followerCount: "5",
      role: "iidx",
      description: "説明",
      grantedAt: "2025-01-01",
    });

    const result = await userProfilesRepo.getMe("user-1", "33");

    expect(result?.followingCount).toBe(3);
    expect(result?.followerCount).toBe(5);
    expect(result?.role).toEqual({
      role: "iidx",
      description: "説明",
      grantedAt: "2025-01-01",
    });
  });

  it("roleがない場合nullになること", async () => {
    dbHolder.current = createDbSpy({
      userId: "user-1",
      followingCount: 0,
      followerCount: 0,
      role: null,
    });
    const result = await userProfilesRepo.getMe("user-1", "33");
    expect(result?.role).toBeNull();
  });
});

describe("userProfilesRepo.getUserProfileSummary", () => {
  function createProfileDbSpy(userBaseResult: unknown, bpiHistoryResult: unknown) {
    const calls: { method: string; args: unknown[] }[] = [];
    const makeChain = (result: unknown) => {
      const handler: ProxyHandler<object> = {
        get(_t, prop) {
          if (typeof prop !== "string") return undefined;
          return (...args: unknown[]) => {
            calls.push({ method: prop, args });
            if (
              prop === "execute" ||
              prop === "executeTakeFirst" ||
              prop === "executeTakeFirstOrThrow"
            ) {
              return Promise.resolve(result);
            }
            return proxy;
          };
        },
      };
      const proxy = new Proxy({}, handler);
      return proxy;
    };

    // userBaseはexecuteTakeFirst、bpiHistoryはexecute。呼び出し順で切り替える。
    let selectFromCount = 0;
    const dbHandler: ProxyHandler<object> = {
      get(_t, prop) {
        if (typeof prop !== "string") return undefined;
        return vi.fn((...args: unknown[]) => {
          calls.push({ method: prop, args });
          if (prop === "selectFrom") {
            selectFromCount++;
            return selectFromCount === 1
              ? makeChain(userBaseResult)
              : makeChain(bpiHistoryResult);
          }
          return makeChain(undefined);
        });
      },
    };
    return { db: new Proxy({}, dbHandler), calls };
  }

  it("ユーザーが存在しない場合nullを返すこと", async () => {
    dbHolder.current = createProfileDbSpy(undefined, []);
    const result = await userProfilesRepo.getUserProfileSummary("user-1");
    expect(result).toBeNull();
  });

  it("非公開設定(showArenaClass=false)かつ他人視点の場合arenaClassがnullになること", async () => {
    dbHolder.current = createProfileDbSpy(
      {
        userId: "target-1",
        userName: "対象ユーザー",
        profileText: null,
        profileImage: null,
        iidxId: null,
        xId: null,
        isPublic: 1,
        role: null,
        description: null,
        grantedAt: null,
        followerCount: 1,
        followingCount: 2,
        isFollowing: 0,
        isFollowedBy: 0,
      },
      [{ version: "33", totalBpi: "30" }],
    );
    getLatestArenaStatsPerVersionMock.mockResolvedValue([
      {
        version: "33",
        arenaClass: "A1",
        arenaRank: 1,
        area: "東京都",
        gradeSp: 1,
        gradeDp: 1,
        fetchedAt: new Date("2025-06-01"),
      },
    ]);
    getBestArenaClassPerVersionMock.mockResolvedValue(new Map());
    getStatsPrivacyMock.mockResolvedValue({
      showArenaClass: 0,
      showArenaRank: 0,
      showArea: 0,
      showGrade: 0,
    });

    const result = await userProfilesRepo.getUserProfileSummary(
      "target-1",
      "viewer-1", // 閲覧者は本人ではない
    );

    expect(result?.relationship.isSelf).toBe(false);
    const v33 = result?.stats.find((s) => s.version === "33");
    expect(v33?.arenaClass).toBeNull();
    expect(v33?.totalBpi).toBe(30);
  });

  it("本人視点の場合、プライバシー設定に関わらずarenaClassが見えること", async () => {
    dbHolder.current = createProfileDbSpy(
      {
        userId: "self-1",
        userName: "自分",
        profileText: null,
        profileImage: null,
        iidxId: null,
        xId: null,
        isPublic: 1,
        role: null,
        description: null,
        grantedAt: null,
        followerCount: 0,
        followingCount: 0,
        isFollowing: 0,
        isFollowedBy: 0,
      },
      [],
    );
    getLatestArenaStatsPerVersionMock.mockResolvedValue([
      {
        version: "33",
        arenaClass: "A1",
        arenaRank: 1,
        area: "東京都",
        gradeSp: 1,
        gradeDp: 1,
        fetchedAt: new Date("2025-06-01"),
      },
    ]);
    getBestArenaClassPerVersionMock.mockResolvedValue(new Map());
    getStatsPrivacyMock.mockResolvedValue({
      showArenaClass: 0,
      showArenaRank: 0,
      showArea: 0,
      showGrade: 0,
    });

    const result = await userProfilesRepo.getUserProfileSummary("self-1", "self-1");

    expect(result?.relationship.isSelf).toBe(true);
    const v33 = result?.stats.find((s) => s.version === "33");
    expect(v33?.arenaClass).toBe("A1");
  });

  it("INFバージョンは常に最後にソートされること", async () => {
    dbHolder.current = createProfileDbSpy(
      {
        userId: "user-1",
        userName: "テスト",
        profileText: null,
        profileImage: null,
        iidxId: null,
        xId: null,
        isPublic: 1,
        role: null,
        description: null,
        grantedAt: null,
        followerCount: 0,
        followingCount: 0,
        isFollowing: 0,
        isFollowedBy: 0,
      },
      [
        { version: "INF", totalBpi: "10" },
        { version: "33", totalBpi: "20" },
        { version: "32", totalBpi: "15" },
      ],
    );
    getLatestArenaStatsPerVersionMock.mockResolvedValue([]);
    getBestArenaClassPerVersionMock.mockResolvedValue(new Map());
    getStatsPrivacyMock.mockResolvedValue({
      showArenaClass: 1,
      showArenaRank: 1,
      showArea: 1,
      showGrade: 1,
    });

    const result = await userProfilesRepo.getUserProfileSummary("user-1");

    expect(result?.stats.map((s) => s.version)).toEqual(["33", "32", "INF"]);
  });
});
