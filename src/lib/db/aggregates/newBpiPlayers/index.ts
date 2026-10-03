import { db } from "@/lib/db";
import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { latestScoresRepo } from "@/lib/db/domains/scores/latest";
import { userStatusLogsReadRepo } from "@/lib/db/domains/userStatusLogs/read";

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
 * BPI V2検証ツールの全プレイヤー一覧のページ単位データ取得。BPI計算は呼び出し元が行い、ここはDB集約のみ。
 * ソート・フィルタは userStatusLogs.totalBpi を使い、ページングを壊さないよう1つのSQLで完結させる。
 */
export const newBpiPlayersAggregateRepo = {
  async getPage(params: GetPageParams) {
    const { limit, offset, version, bpiMin, bpiMax } = params;

    const songMaster = await songMasterRepo.getSongMasterWithDef();
    const level12Songs = songMaster.filter((s) => s.difficultyLevel === 12);
    const songIds = level12Songs.map((s) => s.songId);

    if (songIds.length === 0) {
      return { users: [], totalCount: 0, songs: level12Songs, scores: [] };
    }

    const latestStatus = userStatusLogsReadRepo.latestPerUserSubquery(version);

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
    const scores = await latestScoresRepo.getLatestScoresForUsers(
      userIds,
      version,
      songIds,
    );

    return { users, totalCount, songs: level12Songs, scores };
  },
};
