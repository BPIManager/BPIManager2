import { usersRepo } from "@/lib/db/domains/users";
import { songsRepo } from "@/lib/db/domains/songs";
import { scoresRepo } from "@/lib/db/domains/scores";

/**
 * issue #299〜304検証用「全プレイヤー」一覧のためのページ単位データ取得。
 *
 * 都度の計算量を抑えるため、対象を「そのページに含まれる公開ユーザーのみ」に
 * 絞ってスコアを取得する(全公開ユーザー分を一度に読み込まない)。
 * BPIの実計算(現行/新方式/差分)は呼び出し元(APIハンドラ)が
 * `@/lib/bpi`・`@/lib/bpi/newBpi` を使って行う(このファイルはDB集約のみ)。
 */
export const newBpiPlayersAggregateRepo = {
  async getPage(params: { limit: number; offset: number; version: string }) {
    const { limit, offset, version } = params;

    const [users, totalCount, songMaster] = await Promise.all([
      usersRepo.getPublicUsersPage(limit, offset),
      usersRepo.getPublicUserCount(),
      songsRepo.getSongMasterWithDef(),
    ]);

    const level12Songs = songMaster.filter((s) => s.difficultyLevel === 12);
    const userIds = users.map((u) => u.userId);
    const songIds = level12Songs.map((s) => s.songId);

    const scores = await scoresRepo.getLatestScoresForUsers(
      userIds,
      version,
      songIds,
    );

    return { users, totalCount, songs: level12Songs, scores };
  },
};
