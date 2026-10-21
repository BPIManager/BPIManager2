import { BpiCalculator } from "@/lib/bpi";
import type { SongDetailSubject } from "@/utils/songs/songDetailMode";
import { hasBpiData } from "@/utils/songs/songDetailMode";
import type { SongRankingEntry } from "@/types/users/ranking";
import type { SongCompareTarget } from "@/types/songs/compareTarget";

type RivalRow = {
  userId: string;
  isSelf?: boolean;
  exScore: number | null;
  bpi?: number | null;
  userName?: string;
  profileImage?: string | null;
  isVirtual?: boolean;
  tag?: { label: string; color: string };
};

export const calcBpiFor = (
  song: SongDetailSubject | undefined,
  exScore: number,
) => (song && hasBpiData(song) ? BpiCalculator.calc(exScore, song) : null);

/** 全体ランキングに比較対象を差し込む。ユーザー対象は既存行にラベルを付け、それ以外はスコア順の位置へ順位なしで挿入する */
export const withCompareTargets = (
  rankings: SongRankingEntry[],
  targets: SongCompareTarget[],
  song: SongDetailSubject | undefined,
): SongRankingEntry[] => {
  const result = rankings.map((r) => {
    const tg = targets.find((t) => t.userId === r.userId && t.exScore != null);
    return tg ? { ...r, tag: { label: tg.label, color: tg.color } } : r;
  });
  targets.forEach((tg, i) => {
    if (tg.userId || tg.exScore == null) return;
    const at = result.findIndex((r) => (r.exScore ?? 0) < tg.exScore!);
    result.splice(at < 0 ? result.length : at, 0, {
      rank: 0,
      userId: `target-${i}`,
      userName: tg.name ?? tg.label,
      profileImage: null,
      exScore: tg.exScore,
      bpi: calcBpiFor(song, tg.exScore),
      isSelf: false,
      isVirtual: true,
      tag: { label: tg.label, color: tg.color },
    });
  });
  return result;
};

interface BuildRivalRankingsParams {
  rivals: RivalRow[] | undefined;
  myScore: SongDetailSubject | undefined;
  self: { uid?: string; userName?: string; profileImage?: string | null };
  song: SongDetailSubject | undefined;
  compareTargets: SongCompareTarget[];
}

/** ライバル一覧に自分と比較対象を加え、スコア降順で順位付けする */
export const buildRivalRankings = ({
  rivals,
  myScore,
  self,
  song,
  compareTargets,
}: BuildRivalRankingsParams): SongRankingEntry[] => {
  // 未プレイの曲では自分の行を出さない（0点の行がライバル内順位に混ざるため）
  const selfRow: RivalRow | null = myScore?.exScore
    ? {
        ...myScore,
        userId: self.uid ?? "",
        userName: self.userName,
        profileImage: self.profileImage,
        isSelf: true,
      }
    : null;

  const rows: RivalRow[] = rivals ? [...rivals] : [];
  if (selfRow && !rows.some((r) => r.userId === self.uid)) rows.push(selfRow);

  const tags = new Map<string, { label: string; color: string }>();
  compareTargets.forEach((tg, i) => {
    if (tg.exScore == null) return;
    const tag = { label: tg.label, color: tg.color };
    if (tg.userId) {
      tags.set(tg.userId, tag);
      return;
    }
    rows.push({
      userId: `target-${i}`,
      userName: tg.name ?? tg.label,
      exScore: tg.exScore,
      bpi: calcBpiFor(song, tg.exScore),
      isVirtual: true,
      tag,
    });
  });

  return rows
    .sort((a, b) => (b.exScore || 0) - (a.exScore || 0))
    .map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      userName: row.userName ?? "",
      profileImage: row.profileImage ?? null,
      exScore: row.exScore,
      bpi: row.bpi ?? null,
      isSelf: !!row.isSelf || row.userId === self.uid,
      isVirtual: row.isVirtual,
      tag: row.tag ?? tags.get(row.userId),
    }));
};
