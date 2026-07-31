import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import dayjs from "@/lib/dayjs";
import { statsRepo } from "@/lib/db/stats";
import { rivalRepo } from "@/lib/db/domains/scores";
import { BpiCalculator } from "@/lib/bpi";
import { dashboardSchema } from "@/lib/mcp/schemas";

type HistoryRow = Awaited<ReturnType<typeof statsRepo.getScoreHistory>>[number];

function toJSTDateStr(date: Date | string) {
  return dayjs(date).tz().format("YYYY-MM-DD");
}

function latestBySong(history: HistoryRow[]) {
  const map = new Map<number, HistoryRow>();
  for (const row of history) {
    if (row.songId == null) continue;
    map.set(row.songId, row);
  }
  return Array.from(map.values());
}

function buildBpiTrend(
  history: HistoryRow[],
  totalSongCount: number,
  historyDays: number,
) {
  const logsByDate = new Map<string, HistoryRow[]>();
  for (const row of history) {
    if (!row.songId || !row.lastPlayed) continue;
    const date = toJSTDateStr(row.lastPlayed);
    const bucket = logsByDate.get(date);
    if (bucket) bucket.push(row);
    else logsByDate.set(date, [row]);
  }

  const dateKeys = Array.from(logsByDate.keys()).sort();
  const recentDateKeys = new Set(dateKeys.slice(-historyDays));

  const cumulativeBpiBySong = new Map<number, number>();
  const totalBpiHistory: { date: string; totalBpi: number }[] = [];
  const dailyBpi: { date: string; totalBpi: number; count: number }[] = [];

  for (const date of dateKeys) {
    const dayRows = logsByDate.get(date)!;
    const dayBestBpiBySong = new Map<number, number>();
    for (const row of dayRows) {
      const songId = row.songId as number;
      const bpi = row.bpi ?? -15;
      cumulativeBpiBySong.set(songId, bpi);
      if (!dayBestBpiBySong.has(songId) || dayBestBpiBySong.get(songId)! < bpi) {
        dayBestBpiBySong.set(songId, bpi);
      }
    }

    if (!recentDateKeys.has(date)) continue;

    totalBpiHistory.push({
      date,
      totalBpi: BpiCalculator.calculateTotalBPI(
        Array.from(cumulativeBpiBySong.values()),
        totalSongCount,
      ),
    });

    const dayBpis = Array.from(dayBestBpiBySong.values());
    dailyBpi.push({
      date,
      totalBpi: BpiCalculator.calculateTotalBPI(dayBpis, dayBpis.length),
      count: dayBpis.length,
    });
  }

  return { totalBpiHistory, dailyBpi };
}

export function registerGetMyDashboard(server: McpServer, userId: string) {
  server.registerTool(
    "get_my_dashboard",
    {
      title: "自分のBPIダッシュボード概要を取得",
      description:
        `スコア一覧を丸ごと取得することなく、自分の状況をダッシュボード的に俯瞰するための集計データを取得する。` +
        `含まれる情報: totalBpi(現在の総合BPI、常にレベル12全曲基準)とestimatedRank(皆伝内推定順位)、` +
        `totalBpiHistory(総合BPIの日別推移。過去の値を積み上げた累積値)、` +
        `dailyBpi(単日BPI。その日更新した曲だけで計算した、その日のプレイの質を表す値。累積のtotalBpiHistoryとは別物)、` +
        `strongSongs(BPIが高い得意曲TOP N)、weakSongs(BPIが低い苦手曲TOP N。伸びしろの参考になる)、` +
        `closeRivalSongs(フォロー中ライバルとのEXスコア差が小さい楽曲TOP N。プラスはライバルが上、マイナスは自分が上)。` +
        `totalBpiHistory/dailyBpi/strongSongs/weakSongs/closeRivalSongsはlevels/difficultiesパラメータで` +
        `対象レベル（11/12、複合可）・難易度種別（HYPER/ANOTHER/LEGGENDARIA、複合可）を絞り込めるが、` +
        `totalBpi/estimatedRank自体は皆伝ランキングの公式ルール通り常にレベル12全曲で計算される。` +
        `「今日はどの曲を伸ばせばいい？」「ライバルに追いつかれそうな曲は？」のような質問にはこのツールを優先的に使うこと。`,
      inputSchema: dashboardSchema.shape,
    },
    async ({ version, levels, difficulties, historyDays, topSongsLimit }) => {
      const numericLevels = levels.map(Number);

      const [canonicalHistory, canonicalCount, filteredHistory, filteredCount, closeRivalRows] =
        await Promise.all([
          statsRepo.getScoreHistory(userId, version, [12], []),
          statsRepo.getTotalSongCount([12], []),
          statsRepo.getScoreHistory(userId, version, numericLevels, difficulties),
          statsRepo.getTotalSongCount(numericLevels, difficulties),
          rivalRepo.getScoreComparisonList({
            userId,
            version,
            limit: 200,
            minDiff: -500,
            maxDiff: 500,
            levelArray: numericLevels,
            diffArray: difficulties,
          }),
        ]);

      if (canonicalHistory.length === 0 && filteredHistory.length === 0) {
        return {
          content: [
            { type: "text", text: "該当する条件のスコアデータがまだありません。" },
          ],
        };
      }

      // 総合BPI本体は常にレベル12全曲基準（levels/difficultiesの影響を受けない）
      const canonicalLatest = latestBySong(canonicalHistory);
      const totalBpi = BpiCalculator.calculateTotalBPI(
        canonicalLatest.map((s) => s.bpi ?? -15),
        canonicalCount,
      );
      const estimatedRank = BpiCalculator.estimateRank(totalBpi);

      // 以下はlevels/difficultiesで絞り込んだデータセットを使用
      const filteredLatest = latestBySong(filteredHistory);
      const { totalBpiHistory, dailyBpi } = buildBpiTrend(
        filteredHistory,
        filteredCount,
        historyDays,
      );

      const playedWithBpi = filteredLatest.filter(
        (s) => s.bpi !== null && s.bpi !== undefined,
      );
      const toSongSummary = (s: (typeof playedWithBpi)[number]) => ({
        title: s.title,
        difficulty: s.difficulty,
        exScore: s.exScore,
        bpi: s.bpi,
      });
      const strongSongs = [...playedWithBpi]
        .sort((a, b) => (b.bpi ?? -15) - (a.bpi ?? -15))
        .slice(0, topSongsLimit)
        .map(toSongSummary);
      const weakSongs = [...playedWithBpi]
        .sort((a, b) => (a.bpi ?? -15) - (b.bpi ?? -15))
        .slice(0, topSongsLimit)
        .map(toSongSummary);

      const closeRivalSongs = closeRivalRows
        .map((r) => ({ ...r, absDiff: Math.abs(r.exDiff) }))
        .sort((a, b) => a.absDiff - b.absDiff)
        .slice(0, topSongsLimit)
        .map((r) => ({
          title: r.title,
          difficulty: r.difficulty,
          myExScore: r.exScore,
          rivalExScore: r.rivalEx,
          rivalUserName: r.rivalName,
          diff: r.exDiff,
        }));

      return {
        content: [
          {
            type: "text",
            text:
              `総合BPI: ${totalBpi}（推定順位: ${estimatedRank ?? "圏外"}、プレイ済み${canonicalLatest.length}/${canonicalCount}曲）。` +
              `絞り込み対象(level=${levels.join(",")}${difficulties.length ? `, difficulty=${difficulties.join(",")}` : ""})の` +
              `得意曲/苦手曲/ライバル僅差曲、および直近${totalBpiHistory.length}日分のBPI推移を返却しました。`,
          },
          {
            type: "text",
            text: JSON.stringify({
              totalBpi,
              estimatedRank,
              playedCount: canonicalLatest.length,
              totalCount: canonicalCount,
              filter: { levels, difficulties },
              filteredPlayedCount: filteredLatest.length,
              filteredTotalCount: filteredCount,
              totalBpiHistory,
              dailyBpi,
              strongSongs,
              weakSongs,
              closeRivalSongs,
            }),
          },
        ],
      };
    },
  );
}
