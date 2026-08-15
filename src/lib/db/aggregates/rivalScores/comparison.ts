import { db } from "@/lib/db";
import {
  correlatedLatestLogId,
  latestLogIdPerSongScalarSubquery,
  latestLogIdPerUserSongScalarSubquery,
} from "@/lib/db/shared/latestScore";

/**
 * ソーシャル比較機能（勝敗統計・レーダー・楽曲別スコア）を担当するリポジトリクラス。
 */
class SocialComparisonRepository {
  /**
   * 閲覧者とライバルの難易度レベル別勝敗統計を取得する。
   *
   * レベル 11・12 の最新スコアを比較し、勝ち・負け・引き分けの件数を集計する。
   *
   * @param viewerId - 閲覧者のユーザー ID
   * @param rivalId - 比較対象ライバルのユーザー ID
   * @param version - バージョン番号
   * @returns `{ level, win, lose, draw }[]`
   */
  async getWinLossStats(viewerId: string, rivalId: string, version: string) {
    // songs をドライバーにして level 11/12 のみを対象とし、
    // 相関サブクエリで最新 logId を取得しながら1クエリで集計まで完結させる。
    // 相関サブクエリは idx_scores_version_user_song_log(version,userId,songId,logId DESC) を点引きするので高速。
    const rows = await db
      .selectFrom("songs as m")
      .innerJoin("scores as v", (join) =>
        join
          .onRef("v.songId", "=", "m.songId")
          .on("v.userId", "=", viewerId)
          .on("v.version", "=", version)
          .on("v.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "v2",
              songIdRef: "m.songId",
              version,
              userId: viewerId,
            }),
          ),
      )
      .innerJoin("scores as r", (join) =>
        join
          .onRef("r.songId", "=", "m.songId")
          .on("r.userId", "=", rivalId)
          .on("r.version", "=", version)
          .on("r.logId", "=", (eb) =>
            correlatedLatestLogId(eb, {
              table: "scores",
              alias: "r2",
              songIdRef: "m.songId",
              version,
              userId: rivalId,
            }),
          ),
      )
      .select([
        "m.difficultyLevel as level",
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
      ])
      .where("m.difficultyLevel", "in", [11, 12])
      .groupBy("m.difficultyLevel")
      .execute();

    return rows.map((r) => ({
      level: r.level as number,
      win: Number(r.win),
      lose: Number(r.lose),
      draw: Number(r.draw),
    }));
  }

  /**
   * 指定ユーザーのレーダーキャッシュを取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   * @returns `userRadarCache` のレコード、存在しない場合は `undefined`
   */
  async getUserRadar(userId: string, version: string) {
    return await db
      .selectFrom("userRadarCache")
      .selectAll()
      .where("userId", "=", userId)
      .where("version", "=", version)
      .executeTakeFirst();
  }

  /**
   * 閲覧者とライバルの難易度レベル別スコア更新履歴を全件取得する。
   * 日次累積勝敗推移の計算に使用する。
   *
   * @param viewerId - 閲覧者のユーザー ID
   * @param rivalId - 比較対象ライバルのユーザー ID
   * @param version - バージョン番号
   * @param level - 対象難易度レベル（11 または 12）
   */
  async getWinLossHistory(
    viewerId: string,
    rivalId: string,
    version: string,
    level: number,
  ) {
    const levelSongs = await db
      .selectFrom("songs")
      .select("songId")
      .where("difficultyLevel", "=", level)
      .execute();

    if (levelSongs.length === 0) return [];

    const songIds = levelSongs.map((s) => s.songId);

    return db
      .selectFrom("scores as s")
      .select(["s.songId", "s.userId", "s.exScore", "s.lastPlayed", "s.logId"])
      .where("s.userId", "in", [viewerId, rivalId])
      .where("s.version", "=", version)
      .where("s.songId", "in", songIds)
      .orderBy("s.lastPlayed", "asc")
      .orderBy("s.logId", "asc")
      .execute();
  }

  /**
   * フォロー中の全ユーザーに対する勝敗サマリーを一括取得する。
   *
   * 各フォローユーザーとの勝ち・負け・引き分け件数、レーダーデータ（自分・相手）、
   * アリーナランク・総合 BPI を含む。
   *
   * @param params.viewerId - 閲覧者のユーザー ID
   * @param params.version - バージョン番号
   * @param params.levels - 対象難易度レベルの配列（空の場合は全レベル）
   * @param params.difficulties - 対象難易度文字列の配列（空の場合は全難易度）
   * @param params.listId - 指定時、`viewerId`が所有するこのフォローリストの
   *   所属ユーザーだけに絞り込む（呼び出し元で所有権を確認済みであること。
   *   #277）
   */
  // follows・users・userStatusLogs・officialArenaStats・userRadarCache・
  // userRoles・songs・songDef・scores(自分/ライバル)を横断JOINした
  // 勝敗サマリー集計のため、直接クエリを維持する。aggregates/内で最も
  // 重いクエリである。勝敗集計はrivalsLatest×myLatest(実際にスコアが
  // 両者に存在する組み合わせのみ)側で先に集約したwl小テーブルとして
  // 求め、外側のfollows一覧とは1:1のLEFT JOINで結合することで行数の
  // 爆発を防いでいる。
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
      // followsの存在だけでは判定できない(#275フォロー後方修正: 公開時代に
      // 成立したfollowsには承認記録がないため、承認記録の有無も要求する)
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

export const socialComparisonRepo = new SocialComparisonRepository();
