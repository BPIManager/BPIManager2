import type { useTranslation } from "@/hooks/common/useTranslation";
import type { BpiHistoryItem } from "@/types/stats/bpiHistory";
import { MAX_HISTORY_STEPS, type ChartPoint, type HistoryStep } from "./types";

type TFormat = ReturnType<typeof useTranslation>["tFormat"];

/** BPI推移チャート用の系列・目盛り・初期表示位置・最新の未ラチェット差を組み立てる。 */
export function buildChartSeries(data: BpiHistoryItem[] | undefined) {
  if (!data || data.length === 0)
    return { chartData: [], ticks: [], startIndex: 0, latestGap: null };

  const merged: ChartPoint[] = data.map((d, i) => ({
    date: d.date,
    raw: d.rawTotalBpi,
    ratcheted: d.totalBpi,
    rawDelta: i === 0 ? 0 : d.rawTotalBpi - data[i - 1].rawTotalBpi,
    skill: d.latentSkill,
  }));

  const interval = Math.max(1, Math.floor(merged.length / 10));
  const calculatedTicks = merged
    .filter((_, i) => i % interval === 0 || i === merged.length - 1)
    .map((d) => d.date);

  const last = merged[merged.length - 1];
  const gap = last ? last.raw - last.ratcheted : null;

  return {
    chartData: merged,
    ticks: calculatedTicks,
    startIndex: Math.max(0, merged.length - 30),
    latestGap: gap,
  };
}

/** 曲単位の変化履歴（新しい順、上限件数で打ち切り）を組み立てる。 */
export function buildSongSteps(data: BpiHistoryItem[] | undefined) {
  if (!data || data.length === 0)
    return {
      steps: [] as HistoryStep[],
      truncated: false,
      maxAbsRawDelta: 0,
    };
  const steps: HistoryStep[] = [];
  // updatedSongsの各要素はバックエンドが時系列順に計算した実測値。直近件数のみ計算しているため対象外はスキップ
  for (const item of data) {
    for (const song of item.updatedSongs) {
      if (song.rawTotalBpiAfter === undefined) continue;
      steps.push({
        date: item.date,
        title: song.title,
        newExScore: song.newExScore,
        newBpi: song.newBpi,
        rawAfter: song.rawTotalBpiAfter,
        rawDelta: song.rawTotalBpiDelta ?? null,
        bestAfter: song.totalBpiAfter ?? song.rawTotalBpiAfter,
        bestDelta: song.totalBpiDelta ?? null,
        skillAfter: song.latentSkillAfter ?? null,
        skillDelta: song.latentSkillDelta ?? null,
      });
    }
  }
  // 新しい→古い順(一番下が最も古い更新)
  steps.reverse();
  const truncated = steps.length > MAX_HISTORY_STEPS;
  const visible = truncated ? steps.slice(0, MAX_HISTORY_STEPS) : steps;
  const maxAbs = visible.reduce(
    (max, s) => Math.max(max, Math.abs(s.rawDelta ?? 0)),
    0,
  );
  return { steps: visible, truncated, maxAbsRawDelta: maxAbs };
}

/** 日付（groupBy粒度）単位の変化履歴（新しい順、上限件数で打ち切り）を組み立てる。 */
export function buildDateSteps(data: BpiHistoryItem[] | undefined, tFormat: TFormat) {
  if (!data || data.length === 0)
    return {
      steps: [] as HistoryStep[],
      truncated: false,
      maxAbsRawDelta: 0,
    };
  const steps: HistoryStep[] = [];
  // dataは既にgroupBy粒度で集計済みなので、隣同士の差分を取るだけで正確な変化になる(曲単位と違い全期間対象)
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item.updatedSongs.length === 0) continue;
    const prev = i > 0 ? data[i - 1] : null;
    const songTitles = item.updatedSongs.map((s) => s.title);
    const title =
      songTitles.length <= 2
        ? songTitles.join(", ")
        : tFormat("dashboard.currentBpi.ratchetHistory.andMoreSongs", {
            titles: songTitles.slice(0, 2).join(", "),
            count: songTitles.length - 2,
          });
    steps.push({
      date: item.date,
      title,
      rawAfter: item.rawTotalBpi,
      rawDelta: prev ? item.rawTotalBpi - prev.rawTotalBpi : null,
      bestAfter: item.totalBpi,
      bestDelta: prev ? item.totalBpi - prev.totalBpi : null,
      skillAfter: item.latentSkill,
      skillDelta:
        prev && prev.latentSkill != null && item.latentSkill != null
          ? item.latentSkill - prev.latentSkill
          : null,
    });
  }
  steps.reverse();
  const truncated = steps.length > MAX_HISTORY_STEPS;
  const visible = truncated ? steps.slice(0, MAX_HISTORY_STEPS) : steps;
  const maxAbs = visible.reduce(
    (max, s) => Math.max(max, Math.abs(s.rawDelta ?? 0)),
    0,
  );
  return { steps: visible, truncated, maxAbsRawDelta: maxAbs };
}
