import { db } from "@/lib/db";
import { songsRepo } from "@/lib/db/domains/songs";
import { scoresRepo } from "@/lib/db/domains/scores";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";

interface GetPageParams {
  limit: number;
  offset: number;
  version: string;
  /** 現行総合BPI(userStatusLogs基準、最新ログ値)の下限(含む)。省略時は制限なし。 */
  bpiMin?: number;
  /** 現行総合BPIの上限(含まない)。省略時は制限なし。 */
  bpiMax?: number;
}

/**
 * issue #299〜304検証用「全プレイヤー」一覧のためのページ単位データ取得。
 *
 * 都度の計算量を抑えるため、対象を「そのページに含まれる公開ユーザーのみ」に
 * 絞ってスコアを取得する(全公開ユーザー分を一度に読み込まない)。
 * BPIの実計算(現行/新方式/差分)は呼び出し元(APIハンドラ)が
 * `@/lib/bpi`・`@/lib/bpi/newBpi` を使って行う(このファイルはDB集約のみ)。
 *
 * ソート・フィルタ・除外は「表示対象を絞り込む」段階の話で、ライブスコアからの
 * 逐次計算(currentTotal等)とは独立して成立させる必要があるため、
 * `userStatusLogs.totalBpi`(バッチ更新のたびに記録される総合BPIログの最新値。
 * `userProfiles/ranking.ts`のグローバルランキングと同じデータ源)を
 * ソートキー・フィルタ条件として使う。ライブ計算のcurrentTotalとは
 * 更新タイミングの違いで多少ズレうる。users・userStatusLogs・scores(EXISTS)の
 * 3テーブルを跨ぐ1つのSQLでORDER BY/WHERE/LIMITを一体で行う必要があり
 * (ページングの正しさはDB側の絞り込みと表示件数が一致して初めて保証される)、
 * ドメイン別メソッドの組み合わせに分解するとページングが壊れるため、
 * この集約内に直接クエリを書く。
 */
export const newBpiPlayersAggregateRepo = {
  async getPage(params: GetPageParams) {
    const { limit, offset, version, bpiMin, bpiMax } = params;

    const songMaster = await songsRepo.getSongMasterWithDef();
    const level12Songs = songMaster.filter((s) => s.difficultyLevel === 12);
    const songIds = level12Songs.map((s) => s.songId);

    if (songIds.length === 0) {
      return { users: [], totalCount: 0, songs: level12Songs, scores: [] };
    }

    const latestStatus = userStatusLogsRepo.latestPerUserSubquery(version);

    let base = db
      .selectFrom("users as u")
      .innerJoin(latestStatus.as("ls"), "u.userId", "ls.userId")
      .innerJoin("userStatusLogs as usl", "ls.maxId", "usl.id")
      .where("u.isPublic", "=", 1)
      // ☆12の登録スコアが1曲もないユーザーは、この画面の趣旨(☆12総合BPIの
      // 新旧比較)上、比較のしようがないため除外する
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom("scores as sc")
            .select("sc.logId")
            .whereRef("sc.userId", "=", "u.userId")
            .where("sc.version", "=", version)
            .where("sc.songId", "in", songIds),
        ),
      );

    if (bpiMin !== undefined) {
      base = base.where("usl.totalBpi", ">=", String(bpiMin));
    }
    if (bpiMax !== undefined) {
      base = base.where("usl.totalBpi", "<", String(bpiMax));
    }

    const [countRow, users] = await Promise.all([
      base
        .select((eb) => eb.fn.countAll<number>().as("count"))
        .executeTakeFirst(),
      base
        .select(["u.userId", "u.userName"])
        .orderBy("usl.totalBpi", "desc")
        .limit(limit)
        .offset(offset)
        .execute(),
    ]);
    const totalCount = Number(countRow?.count ?? 0);

    const userIds = users.map((u) => u.userId);
    const scores = await scoresRepo.getLatestScoresForUsers(
      userIds,
      version,
      songIds,
    );

    return { users, totalCount, songs: level12Songs, scores };
  },
};
