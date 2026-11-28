import dayjs from "@/lib/dayjs";

/** 手動登録（BPIM2 Camera を含む）の batchId の接頭辞（manualBatchId.ts） */
const MANUAL_BATCH_PREFIX = "m-";

export interface ManualPlayCandidate {
  batchId: string | null;
  exScore: number;
  lastPlayed: Date;
}

/**
 * CSV の行が、今の最新の記録（手動登録）と同じプレーかを判定する（#711）。
 * 手動登録では、ミスカウントが分からなければ前の記録の値を引き継いで保存する。あとで同じプレーを含む CSV を取り込んだとき、
 * 新しい記録を作らず、その記録のミスカウント・ランプを CSV の値で更新するために使う。
 * 条件: 最新の記録が手動登録で、EX が同じで、最終プレー日（JST）が同じ。CSV に最終プレー日がなければ同じとはみなさない
 *
 * @param current - 今の最新の記録
 * @param row - CSV の行（lastPlayed は CSV の日時文字列。JST とみなす）
 */
export function isSameManualPlay(
  current: ManualPlayCandidate | undefined,
  row: { exScore: number; lastPlayed: string | null },
): boolean {
  if (!current || !current.batchId?.startsWith(MANUAL_BATCH_PREFIX)) return false;
  if (current.exScore !== row.exScore) return false;
  if (!row.lastPlayed || !dayjs(row.lastPlayed).isValid()) return false;
  const csvDay = dayjs.tz(row.lastPlayed).format("YYYYMMDD");
  const currentDay = dayjs(current.lastPlayed).tz().format("YYYYMMDD");
  return csvDay === currentDay;
}
