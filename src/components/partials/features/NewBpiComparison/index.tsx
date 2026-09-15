import { useMemo, useState } from "react";
import type { SongWithScore } from "@/types/songs/score";
import { useUserScores } from "@/hooks/table/useUserScores";
import { useUserSongRankings } from "@/hooks/stats/useUserSongRankings";
import { useSongList } from "@/hooks/songs/useSongList";
import { useProfile } from "@/hooks/users/useProfile";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { BpiV1 } from "@bpim/bpicalc";
import { BpiCalculator } from "@/lib/bpi";
import { ALL_CATEGORIES } from "@/lib/radar/calculator";
import {
  topElementMap,
  topElementsByCategory,
} from "@/constants/iidx/radars/topElements";
import { newBpiSongParamMap } from "@/constants/iidx/newBpi/songParams";
import NewBpiComparisonUi, { NewBpiRow, SortKey } from "./ui";
import type { CurvePoint } from "./CurveChart";
import type { FormulaSongInfo } from "./FormulaCard";
import type { ScoreSimulatorSongInfo } from "./ScoreSimulatorCard";
import type { ScoreRateRow } from "./ScoreRateTable";
import type { SongParamsInfo } from "./SongParamsPanel";

interface Props {
  userId: string;
}

// このページは「V1(旧) vs V2(現行)」の比較専用ツールで、V1側は本番実装
// (BpiCalculator、現在はV2)ではなくレガシーのV1公式を直接使う。V2側は
// 本番と同じBpiCalculator(songDefのmu/sigmaをDBから読む)を使い、本番の
// 総合BPIと値がずれないようにする。
const legacyV1 = new BpiV1();

/** 推移グラフのX軸(BPI)の目盛り。10刻み＋現行の床(-15)。 */
const BPI_TICKS = [-15, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/** `coef` 未設定時に本番実装(`BpiCalculator`)が使うデフォルト値。式表示用。 */
const DEFAULT_POW_COEF = 1.175;

/** "150" → [150,150]、"75-300" → [75,300]。パースできなければ null。 */
function parseBpmRange(bpm: string | null): [number, number] | null {
  if (!bpm) return null;
  const nums = bpm
    .split("-")
    .map((p) => Number(p.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return null;
  return [Math.min(...nums), Math.max(...nums)];
}

/** スコアレート内訳テーブルの行(BPI0相当より上): 90〜94%は1%刻み、95%以降は0.5%刻み。 */
const SCORE_RATE_STEPS: number[] = (() => {
  const steps: number[] = [];
  for (let p = 90; p < 95; p++) steps.push(p);
  for (let p = 95; p <= 100; p += 0.5) steps.push(Math.round(p * 10) / 10);
  return steps;
})();

/**
 * 分布ベースの新方式BPIの検証用: 自分のスコアで現行BPIと新方式BPIを
 * 楽曲ごとに見比べるための集計ロジック。
 *
 * 新方式(V2)のパラメータ(mu/sigma)は本番と同じ `songDef` (DB)から読む
 * （`BpiCalculator` 経由）。
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

  // 「一覧」タブの行アコーディオン。同じ行を再クリックで閉じる（1行ずつ）。
  const handleToggleSong = (songId: number) => {
    setSelectedSongId((prev) => (prev === songId ? null : songId));
  };

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
  // 「全プレイヤー」タブでユーザー名をクリックしたときに、そのユーザーを
  // 「一覧」タブで表示する(検索欄からの検索と同じ仕組みに乗せる)。
  const handleSelectUser = (targetUserId: string) => {
    setViewedUserId(targetUserId);
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
  // 総合BPI(issue #304, 未プレイ曲をa_iからの予測で埋める方式)には
  // 未プレイ曲を含む☆12全曲の一覧が要る。useUserScores(/scores)はプレイ済み
  // 楽曲しか返さないため、曲マスタ自体は別途取得する(閲覧対象ユーザーに
  // 依存しない共通データのため、viewedUserIdとは無関係に取得してよい)。
  const { songs: songMaster } = useSongList(latestVersion);
  // 「実際の順位(BPIM内)」列用。曲ごとの本人順位 (songRankingCache)。
  const { data: songRankings } = useUserSongRankings(
    latestVersion,
    accessState === "ok" ? viewedUserId : undefined,
  );

  const {
    rows,
    currentTotalBpi,
    newTotalBpi,
    comparableCount,
    playedSongMap,
  } = useMemo(() => {
    if (!songs)
      return {
        rows: [],
        currentTotalBpi: null,
        newTotalBpi: null,
        comparableCount: 0,
        playedSongMap: new Map<number, SongWithScore>(),
      };

    const played = songs.filter(
      (s): s is typeof s & { exScore: number } => s.exScore !== null,
    );
    const playedSongMap = new Map(played.map((s) => [s.songId, s]));

    const actualRankBySong = new Map(
      (songRankings?.songs ?? []).map((r) => [
        r.songId,
        { rank: r.rank, totalPlayers: r.totalPlayers },
      ]),
    );

    const rows: NewBpiRow[] = played.map((s) => {
      // s.bpi(DBの保存値)は本番がV2へ全面切り替え済みのため、もはやV1では
      // ない。この比較ページの「現行(V1)」列は本番の現在値ではなく、常に
      // legacyV1で計算し直した真のV1値にする(V2は本番と同じBpiCalculator)。
      const currentBpi = legacyV1
        .chart({ notes: s.notes, kaidenAvg: s.kaidenAvg, wrScore: s.wrScore, coef: s.coef })
        .bpi(s.exScore);
      const newBpi = BpiCalculator.calc(s.exScore, s);
      const actual = actualRankBySong.get(s.songId) ?? null;
      const bpmRange = parseBpmRange(s.bpm);
      return {
        songId: s.songId,
        title: s.title,
        difficulty: s.difficulty,
        difficultyLevel: s.difficultyLevel,
        exScore: s.exScore,
        currentBpi,
        newBpi,
        delta: currentBpi !== null && newBpi !== null ? newBpi - currentBpi : null,
        estimatedRank:
          newBpi !== null ? BpiCalculator.estimateRankFromBpi(newBpi) : null,
        actualRank: actual?.rank ?? null,
        actualTotalPlayers: actual?.totalPlayers ?? null,
        radarTop: topElementMap.get(`${s.title}___${s.difficulty}`) ?? null,
        bpm: s.bpm,
        bpmLo: bpmRange?.[0] ?? null,
        bpmHi: bpmRange?.[1] ?? null,
      };
    });

    // 総合BPIは☆12のみを対象にする。V1/V2どちらも同じ☆12スコープに揃える。
    const level12Played = played.filter((s) => s.difficultyLevel === 12);
    const allLevel12Songs = songMaster.filter((s) => s.difficultyLevel === 12);

    // 「V1 総合BPI」は/stats/totalBpi(本番、今はV2)の現在値ではなく、
    // 常にlegacyV1で計算し直す(単曲BPIの列と同じ理由)。V1は未プレイ曲を
    // 一律-15固定で扱うべき乗平均のため、対象曲数はallLevel12Songs.length
    // (V2側の分母と揃える)を渡す。
    const currentBpisLevel12Desc = level12Played
      .map((s) =>
        legacyV1
          .chart({ notes: s.notes, kaidenAvg: s.kaidenAvg, wrScore: s.wrScore, coef: s.coef })
          .bpi(s.exScore),
      )
      .filter((b): b is number => b !== null)
      .sort((a, b) => b - a);
    const currentTotalBpi =
      allLevel12Songs.length > 0
        ? legacyV1.total(currentBpisLevel12Desc, allLevel12Songs.length)
        : null;

    // 「V2 総合BPI」は本番(/stats/totalBpi)と同じBpiCalculatorで計算する
    // （songDefのmu/sigmaをDBから読む。ラチェットは表示上の「記録」を保つ
    // ためのDB書き込み境界の責務なので、ここでは適用しない生値を出す）。
    // プレイ済み曲は単曲BPIをそのまま使い、未プレイ曲は潜在スキルa_iから
    // の予測で埋める。未プレイ曲の判定・予測には☆12全曲のマスタ
    // (songMaster、mu/sigma込み)が要る。
    const comparableCount = level12Played.filter(
      (s) => s.mu !== null && s.mu !== undefined && s.sigma !== null && s.sigma !== undefined,
    ).length;
    const newTotalBpi =
      allLevel12Songs.length > 0
        ? BpiCalculator.calculateTotalBPI(
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
      currentTotalBpi,
      newTotalBpi,
      comparableCount,
      playedSongMap,
    };
  }, [songs, songMaster, songRankings]);

  // 既存のノーツレーダー(カテゴリ別総合BPI)と同じカテゴリ分け(topElements.json)
  // を使い、現行/新方式それぞれのカテゴリ別総合BPIを算出する。現行側は既存の
  // calculateRadar をそのまま使い、カテゴリごとの played/unplayed 内訳
  // (RadarResponse.songs)を新方式側の計算にも流用することで、両者の対象曲・
  // 分母を完全に一致させる。
  const radarComparison = useMemo(() => {
    if (!songs) return null;
    const played = songs.filter(
      (s): s is typeof s & { exScore: number } => s.exScore !== null,
    );
    if (played.length === 0) return null;

    const current: Record<string, number> = {};
    const next: Record<string, number> = {};
    for (const category of ALL_CATEGORIES) {
      const categorySongs = played.filter(
        (s) => topElementMap.get(`${s.title}___${s.difficulty}`) === category,
      );
      // プレイ済み以外(未プレイ)の分母は topElements.json のカテゴリ定義曲数から補う
      const totalCount =
        topElementsByCategory.get(category)?.length ?? categorySongs.length;

      const currentBpis = categorySongs
        .map((s) =>
          legacyV1
            .chart({
              notes: s.notes,
              kaidenAvg: s.kaidenAvg,
              wrScore: s.wrScore,
              coef: s.coef,
            })
            .bpi(s.exScore),
        )
        .filter((b): b is number => b !== null)
        .sort((a, b) => b - a);
      current[category] =
        currentBpis.length > 0 ? legacyV1.total(currentBpis, totalCount) : -15;

      const newBpis = categorySongs
        .map((s) => BpiCalculator.calc(s.exScore, s))
        .filter((b): b is number => b !== null)
        .sort((a, b) => b - a);
      next[category] =
        newBpis.length > 0 ? legacyV1.total(newBpis, totalCount) : -15;
    }
    return { current, next };
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
      current: legacyV1.chart(basic).scoreFor(bpi, false),
      new: BpiCalculator.calcFromBPI(bpi, song),
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
      current: legacyV1.chart(basic).bpi(exScore),
      new: BpiCalculator.calc(exScore, song),
    }));
  }, [effectiveSongId, playedSongMap]);

  const selectedSong = effectiveSongId
    ? playedSongMap.get(effectiveSongId)
    : undefined;

  const selectedSongNewParams = selectedSong
    ? BpiCalculator.getSongParams(selectedSong)
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
        k: selectedSongNewParams?.k ?? null,
      }
    : null;

  // 「一覧」タブのアコーディオン用。楽曲固有の数値を一箇所に集約する。
  const selectedSongParams: SongParamsInfo | null = selectedSong
    ? {
        coef:
          selectedSong.coef && selectedSong.coef > 0
            ? selectedSong.coef
            : DEFAULT_POW_COEF,
        m: selectedSong.notes * 2,
        kaidenAvg: selectedSong.kaidenAvg,
        wrScore: selectedSong.wrScore,
        mu: selectedSongNewParams?.mu ?? null,
        sigma: selectedSongNewParams?.sigma ?? null,
        n: newBpiSongParamMap.get(selectedSong.songId)?.n ?? null,
        z100: selectedSongNewParams?.z100 ?? null,
        k: selectedSongNewParams?.k ?? null,
        z0: selectedSongNewParams?.z0 ?? null,
      }
    : null;

  const selectedSongSimulator: ScoreSimulatorSongInfo | null = selectedSong
    ? {
        notes: selectedSong.notes,
        kaidenAvg: selectedSong.kaidenAvg,
        wrScore: selectedSong.wrScore,
        coef: selectedSong.coef ?? null,
        mu: selectedSong.mu ?? null,
        sigma: selectedSong.sigma ?? null,
        residualVar: selectedSong.residualVar ?? null,
        hasNewParams: selectedSongNewParams !== null,
      }
    : null;

  return (
    <NewBpiComparisonUi
      searchInput={searchInput}
      onSearchInputChange={setSearchInput}
      onSearch={handleSearch}
      onReset={handleReset}
      onSelectUser={handleSelectUser}
      isViewingSelf={isViewingSelf}
      viewedUserName={profile?.userName ?? null}
      accessState={accessState}
      isDataLoading={isSongsLoading}
      scoreRateMaxScore={selectedSong ? selectedSong.notes * 2 : null}
      rows={rows}
      sortKey={sortKey}
      onSortKeyChange={setSortKey}
      radarCurrent={radarComparison?.current ?? null}
      radarNew={radarComparison?.next ?? null}
      currentTotalBpi={currentTotalBpi}
      newTotalBpi={newTotalBpi}
      comparableCount={comparableCount}
      curveEligibleRows={curveEligibleRows}
      selectedSongId={effectiveSongId}
      onSelectedSongIdChange={setSelectedSongId}
      listExpandedSongId={selectedSongId}
      onToggleListSong={handleToggleSong}
      selectedSongParams={selectedSongParams}
      curveData={curveData}
      scoreRateRows={scoreRateRows}
      selectedSongUserPoint={
        selectedSong && selectedSong.exScore !== null
          ? {
              exScore: selectedSong.exScore,
              currentBpi: legacyV1
                .chart({
                  notes: selectedSong.notes,
                  kaidenAvg: selectedSong.kaidenAvg,
                  wrScore: selectedSong.wrScore,
                  coef: selectedSong.coef,
                })
                .bpi(selectedSong.exScore),
              newBpi: BpiCalculator.calc(
                selectedSong.exScore,
                selectedSong,
              ),
            }
          : null
      }
      selectedSongFormula={selectedSongFormula}
      selectedSongSimulator={selectedSongSimulator}
      selectedSongInitialScore={selectedSong?.exScore ?? 0}
    />
  );
}
