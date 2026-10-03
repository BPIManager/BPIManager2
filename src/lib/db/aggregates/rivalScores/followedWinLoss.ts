import { db } from "@/lib/db";
import { latestLogIdPerSongScalarSubquery, latestLogIdPerUserSongScalarSubquery } from "@/lib/db/shared/latestScore";

/**
 * フォロー中ライバル全員に対する勝敗サマリーを担当するリポジトリクラス。
 */
class SocialFollowedWinLossRepository {
  async getFollowedWinLossSummary(params: {
    viewerId: string;
    version: string;
    levels: number[];
    difficulties: string[];
    listId?: number;
  }) {
    const { viewerId, version, levels, difficulties, listId } = params;
    const targetSongs = db
      .selectFrom("songs as m")
      .innerJoin("songDef as d", (join) =>
        join.onRef("d.songId", "=", "m.songId").on("d.isCurrent", "=", 1),
      )
      .select(["m.songId"])
      .$if(levels.length > 0, (qb) =>
        qb.where("m.difficultyLevel", "in", levels),
      )
      .$if(difficulties.length > 0, (qb) =>
        qb.where("m.difficulty", "in", difficulties),
      );

    const targetSongCount = await db
      .selectFrom(targetSongs.as("m"))
      .select((eb) => eb.fn.countAll().as("count"))
      .executeTakeFirst();
    if (!targetSongCount || Number(targetSongCount.count) === 0) return [];

    const myLatest = db
      .selectFrom("scores as s")
      .select(["s.songId", "s.exScore"])
      .where("s.userId", "=", viewerId)
      .where("s.version", "=", version)
      .where(
        "s.logId",
        "in",
        latestLogIdPerSongScalarSubquery({
          table: "scores",
          userId: viewerId,
          version,
        }),
      );

    const rivalsLatest = db
      .selectFrom("scores as s")
      .innerJoin("follows as f", "f.followingId", "s.userId")
      .select(["s.userId", "s.songId", "s.exScore"])
      .where("f.followerId", "=", viewerId)
      .where("s.version", "=", version)
      .where(
        "s.logId",
        "in",
        latestLogIdPerUserSongScalarSubquery({
          table: "scores",
          version,
          followersOf: viewerId,
        }),
      );

    const latestStatusIds = db
      .selectFrom("userStatusLogs")
      .select(["userId", (eb) => eb.fn.max("id").as("maxId")])
      .where("version", "=", version)
      .groupBy("userId");

    const latestArenaIds = db
      .selectFrom("officialArenaStats")
      .select(["userId", (eb) => eb.fn.max("id").as("maxId")])
      .where("version", "=", version)
      .groupBy("userId");

    const winLossByRival = db
      .selectFrom(rivalsLatest.as("r"))
      .innerJoin(myLatest.as("v"), "v.songId", "r.songId")
      .innerJoin(targetSongs.as("m"), "m.songId", "r.songId")
      .select([
        "r.userId",
        (eb) =>
          eb.fn
            .sum(
              eb
                .case()
                .when(eb("v.exScore", ">", eb.ref("r.exScore")))
                .then(1)
                .else(0)
                .end(),
            )
            .as("win"),
        (eb) =>
          eb.fn
            .sum(
              eb
                .case()
                .when(eb("v.exScore", "<", eb.ref("r.exScore")))
                .then(1)
                .else(0)
                .end(),
            )
            .as("lose"),
        (eb) =>
          eb.fn
            .sum(
              eb
                .case()
                .when(eb("v.exScore", "=", eb.ref("r.exScore")))
                .then(1)
                .else(0)
                .end(),
            )
            .as("draw"),
        (eb) => eb.fn.countAll().as("totalCount"),
      ])
      .groupBy("r.userId");

    const results = await db
      .selectFrom("follows as f")
      .innerJoin("users as u", "f.followingId", "u.userId")
      .leftJoin(latestStatusIds.as("ls"), "u.userId", "ls.userId")
      .leftJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .leftJoin(latestArenaIds.as("lai"), "u.userId", "lai.userId")
      .leftJoin("officialArenaStats as oas", "lai.maxId", "oas.id")
      .leftJoin("userRadarCache as urc", (join) =>
        join
          .onRef("u.userId", "=", "urc.userId")
          .on("urc.version", "=", version),
      )
      .leftJoin("userRadarCache as vrc", (join) =>
        join.on("vrc.userId", "=", viewerId).on("vrc.version", "=", version),
      )
      .leftJoin("userRoles as ur", "u.userId", "ur.userId")
      .leftJoin(winLossByRival.as("wl"), "wl.userId", "u.userId")
      .select([
        "u.userId",
        "u.userName",
        "u.profileImage",
        "u.iidxId",
        "oas.arenaClass",
        "usl.totalBpi",
        "urc.notes as r_notes",
        "urc.chord as r_chord",
        "urc.peak as r_peak",
        "urc.charge as r_charge",
        "urc.scratch as r_scratch",
        "urc.soflan as r_soflan",
        "vrc.notes as v_notes",
        "vrc.chord as v_chord",
        "vrc.peak as v_peak",
        "vrc.charge as v_charge",
        "vrc.scratch as v_scratch",
        "vrc.soflan as v_soflan",
        "ur.role as ur_role",
        "ur.description as ur_description",
        "ur.grantedAt as ur_grantedAt",
        "usl.updatedAt as usl_updatedAt",
        (eb) => eb.fn.coalesce(eb.ref("wl.win"), eb.lit(0)).as("win"),
        (eb) => eb.fn.coalesce(eb.ref("wl.lose"), eb.lit(0)).as("lose"),
        (eb) => eb.fn.coalesce(eb.ref("wl.draw"), eb.lit(0)).as("draw"),
        (eb) =>
          eb.fn.coalesce(eb.ref("wl.totalCount"), eb.lit(0)).as("totalCount"),
      ])
      .where("f.followerId", "=", viewerId)
      // 対象が公開、または対象が非公開でも承認記録がある場合のみ表示する。
      // followsの存在だけでは判定できない(公開時代に成立したfollowsには
      // 承認記録がないため、承認記録の有無も要求する)
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
      .$if(listId !== undefined, (qb) =>
        qb.where(
          "f.followingId",
          "in",
          db
            .selectFrom("followListMembers")
            .select("followingId")
            .where("listId", "=", listId as number),
        ),
      )
      .orderBy("win", "desc")
      .execute();

    return results.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      profileImage: r.profileImage,
      iidxId: r.iidxId,
      arenaClass: r.arenaClass,
      totalBpi: r.totalBpi ? Number(r.totalBpi) : null,
      radar: {
        notes: Number(r.r_notes),
        chord: Number(r.r_chord),
        peak: Number(r.r_peak),
        charge: Number(r.r_charge),
        scratch: Number(r.r_scratch),
        soflan: Number(r.r_soflan),
      },
      viewerRadar: {
        notes: Number(r.v_notes),
        chord: Number(r.v_chord),
        peak: Number(r.v_peak),
        charge: Number(r.v_charge),
        scratch: Number(r.v_scratch),
        soflan: Number(r.v_soflan),
      },
      stats: {
        win: Number(r.win),
        lose: Number(r.lose),
        draw: Number(r.draw),
        totalCount: Number(r.totalCount),
      },
      lastUpdated: r.usl_updatedAt ?? null,
      role: r.ur_role
        ? {
            role: r.ur_role,
            description: r.ur_description ?? "",
            grantedAt: r.ur_grantedAt as string | Date,
          }
        : null,
    }));
  }
}

export const socialFollowedWinLossRepo = new SocialFollowedWinLossRepository();
