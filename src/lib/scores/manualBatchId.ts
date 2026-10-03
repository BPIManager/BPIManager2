import { createHash, randomBytes } from "crypto";
import dayjs from "@/lib/dayjs";

/**
 * userId を16桁hex(64bit)に短縮する一方向変換。batchId だけで検索するクエリが既存のため、衝突確率を実質無視できる桁数を確保する。
 * CSVインポートのランダムUUID（122bit）と同程度の衝突耐性を前提とする。
 */
function shortUserHash(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 16);
}

/**
 * 手動編集 batchId の当日プレフィックス（ユーザー・バージョン・JST日付から決定的に定まる）。
 * 現在の最新 batchId がこの接頭辞で始まれば当日の編集セッションが継続中と判断する（{@link mintManualBatchId} 参照）。
 */
export function getManualBatchPrefix(userId: string, version: string): string {
  const date = dayjs().tz().format("YYYYMMDD");
  return `m-${shortUserHash(userId)}-${version}-${date}`;
}

/**
 * 手動編集の新規 batchId を発行する。logs.batchId は UNIQUE のため決定的IDは使い回せず、毎回ランダムsuffixを付ける。
 * 同日の編集セッションの継続判断は saveManualScoreUpdate がプレフィックス一致で行う。
 */
export function mintManualBatchId(userId: string, version: string): string {
  const suffix = randomBytes(3).toString("hex");
  return `${getManualBatchPrefix(userId, version)}-${suffix}`;
}
