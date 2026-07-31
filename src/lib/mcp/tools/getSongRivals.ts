import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { songsRepo } from "@/lib/db/domains/songs";
import { scoresRepo } from "@/lib/db/domains/scores";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { songRivalsSchema } from "@/lib/mcp/schemas";

export function registerGetSongRivals(server: McpServer, userId: string) {
  server.registerTool(
    "get_song_rivals",
    {
      title: "特定楽曲の自分とライバルのスコアを比較取得",
      description:
        `指定した1曲について、自分の現在のスコアと、フォロー中ライバル（公開プロフィールのみ）` +
        `全員の現在のスコアを一覧で取得する。songIdはsearch_songsで取得すること。` +
        `「この曲で自分は何位？」「この曲、○○さんに勝ってる？」のような特定曲の比較質問に使うこと。`,
      inputSchema: songRivalsSchema.shape,
    },
    async ({ songId, version }) => {
      const [song, myScore, rivals] = await Promise.all([
        songsRepo.getSongById(songId),
        scoresRepo.getLatestScoreForSong(userId, songId, version),
        rivalRepo.getFollowedScoresForSong({
          viewerId: userId,
          songId,
          version,
        }),
      ]);

      if (!song) {
        return {
          content: [
            {
              type: "text",
              text: `songId=${songId} の楽曲が見つかりませんでした。search_songsで取得したsongIdを指定してください。`,
            },
          ],
        };
      }

      const notice = `${song.title} [${song.difficulty}] の自分とライバル（フォロー中の公開プロフィールユーザー）${rivals.length}人分のスコアを返却しました。`;

      return {
        content: [
          { type: "text", text: notice },
          {
            type: "text",
            text: JSON.stringify({
              song: {
                songId: song.songId,
                title: song.title,
                difficulty: song.difficulty,
                difficultyLevel: song.difficultyLevel,
                notes: song.notes,
                wrScore: song.wrScore,
                kaidenAvg: song.kaidenAvg,
              },
              me: myScore
                ? {
                    exScore: myScore.exScore,
                    bpi: myScore.bpi,
                    clearState: myScore.clearState,
                    missCount: myScore.missCount,
                    lastPlayed: myScore.lastPlayed,
                  }
                : null,
              rivals: rivals.map((r) => ({
                userId: r.userId,
                userName: r.userName,
                exScore: r.exScore,
                bpi: r.bpi,
                clearState: r.clearState,
                lastPlayed: r.lastPlayed,
              })),
            }),
          },
        ],
      };
    },
  );
}
