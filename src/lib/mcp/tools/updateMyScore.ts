import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { v4 as uuidv4 } from "uuid";
import { bpiRepo } from "@/lib/db/bpi";
import { songsRepo } from "@/lib/db/songs";
import { allSongsRepo } from "@/lib/db/allSongs";
import { saveImportResults } from "@/lib/db/orchestrators/bpiImport";
import { BpiCalculator } from "@/lib/bpi";
import { isImproved } from "@/lib/lamp";
import { NewAllScores, NewScore } from "@/types/db";
import { updateMyScoreSchema } from "@/lib/mcp/schemas";

export function registerUpdateMyScore(server: McpServer, userId: string) {
  server.registerTool(
    "update_my_score",
    {
      title: "自分のスコア・クリアランプを更新",
      description:
        `認証済みユーザー自身の、指定songId楽曲のスコア・クリアランプを更新する。` +
        `songIdはsearch_songsで取得したものを使うこと。対象はscores/songDefドメイン（level 11/12等、` +
        `現在BPI定義のある楽曲）のみで、search_songsで見つからないレベル10以下の楽曲は更新できない。` +
        `同じ楽曲が全難易度履歴(allScores)側にも存在する場合は、そちらも合わせて更新される。` +
        `既存の自己ベスト（EXスコア・クリアランプ・ミスカウント）のいずれも上回らない場合は書き込みを行わず、` +
        `「更新なし」を返す（誤って過去の記録で上書きしてしまう事故を防ぐため）。`,
      inputSchema: updateMyScoreSchema.shape,
    },
    async ({ songId, version, exScore, clearState, missCount }) => {
      const [bpiSongMaster, allLevelMaster, currentScores, currentAllScores, lastLog] =
        await Promise.all([
          songsRepo.getSongMasterWithDef(),
          allSongsRepo.getAllLevelMaster(),
          bpiRepo.getLatestScores(userId, version),
          bpiRepo.getLatestAllScores(userId, version),
          bpiRepo.getLatestTotalBpi(userId, version),
        ]);

      const song = bpiSongMaster.find((s) => s.songId === songId);
      if (!song) {
        return {
          content: [
            {
              type: "text",
              text:
                `songId=${songId} は現在BPI定義のある楽曲として見つかりませんでした。` +
                `search_songsで取得したsongIdでも、songDefが存在しない楽曲（BPI計算対象外の難易度など）は更新できません。`,
            },
          ],
        };
      }

      const current = currentScores.find((s) => s.songId === songId);
      const scoreBetter = exScore > (current?.exScore ?? 0);
      const lampBetter = isImproved(clearState, current?.clearState ?? null);
      const currentMiss = current?.missCount ?? Infinity;
      const missBetter = missCount !== undefined && missCount < currentMiss;
      const improved = exScore > 0 && (scoreBetter || lampBetter || missBetter);

      if (!improved) {
        return {
          content: [
            {
              type: "text",
              text:
                `更新しませんでした。現在の記録（exScore=${current?.exScore ?? "未プレイ"}, ` +
                `clearState=${current?.clearState ?? "NO PLAY"}, missCount=${current?.missCount ?? "-"}）` +
                `の方が良いか同等です。`,
            },
          ],
        };
      }

      const bpi = BpiCalculator.calc(exScore, song);
      const batchId = uuidv4();
      const lastPlayed = new Date();
      const scoreUpdates: NewScore[] = [
        {
          userId,
          songId: song.songId,
          definitionId: song.defId,
          exScore,
          bpi,
          clearState,
          missCount: missCount ?? null,
          lastPlayed,
          version,
          batchId,
        },
      ];

      // songs/songDefドメインと同じ楽曲がallSongsドメインにも存在する場合、
      // 全難易度履歴(allScores)側が更新から取り残されないよう、こちらも独立して改善判定の上で書き込む
      // (CSVバッチインポート `scores/bulk.ts` と同じ二重書き込みパターン)
      const allSong = allLevelMaster.find(
        (s) => s.title === song.title && s.difficulty === song.difficulty,
      );
      const allScoreUpdates: NewAllScores[] = [];
      if (allSong) {
        const currentAllScore = currentAllScores.find(
          (s) => s.songId === allSong.songId,
        );
        const allScoreBetter = exScore > (currentAllScore?.exScore ?? 0);
        const allLampBetter = isImproved(
          clearState,
          currentAllScore?.clearState ?? null,
        );
        const currentAllMiss = currentAllScore?.missCount ?? Infinity;
        const allMissBetter =
          missCount !== undefined && missCount < currentAllMiss;
        const allImproved =
          exScore > 0 && (allScoreBetter || allLampBetter || allMissBetter);

        if (allImproved) {
          allScoreUpdates.push({
            userId,
            songId: allSong.songId,
            definitionId: null,
            exScore,
            bpi,
            clearState,
            missCount: missCount ?? null,
            lastPlayed,
            version,
            batchId,
          } as NewAllScores);
        }
      }

      const twelves = bpiSongMaster.filter((s) => s.difficultyLevel === 12);
      const allBpisForTotal = twelves.map((s) =>
        s.songId === song.songId
          ? (bpi ?? -15)
          : (currentScores.find((cs) => cs.songId === s.songId)?.bpi ?? -15),
      );
      const newTotalBpi = BpiCalculator.calculateTotalBPI(
        allBpisForTotal,
        twelves.length,
      );

      await saveImportResults({
        userId,
        version,
        batchId,
        scoreUpdates,
        allScoreUpdates,
        newTotalBpi,
      });

      const previousTotalBpi = lastLog?.totalBpi ?? -15;

      return {
        content: [
          {
            type: "text",
            text:
              `更新しました。${song.title} [${song.difficulty}] exScore=${exScore}, ` +
              `clearState=${clearState}, bpi=${bpi ?? "計算不可"}。` +
              `総合BPI: ${previousTotalBpi} → ${newTotalBpi}` +
              (allScoreUpdates.length > 0
                ? "（全難易度履歴も合わせて更新しました）"
                : ""),
          },
        ],
      };
    },
  );
}
