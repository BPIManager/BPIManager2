import { todayJst } from "@/lib/dayjs";

/**
 * 手動スコア編集用の決定的batchId。ユーザー・バージョン・当日日付(JST)から
 * 一意に定まるため、同日内の複数回の手動保存は同じバッチとして扱われ、
 * `logs`/`userStatusLogs`/`scores`の新規行を日ごとに1件に抑えられる
 * （`scoresRepo.upsertManual`等、upsert側の実装を参照）。
 *
 * CSVインポート・MCPツール（`updateMyScore.ts`）はランダムUUIDを使うため、
 * この形式のIDと衝突しない。
 */
export function getManualBatchId(userId: string, version: string): string {
  return `manual-${userId}-${version}-${todayJst()}`;
}
