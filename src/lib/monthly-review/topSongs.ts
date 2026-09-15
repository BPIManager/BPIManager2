import { BpiCalculator } from "@/lib/bpi";
import type { TopSong, TopSongImproved } from "@/types/stats/monthlyReview";

type ScoreRow = {
  songId: number;
  title: string;
  difficulty: unknown;
  difficultyLevel: number;
  bpi: unknown;
  exScore: number;
  notes: number;
  logId: number;
};

export function buildTopSongs(
  latestInMonth: ScoreRow[],
  preScoreMap: Map<number, { exScore: number; bpi: number | null }>,
  /** trueの場合、比較元のexScoreが0（実質新規プレイ）の曲を「最も伸びた曲」から除外する */
  excludeNewPlays = false,
): { topBpiSongs: TopSong[]; topImprovedSongs: TopSongImproved[] } {
  const topBpiSongs: TopSong[] = [];
  const topImprovedSongs: TopSongImproved[] = [];

  for (const s of latestInMonth) {
    const bpi = s.bpi != null ? Number(s.bpi) : null;
    if (bpi == null) continue;
    // 全ユーザー横断の厳密な順位はDB側でRANK() OVERを使う必要があり非常に重い
    // （実測: 対象曲が多い期間で数秒〜数十秒）。表示用の目安に過ぎず正確性は
    // 求められないため、bpicalcの単曲BPI→順位推定関数（統計的な近似値）を使う
    const rank = BpiCalculator.estimateRankFromBpi(bpi);
    topBpiSongs.push({
      songId: s.songId,
      title: s.title,
      difficulty: s.difficulty as string,
      difficultyLevel: s.difficultyLevel,
      bpi,
      exScore: s.exScore,
      notes: s.notes,
      rank,
    });
    const pre = preScoreMap.get(s.songId);
    if (pre != null && !(excludeNewPlays && pre.exScore === 0)) {
      const bpiBefore = pre.bpi ?? -15;
      topImprovedSongs.push({
        songId: s.songId,
        title: s.title,
        difficulty: s.difficulty as string,
        difficultyLevel: s.difficultyLevel,
        bpi,
        exScore: s.exScore,
        notes: s.notes,
        rank,
        bpiBefore,
        bpiAfter: bpi,
        diff: bpi - bpiBefore,
      });
    }
  }

  topBpiSongs.sort((a, b) => b.bpi - a.bpi);
  topImprovedSongs.sort((a, b) => b.diff - a.diff);

  return { topBpiSongs, topImprovedSongs };
}
