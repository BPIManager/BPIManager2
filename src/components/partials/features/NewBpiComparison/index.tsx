import { useMemo, useState } from "react";
import type { SongWithScore } from "@/types/songs/score";
import { useUserScores } from "@/hooks/table/useUserScores";
import { useTotalBpiStats } from "@/hooks/stats/useCurrentTotalBpi";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import {
  newBpiSongParamMap,
  NEW_BPI_Z0,
  NEW_BPI_Z100,
} from "@/constants/iidx/newBpi/songParams";
import { BpiCalculator } from "@/lib/bpi";
import { NewBpiCalculator } from "@/lib/bpi/newBpi";
import { PageLoader } from "@/components/ui/loading-spinner";
import NewBpiComparisonUi, { NewBpiRow, SortKey } from "./ui";
import type { CurvePoint } from "./CurveChart";
import type { FormulaSongInfo } from "./FormulaCard";
import type { ScoreSimulatorSongInfo } from "./ScoreSimulatorCard";
import type { ScoreRateRow } from "./ScoreRateTable";

interface Props {
  userId: string;
}

/** 推移グラフのX軸(BPI)の目盛り。10刻み＋現行の床(-15)。 */
const BPI_TICKS = [-15, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/** `coef` 未設定時に本番実装(`BpiCalculator`)が使うデフォルト値。式表示用。 */
const DEFAULT_POW_COEF = 1.175;

/** スコアレート内訳テーブルの行(BPI0相当より上): 90〜94%は1%刻み、95%以降は0.5%刻み。 */
const SCORE_RATE_STEPS: number[] = (() => {
  const steps: number[] = [];
  for (let p = 90; p < 95; p++) steps.push(p);
  for (let p = 95; p <= 100; p += 0.5) steps.push(Math.round(p * 10) / 10);
  return steps;
})();

/**
 * issue #299〜304 検証用: 自分のスコアで現行BPIと新方式BPI(分布ベース)を
 * 楽曲ごとに見比べるための集計ロジック。
 *
 * 新方式のパラメータ(mu/sigma)は `songDef` に持たせず `songParams.json`
 * （DBに追加しない）から読む。
 */
export default function NewBpiComparison({ userId }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("deltaDesc");
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const { songs, isLoading: isSongsLoading } = useUserScores(
    userId,
    latestVersion,
  );
  const { stats, isLoading: isStatsLoading } = useTotalBpiStats(
    userId,
    latestVersion,
  );

  const {
    rows,
    hybridTotalBpi,
    newTotalBpi,
    comparableCount,
    playedSongMap,
  } = useMemo(() => {
    if (!songs)
      return {
        rows: [],
        hybridTotalBpi: null,
        newTotalBpi: null,
        comparableCount: 0,
        playedSongMap: new Map<number, SongWithScore>(),
      };

    const played = songs.filter(
      (s): s is typeof s & { exScore: number } => s.exScore !== null,
    );
    const playedSongMap = new Map(played.map((s) => [s.songId, s]));

    const rows: NewBpiRow[] = played.map((s) => {
      const newBpi = NewBpiCalculator.calc(s.exScore, {
        songId: s.songId,
        notes: s.notes,
        kaidenAvg: s.kaidenAvg,
        wrScore: s.wrScore,
      });
      return {
        songId: s.songId,
        title: s.title,
        difficulty: s.difficulty,
        difficultyLevel: s.difficultyLevel,
        exScore: s.exScore,
        currentBpi: s.bpi,
        newBpi,
        delta: s.bpi !== null && newBpi !== null ? newBpi - s.bpi : null,
      };
    });

    // 総合BPI(現行の /stats/totalBpi)は☆12のみを対象にしているため、
    // 比較用の2種の総合BPIも同じ☆12スコープに揃える。
    const level12Played = played.filter((s) => s.difficultyLevel === 12);
    const totalSongCount12 = songs.filter(
      (s) => s.difficultyLevel === 12,
    ).length;

    // (B) 単曲BPIだけ新方式に置き換え、総合BPIの集計方法(べき乗平均)は
    // 現行のまま。issue #299〜303単独の影響を見るためのケース。
    const newBpisLevel12Desc = level12Played
      .map((s) =>
        NewBpiCalculator.calc(s.exScore, {
          songId: s.songId,
          notes: s.notes,
          kaidenAvg: s.kaidenAvg,
          wrScore: s.wrScore,
        }),
      )
      .filter((b): b is number => b !== null)
      .sort((a, b) => b - a);
    const hybridTotalBpi =
      totalSongCount12 > 0
        ? BpiCalculator.calculateTotalBPI(newBpisLevel12Desc, totalSongCount12)
        : null;

    // (C) 単曲BPI・総合BPIの導出方法の両方を新方式に置き換える。issue #304の
    // 潜在スキル a_i を「パラメータのある☆12楽曲かつプレイ済み」の範囲で
    // この場で直接推定する。
    let num = 0;
    let den = 0;
    let comparableCount = 0;
    for (const s of level12Played) {
      const param = newBpiSongParamMap.get(s.songId);
      if (!param) continue;
      const m = s.notes * 2;
      const miss = Math.max(0.5, m - Math.min(s.exScore, m));
      const t = -Math.log(miss);
      num += param.sigma * (t - param.mu);
      den += param.sigma * param.sigma;
      comparableCount++;
    }
    const a = den > 0 ? num / den : null;
    const newTotalBpi =
      a !== null
        ? Math.round(
            100 * ((a - NEW_BPI_Z0) / (NEW_BPI_Z100 - NEW_BPI_Z0)) * 100,
          ) / 100
        : null;

    return {
      rows,
      hybridTotalBpi,
      newTotalBpi,
      comparableCount,
      playedSongMap,
    };
  }, [songs]);

  // 推移グラフで選べるのは新方式パラメータのある楽曲のみ(新方式の曲線が描けないため)
  const curveEligibleRows = useMemo(
    () => rows.filter((r) => r.newBpi !== null),
    [rows],
  );

  // 未選択(初回表示)時は候補の先頭曲を暫定表示する。setStateで同期せず
  // render中に導出するだけに留め、effectでの状態同期は行わない。
  const effectiveSongId = selectedSongId ?? curveEligibleRows[0]?.songId ?? null;

  const curveData: CurvePoint[] | null = useMemo(() => {
    if (effectiveSongId === null) return null;
    const song = playedSongMap.get(effectiveSongId);
    if (!song) return null;

    const basic = {
      notes: song.notes,
      kaidenAvg: song.kaidenAvg,
      wrScore: song.wrScore,
      coef: song.coef,
    };
    return BPI_TICKS.map((bpi) => ({
      bpi,
      current: BpiCalculator.calcFromBPI(bpi, basic, false),
      new: NewBpiCalculator.calcFromBPI(bpi, {
        songId: song.songId,
        notes: song.notes,
        kaidenAvg: song.kaidenAvg,
        wrScore: song.wrScore,
      }),
    }));
  }, [effectiveSongId, playedSongMap]);

  // スコアレート内訳テーブル: 下限をBPI0相当(=皆伝平均のスコアレート)とし、
  // そこから90%,91%,...,94%,95%,95.5%,...100%の行を作る
  const scoreRateRows: ScoreRateRow[] | null = useMemo(() => {
    if (effectiveSongId === null) return null;
    const song = playedSongMap.get(effectiveSongId);
    if (!song || song.kaidenAvg === null) return null;

    const m = song.notes * 2;
    const basic = {
      notes: song.notes,
      kaidenAvg: song.kaidenAvg,
      wrScore: song.wrScore,
      coef: song.coef,
    };
    const bpi0Rate = (song.kaidenAvg / m) * 100;

    const entries: { rate: number; exScore: number; isBpi0Anchor: boolean }[] = [
      { rate: bpi0Rate, exScore: song.kaidenAvg, isBpi0Anchor: true },
      ...SCORE_RATE_STEPS.filter((rate) => rate > bpi0Rate).map((rate) => ({
        rate,
        exScore: Math.round((rate / 100) * m),
        isBpi0Anchor: false,
      })),
    ];

    return entries.map(({ rate, exScore, isBpi0Anchor }) => ({
      rate,
      isBpi0Anchor,
      exScore,
      current: BpiCalculator.calc(exScore, basic),
      new: NewBpiCalculator.calc(exScore, {
        songId: song.songId,
        notes: song.notes,
        kaidenAvg: song.kaidenAvg,
        wrScore: song.wrScore,
      }),
    }));
  }, [effectiveSongId, playedSongMap]);

  const selectedSong = effectiveSongId
    ? playedSongMap.get(effectiveSongId)
    : undefined;

  const selectedSongNewParams = selectedSong
    ? NewBpiCalculator.getSongParams({
        songId: selectedSong.songId,
        notes: selectedSong.notes,
        kaidenAvg: selectedSong.kaidenAvg,
        wrScore: selectedSong.wrScore,
      })
    : null;

  const selectedSongFormula: FormulaSongInfo | null = selectedSong
    ? {
        m: selectedSong.notes * 2,
        kaidenAvg: selectedSong.kaidenAvg,
        wrScore: selectedSong.wrScore,
        coef:
          selectedSong.coef && selectedSong.coef > 0
            ? selectedSong.coef
            : DEFAULT_POW_COEF,
        mu: selectedSongNewParams?.mu ?? null,
        sigma: selectedSongNewParams?.sigma ?? null,
        z0: selectedSongNewParams?.z0 ?? null,
        z100: selectedSongNewParams?.z100 ?? null,
      }
    : null;

  const selectedSongSimulator: ScoreSimulatorSongInfo | null = selectedSong
    ? {
        songId: selectedSong.songId,
        notes: selectedSong.notes,
        kaidenAvg: selectedSong.kaidenAvg,
        wrScore: selectedSong.wrScore,
        coef: selectedSong.coef ?? null,
        hasNewParams: selectedSongNewParams !== null,
      }
    : null;

  if (isSongsLoading || isStatsLoading) {
    return <PageLoader />;
  }

  return (
    <NewBpiComparisonUi
      rows={rows}
      sortKey={sortKey}
      onSortKeyChange={setSortKey}
      currentTotalBpi={stats?.totalBpi ?? null}
      hybridTotalBpi={hybridTotalBpi}
      newTotalBpi={newTotalBpi}
      comparableCount={comparableCount}
      curveEligibleRows={curveEligibleRows}
      selectedSongId={effectiveSongId}
      onSelectedSongIdChange={setSelectedSongId}
      curveData={curveData}
      scoreRateRows={scoreRateRows}
      selectedSongUserPoint={
        selectedSong && selectedSong.exScore !== null
          ? {
              exScore: selectedSong.exScore,
              currentBpi: selectedSong.bpi,
              newBpi: NewBpiCalculator.calc(selectedSong.exScore, {
                songId: selectedSong.songId,
                notes: selectedSong.notes,
                kaidenAvg: selectedSong.kaidenAvg,
                wrScore: selectedSong.wrScore,
              }),
            }
          : null
      }
      selectedSongFormula={selectedSongFormula}
      selectedSongSimulator={selectedSongSimulator}
      selectedSongInitialScore={selectedSong?.exScore ?? 0}
    />
  );
}
