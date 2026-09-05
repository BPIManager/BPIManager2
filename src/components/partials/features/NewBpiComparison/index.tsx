import { useMemo, useState } from "react";
import type { SongWithScore } from "@/types/songs/score";
import { useUserScores } from "@/hooks/table/useUserScores";
import { useTotalBpiStats } from "@/hooks/stats/useCurrentTotalBpi";
import { useSongList } from "@/hooks/songs/useSongList";
import { useProfile } from "@/hooks/users/useProfile";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { BpiCalculator } from "@/lib/bpi";
import { NewBpiCalculator } from "@/lib/bpi/newBpi";
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

  // 他ユーザーのデータをユーザーIDで検索して閲覧する機能。アクセス可否の
  // 判定自体はAPI側(checkUserAccess: 公開プロフィール or 承認済みフォロー)
  // に委ね、ここでは検索状態と結果表示のみを担う。
  const [searchInput, setSearchInput] = useState("");
  const [viewedUserId, setViewedUserId] = useState(userId);
  const isViewingSelf = viewedUserId === userId;

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setViewedUserId(trimmed);
    setSelectedSongId(null);
  };
  const handleReset = () => {
    setViewedUserId(userId);
    setSearchInput("");
    setSelectedSongId(null);
  };

  const {
    profile,
    isLoading: isProfileLoading,
    isPrivate,
    isNotFound,
  } = useProfile(viewedUserId);

  const accessState: "loading" | "not-found" | "private" | "ok" =
    isProfileLoading
      ? "loading"
      : isNotFound
        ? "not-found"
        : isPrivate
          ? "private"
          : "ok";

  const { songs, isLoading: isSongsLoading } = useUserScores(
    accessState === "ok" ? viewedUserId : undefined,
    latestVersion,
  );
  const { stats, isLoading: isStatsLoading } = useTotalBpiStats(
    accessState === "ok" ? viewedUserId : undefined,
    latestVersion,
  );
  // 総合BPI(issue #304, 未プレイ曲をa_iからの予測で埋める方式)には
  // 未プレイ曲を含む☆12全曲の一覧が要る。useUserScores(/scores)はプレイ済み
  // 楽曲しか返さないため、曲マスタ自体は別途取得する(閲覧対象ユーザーに
  // 依存しない共通データのため、viewedUserIdとは無関係に取得してよい)。
  const { songs: songMaster } = useSongList(latestVersion);

  const {
    rows,
    hybridTotalBpi,
    newTotalBpi,
    comparableCount,
    playedSongMap,
  } = useMemo(() => {
    const totalCount12 = stats?.totalCount;

    if (!songs)
      return {
        rows: [],
        hybridTotalBpi: null,
        newTotalBpi: null,
        comparableCount: 0,
        playedSongMap: new Map<number, SongWithScore>(),
      };

    // useUserScores(/scores API)はプレイ済み楽曲のみをscores経由のINNER JOINで
    // 返す(未プレイ楽曲は含まれない)ため、`songs.length`は総曲数ではなく
    // 比較可能数(プレイ済み数)にしかならない。総合BPIの分母には
    // /stats/totalBpi と同じ「☆12の現行選曲数」(stats.totalCount、
    // 未プレイ楽曲を含む)を使う必要がある(揃えないと未プレイ楽曲の
    // 床(-15)埋めが効かず、総合BPIが本来より高く出てしまう)。

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
    const totalSongCount12 = totalCount12 ?? level12Played.length;

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

    // (C) 単曲BPI・総合BPIの導出方法の両方を新方式に置き換える。issue #304:
    // プレイ済み曲は単曲BPIをそのまま使い、未プレイ曲は潜在スキルa_iからの
    // 予測で埋めたうえで現行と同じべき乗平均にかける（詳細はNewBpiCalculator
    // 参照）。未プレイ曲の判定・予測には☆12全曲のマスタ(songMaster)が要る。
    const comparableCount = level12Played.filter((s) =>
      NewBpiCalculator.hasParams(s.songId),
    ).length;
    const allLevel12Songs = songMaster.filter((s) => s.difficultyLevel === 12);
    const newTotalBpi =
      allLevel12Songs.length > 0
        ? NewBpiCalculator.calculateTotalBPI(
            level12Played.map((s) => ({
              songId: s.songId,
              notes: s.notes,
              exScore: s.exScore,
            })),
            allLevel12Songs,
          )
        : null;

    return {
      rows,
      hybridTotalBpi,
      newTotalBpi,
      comparableCount,
      playedSongMap,
    };
  }, [songs, stats?.totalCount, songMaster]);

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
        gamma: selectedSongNewParams?.gamma ?? null,
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

  return (
    <NewBpiComparisonUi
      searchInput={searchInput}
      onSearchInputChange={setSearchInput}
      onSearch={handleSearch}
      onReset={handleReset}
      isViewingSelf={isViewingSelf}
      viewedUserName={profile?.userName ?? null}
      accessState={accessState}
      isDataLoading={isSongsLoading || isStatsLoading}
      scoreRateMaxScore={selectedSong ? selectedSong.notes * 2 : null}
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
