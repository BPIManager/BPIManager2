import { randomBytes } from "crypto";
import { todayJst } from "@/lib/dayjs";

/**
 * 手動スコア編集用batchIdの当日分プレフィックス。ユーザー・バージョン・
 * 当日日付(JST)から決定的に定まる。「現在の最新batchIdがこのプレフィックス
 * で始まるか」で「今日の手動編集セッションが継続中か」を判定する
 * （{@link mintManualBatchId}参照）。
 *
 * CSVインポート・MCPツール（`updateMyScore.ts`）はランダムUUIDを使うため、
 * この形式のIDと衝突しない。
 */
export function getManualBatchPrefix(userId: string, version: string): string {
  return `manual-${userId}-${version}-${todayJst()}`;
}

/**
 * 新規の手動編集batchIdを発行する。プレフィックスは{@link getManualBatchPrefix}
 * と同じだが、末尾にランダムsuffixを付け、常に未使用の値を返す。
 *
 * `logs.batchId`にはUNIQUE制約があるため、「同日内の連続した手動保存を
 * 1行にまとめる」ための決定的ID（プレフィックスのみ）をそのまま複数回の
 * INSERTに使い回すことはできない（間にCSVインポート等が挟まり、現在の
 * 最新行が別のbatchIdになっている状態で決定的IDを再度INSERTしようとすると
 * 重複キーエラーになる）。そのため、当日の手動編集セッションが継続中で
 * ない場合は、この関数で毎回新しい一意なIDを発行する
 * （`saveManualScoreUpdate`がプレフィックス一致を見て使い回すかどうかを判断する）。
 */
export function mintManualBatchId(userId: string, version: string): string {
  const suffix = randomBytes(4).toString("hex");
  return `${getManualBatchPrefix(userId, version)}-${suffix}`;
}
