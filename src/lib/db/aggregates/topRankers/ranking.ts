import { db } from "@/lib/db";
import { sql } from "kysely";
import { userDisplayColumns } from "@/lib/db/shared/userDisplay";
import { latestPerUserSubquery as latestArenaPerUserSubquery } from "@/lib/db/domains/arenaHistory";
import { maskedArenaClass } from "@/lib/db/shared/arenaClassVisibility";
import type { AllDifficulties } from "@/types/songs/allSongs";

export interface TopRankerHolderRankingParams {
  version: string;
  /** エリア(eagateのpref_id。0=全国) */
  areaId: number;
  /** 数える譜面のレベル（空なら絞らない） */
  levels: number[];
  /** 数える譜面の難易度（空なら絞らない） */
  difficulties: AllDifficulties[];
}

export const topRankersRankingRepo = {
  /**
   * 1位を獲得している譜面数のユーザー別ランキング（アリーナクラスは非公開設定に従いマスクする）。
   * `topRankers.iidxId`（ハイフン無し）と`users.iidxId`（ハイフン有無混在）を、users側を正規化して突き合わせる。
   * 難易度・レベルは`allSongs`から引く。先にiidxIdごとに集計してからusersへ結合する。
   */
  async getHolderRanking(params: TopRankerHolderRankingParams) {
    const { version, areaId, levels, difficulties } = params;

    let counts = db
      .selectFrom("topRankers as t")
      .innerJoin("allSongs as s", "s.songId", "t.songId")
      .select(["t.iidxId", sql<number>`COUNT(*)`.as("holdCount")])
      .where("t.version", "=", version)
      .where("t.areaId", "=", areaId)
      .where("t.iidxId", "is not", null);
    if (levels.length > 0) counts = counts.where("s.difficultyLevel", "in", levels);
    if (difficulties.length > 0)
      counts = counts.where("s.difficulty", "in", difficulties);

    return await db
      .selectFrom("users as u")
      .innerJoin(counts.groupBy("t.iidxId").as("h"), (join) =>
        join.on(sql<boolean>`REPLACE(u.iidxId, '-', '') = h.iidxId`),
      )
      .leftJoin(
        latestArenaPerUserSubquery(version).as("la"),
        "u.userId",
        "la.userId",
      )
      .leftJoin("officialArenaStats as oas", "la.maxId", "oas.id")
      .leftJoin("statsPrivacy as sp", "sp.userId", "u.userId")
      .select([
        ...userDisplayColumns("u"),
        "h.holdCount",
        maskedArenaClass.as("arenaClass"),
      ])
      .orderBy("h.holdCount", "desc")
      .orderBy("u.userId")
      .execute();
  },
};
