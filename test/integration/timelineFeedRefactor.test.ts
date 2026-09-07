import { describe, it, expect, afterAll } from "vitest";
import "dotenv/config";
import { sql } from "kysely";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { db } from "@/lib/db";
import { socialTimelineRepo } from "@/lib/db/aggregates/rivalScores/feed";

dayjs.extend(utc);

/**
 * `SocialTimelineRepository.getFollowedTimeline` の2フェーズ化リファクタ（fix/timeline-followed-two-phase）の
 * 等価性テスト。
 *
 * リファクタ前の単一クエリ実装を `legacyGetFollowedTimeline` としてこのファイルに再現し、
 * 現行の2フェーズ実装と全フィルタ条件（mode / search / levels / difficulties / cursor）の
 * 組み合わせで結果が完全一致することを検証する。
 *
 * 唯一の意図的な差異は「lastPlayed が同値の行の並び順を logId 降順で決定的にした」点であり、
 * legacy 側にも同じタイブレーク (`order by s.lastPlayed desc, s.logId desc`) を入れて比較する
 * （リファクタ前は同値行の順序が不定だった）。
 *
 * 前提: `.env` の DB 接続情報（DB_HOST 等）と TEST_PUBLIC_USER_ID。
 */

const VIEWER_ID = process.env.TEST_PUBLIC_USER_ID || "";
const CAN_RUN = !!process.env.DB_HOST && !!VIEWER_ID;

/** リファクタ前の単一クエリ実装（タイブレークのみ追加） */
async function legacyGetFollowedTimeline(params: {
  viewerId: string;
  version: string;
  limit: number;
  lastId?: string;
  mode?: "all" | "played" | "overtaken";
  search?: string;
  levels?: number[];
  difficulties?: string[];
}) {
  const { viewerId, version, limit, lastId, mode, search, levels, difficulties } =
    params;

  return await db
    .selectFrom("follows as f")
    .modifyFront(sql`straight_join`)
    .innerJoin("scores as s", (join) =>
      join.onRef("s.userId", "=", "f.followingId").on("s.version", "=", version),
    )
    .innerJoin("users as u", "s.userId", "u.userId")
    .innerJoin("songs as m", "s.songId", "m.songId")
    .innerJoin("songDef as d", (join) =>
      join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
    )
    .select((eb) => [
      "s.logId",
      "s.userId",
      "s.songId",
      "s.exScore",
      "s.bpi",
      "s.clearState",
      "s.lastPlayed",
      "u.userName",
      "u.profileImage",
      "m.title",
      "m.difficulty",
      "m.difficultyLevel",
      "m.notes",
      "d.wrScore",
      "d.kaidenAvg",
      eb.fn
        .coalesce(
          eb
            .selectFrom("scores as s2")
            .select((s2eb) => s2eb.fn.max("s2.exScore").as("m"))
            .whereRef("s2.userId", "=", "s.userId")
            .whereRef("s2.songId", "=", "s.songId")
            .whereRef("s2.logId", "<", "s.logId"),
          eb.lit(-1),
        )
        .as("prevExScore"),
      eb
        .selectFrom("scores as s3")
        .select("s3.bpi")
        .whereRef("s3.userId", "=", "s.userId")
        .whereRef("s3.songId", "=", "s.songId")
        .whereRef("s3.logId", "<", "s.logId")
        .orderBy("s3.logId", "desc")
        .limit(1)
        .as("prevBpi"),
      eb
        .selectFrom("scores as s4")
        .select((s4eb) => s4eb.fn.max("s4.exScore").as("m"))
        .where("s4.userId", "=", viewerId)
        .whereRef("s4.songId", "=", "s.songId")
        .where("s4.version", "=", version)
        .as("myBestExScore"),
    ])
    .where("f.followerId", "=", viewerId)
    .where((eb) =>
      eb.or([
        eb("u.isPublic", "=", 1),
        eb.exists(
          eb
            .selectFrom("followApprovalNotifications as fan")
            .select("fan.id")
            .where("fan.recipientId", "=", viewerId)
            .whereRef("fan.actorId", "=", "u.userId"),
        ),
      ]),
    )
    .$if(!!search, (qb) =>
      qb.where((eb) =>
        eb.or([
          eb("u.userName", "like", `%${search}%`),
          eb("m.title", "like", `%${search}%`),
        ]),
      ),
    )
    .$if(!!levels?.length, (qb) => qb.where("m.difficultyLevel", "in", levels!))
    .$if(!!difficulties?.length, (qb) =>
      qb.where("m.difficulty", "in", difficulties!),
    )
    .$if(mode === "played", (qb) =>
      qb.where(({ exists, selectFrom }) =>
        exists(
          selectFrom("scores as v")
            .select("v.logId")
            .whereRef("v.songId", "=", "s.songId")
            .where("v.userId", "=", viewerId)
            .where("v.version", "=", version),
        ),
      ),
    )
    .$if(mode === "overtaken", (qb) =>
      qb.where((eb) =>
        eb.exists(
          eb
            .selectFrom("scores as v")
            .select(eb.lit(1).as("one"))
            .whereRef("v.songId", "=", "s.songId")
            .where("v.userId", "=", viewerId)
            .where("v.version", "=", version)
            .having((heb) =>
              heb.and([
                heb(heb.fn.max("v.exScore"), "<", heb.ref("s.exScore")),
                heb(
                  heb.fn.max("v.exScore"),
                  ">",
                  heb.fn.coalesce(
                    heb
                      .selectFrom("scores as prev")
                      .select((peb) => peb.fn.max("prev.exScore").as("m"))
                      .whereRef("prev.userId", "=", "s.userId")
                      .whereRef("prev.songId", "=", "s.songId")
                      .whereRef("prev.logId", "<", "s.logId"),
                    heb.lit(-1),
                  ),
                ),
              ]),
            ),
        ),
      ),
    )
    .$if(!!lastId, (qb) =>
      qb.where("s.lastPlayed", "<", dayjs.utc(lastId).toDate()),
    )
    .orderBy("s.lastPlayed", "desc")
    .orderBy("s.logId", "desc")
    .limit(limit)
    .execute();
}

const VERSION = "33";
const CASES: Array<{
  name: string;
  params: Partial<Parameters<typeof legacyGetFollowedTimeline>[0]>;
}> = [
  { name: "all / no filter", params: {} },
  { name: "mode=played", params: { mode: "played" } },
  { name: "mode=overtaken", params: { mode: "overtaken" } },
  { name: "levels=[12]", params: { levels: [12] } },
  { name: "levels=[11,12]", params: { levels: [11, 12] } },
  { name: "difficulties=[ANOTHER]", params: { difficulties: ["ANOTHER"] } },
  {
    name: "difficulties=[HYPER,ANOTHER]",
    params: { difficulties: ["HYPER", "ANOTHER"] },
  },
  { name: "search=a", params: { search: "a" } },
  {
    name: "search + level + difficulty",
    params: { search: "e", levels: [12], difficulties: ["ANOTHER"] },
  },
  {
    name: "played + levels",
    params: { mode: "played", levels: [11, 12] },
  },
  {
    name: "overtaken + difficulties",
    params: { mode: "overtaken", difficulties: ["ANOTHER"] },
  },
];

describe.skipIf(!CAN_RUN)("getFollowedTimeline 2-phase refactor equivalence", () => {
  afterAll(async () => {
    await db.destroy();
  });

  for (const { name, params } of CASES) {
    it(`page 1 matches legacy: ${name}`, async () => {
      const args = {
        viewerId: VIEWER_ID,
        version: VERSION,
        limit: 20,
        ...params,
      };
      const [next, legacy] = await Promise.all([
        socialTimelineRepo.getFollowedTimeline(args),
        legacyGetFollowedTimeline(args),
      ]);
      expect(next).toEqual(legacy);
    }, 30_000);

    it(`page 2 (cursor) matches legacy: ${name}`, async () => {
      const args = {
        viewerId: VIEWER_ID,
        version: VERSION,
        limit: 20,
        ...params,
      };
      const legacyP1 = await legacyGetFollowedTimeline(args);
      if (legacyP1.length < 20) return; // 2ページ目が存在しないケースはスキップ
      const lastId = String(legacyP1[legacyP1.length - 1].lastPlayed);
      const p2Args = { ...args, lastId };
      const [next, legacy] = await Promise.all([
        socialTimelineRepo.getFollowedTimeline(p2Args),
        legacyGetFollowedTimeline(p2Args),
      ]);
      expect(next).toEqual(legacy);
    }, 30_000);
  }
});
