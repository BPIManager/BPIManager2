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
): { topBpiSongs: TopSong[]; topImprovedSongs: TopSongImproved[] } {
  const topBpiSongs: TopSong[] = [];
  const topImprovedSongs: TopSongImproved[] = [];

  for (const s of latestInMonth) {
    const bpi = s.bpi != null ? Number(s.bpi) : null;
    if (bpi == null) continue;
    topBpiSongs.push({
      songId: s.songId,
      title: s.title,
      difficulty: s.difficulty as string,
      difficultyLevel: s.difficultyLevel,
      bpi,
      exScore: s.exScore,
      notes: s.notes,
      rank: 0,
    });
    const pre = preScoreMap.get(s.songId);
    if (pre != null) {
      const bpiBefore = pre.bpi ?? -15;
      topImprovedSongs.push({
        songId: s.songId,
        title: s.title,
        difficulty: s.difficulty as string,
        difficultyLevel: s.difficultyLevel,
        bpi,
        exScore: s.exScore,
        notes: s.notes,
        rank: 0,
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
