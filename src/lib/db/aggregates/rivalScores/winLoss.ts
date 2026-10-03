import { db } from "@/lib/db";
import { correlatedLatestLogId } from "@/lib/db/shared/latestScore/correlated";

/**
 * 自分とライバルの勝敗統計・勝敗履歴・レーダー（カテゴリ別BPI）を担当するリポジトリクラス。
 */
class SocialWinLossRepository {
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
   *   所属ユーザーだけに絞り込む（呼び出し元で所有権を確認済みであること）
   */
  // follows・users・userStatusLogs・officialArenaStats・userRadarCache・
  // userRoles・songs・songDef・scores(自分/ライバル)を横断JOINした
  // 勝敗サマリー集計のため、直接クエリを維持する。aggregates/内で最も
  // 重いクエリである。勝敗集計はrivalsLatest×myLatest(実際にスコアが
  // 両者に存在する組み合わせのみ)側で先に集約したwl小テーブルとして
  // 求め、外側のfollows一覧とは1:1のLEFT JOINで結合することで行数の
  // 爆発を防いでいる。
}

export const socialWinLossRepo = new SocialWinLossRepository();
