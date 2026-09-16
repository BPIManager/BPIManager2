import { createHash, randomBytes } from "crypto";
import dayjs from "@/lib/dayjs";

/** userIdを8桁hexに短縮する。batchIdの可読性より短さを優先するための一方向変換。 */
function shortUserHash(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 8);
}

/**
 * 手動スコア編集用batchIdの当日分プレフィックス。ユーザー（8桁hexに短縮）・
 * バージョン・当日日付(JST, YYYYMMDD)から決定的に定まる。「現在の最新batchId
 * がこのプレフィックスで始まるか」で「今日の手動編集セッションが継続中か」を
 * 判定する（{@link mintManualBatchId}参照）。
 *
 * userIdをハッシュ化しているため、別ユーザーのプレフィックスと衝突する
 * 可能性は理論上ゼロではないが、`userId`カラム自体で常に絞り込まれる
 * ため実害は無い（batchIdはグルーピング用のタグであり、所有者の判定には
 * 使わない）。
 *
 * CSVインポート・MCPツール（`updateMyScore.ts`）はランダムUUIDを使うため、
 * この形式のIDと衝突しない。
 */
export function getManualBatchPrefix(userId: string, version: string): string {
  const date = dayjs().tz().format("YYYYMMDD");
  return `m-${shortUserHash(userId)}-${version}-${date}`;
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
  const suffix = randomBytes(2).toString("hex");
  return `${getManualBatchPrefix(userId, version)}-${suffix}`;
}
