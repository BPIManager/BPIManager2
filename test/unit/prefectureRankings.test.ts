import { describe, it, expect } from "vitest";
import { buildRankings } from "@/lib/arena/prefectureRankings";

const arenaData = {
  fetchedAt: "2025-01-01T00:00:00Z",
  grades: [
    {
      grade_id: 1,
      players: [
        { id: "user-a1-2nd", area: "東京都", arena_class: "A1", rank: 2 },
        { id: "user-a1-1st", area: "東京都", arena_class: "A1", rank: 1 },
        { id: "user-a2", area: "東京都", arena_class: "A2", rank: 1 },
        { id: "user-other-area", area: "大阪府", arena_class: "A1", rank: 1 },
        { id: "user-non-a", area: "東京都", arena_class: "B1", rank: 1 },
        { id: "", area: "東京都", arena_class: "A1", rank: 3 },
        { id: "user-no-area", area: "", arena_class: "A1", rank: 3 },
      ],
    },
  ],
};

describe("buildRankings", () => {
  const rankings = buildRankings(arenaData);

  it("同一エリア内でクラス→rank順に並べ、areaRankを1始まりで付与すること", () => {
    expect(rankings["user-a1-1st"]).toEqual({
      area: "東京都",
      areaRank: 1,
      totalInArea: 3,
    });
    expect(rankings["user-a1-2nd"]).toEqual({
      area: "東京都",
      areaRank: 2,
      totalInArea: 3,
    });
    expect(rankings["user-a2"]).toEqual({
      area: "東京都",
      areaRank: 3,
      totalInArea: 3,
    });
  });

  it("A級以外(B1等)のプレイヤーは除外されること", () => {
    expect(rankings["user-non-a"]).toBeUndefined();
  });

  it("idまたはareaが空のプレイヤーは除外されること", () => {
    expect(rankings[""]).toBeUndefined();
    expect(rankings["user-no-area"]).toBeUndefined();
  });

  it("エリアが異なれば別集計になること", () => {
    expect(rankings["user-other-area"]).toEqual({
      area: "大阪府",
      areaRank: 1,
      totalInArea: 1,
    });
  });

  it("gradesが空の場合、空オブジェクトを返すこと", () => {
    expect(buildRankings({ fetchedAt: "", grades: [] })).toEqual({});
  });
});
