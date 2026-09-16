import { useState } from "react";
import { mutate } from "swr";
import { parseAnyCsv } from "@/utils/csv/parse";
import { detectCsvType, validateCsvTypeForVersion } from "@/utils/csv/detect";
import type { ParsedCsvRow } from "@/utils/csv/types";
import { toast } from "sonner";
import { User as FirebaseUser } from "firebase/auth";
import { safeClipboardRead, safeClipboardClear } from "@/utils/clipboard";
import { submitBatchImport } from "@/services/swr/batches/batchImport";
import dayjs from "@/lib/dayjs";
import {
  latestVersion,
  latestVersionReleaseDate,
} from "@/constants/iidx/iidxVersions";

/**
 * CSV データのバッチインポート処理を管理するフック。
 * `csvData` が空の場合はクリップボードから自動読み取りを試みる。
 *
 * @param fbUser - Firebase 認証済みユーザー（null の場合はインポートしない）
 * @param refresh - インポート成功後に呼び出すデータ再取得関数
 * @returns インポート実行関数・処理中フラグ・進捗テキスト・インポート結果
 */
export const useBatchImport = (
  fbUser: FirebaseUser | null,
  refresh: () => Promise<unknown>,
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState("");
  const [importResult, setImportResult] = useState<{
    batchId: string;
    updatedCount: number;
    newTotalBpi?: number;
    previousTotalBpi?: number;
  } | null>(null);
  const [pendingLegacyConfirm, setPendingLegacyConfirm] = useState<{
    rows: ParsedCsvRow[];
    version: string;
  } | null>(null);

  const performImport = async (rows: ParsedCsvRow[], version: string) => {
    if (!fbUser) return false;
    try {
      setProcessStatus(`${rows.length}件をアップロード中...`);

      const result = await submitBatchImport(fbUser.uid, fbUser, version, rows);
      if (result.updatedBpiCount > 0) {
        setImportResult({
          batchId: result.batchId,
          updatedCount: result.updatedBpiCount,
          previousTotalBpi: result.previousTotalBpi,
          newTotalBpi: result.newTotalBpi,
        });
      } else {
        toast.info("すでに最新の状態です");
      }
      await safeClipboardClear();
      await mutate(
        (key) =>
          Array.isArray(key) &&
          typeof key[0] === "string" &&
          key[0].includes("/scores?"),
      );
      await refresh();
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "エラーが発生しました");
      return false;
    } finally {
      setIsProcessing(false);
      setProcessStatus("");
    }
  };

  const runImport = async (csvData: string, version: string) => {
    if (!fbUser) return;
    setIsProcessing(true);
    let targetData = csvData.trim();

    try {
      if (!targetData) {
        setProcessStatus("クリップボードを確認中...");
        const text = await safeClipboardRead();
        if (!text?.trim())
          throw new Error(
            "クリップボードの読み取りに失敗しました。データを直接貼り付けてください。",
          );
        targetData = text;
        toast.info("クリップボードから読み込みました");
      }

      setProcessStatus("CSVを解析中...");
      const detectedType = detectCsvType(targetData);
      const validationError = validateCsvTypeForVersion(detectedType, version);
      if (validationError) throw new Error(validationError);

      const formattedRows = parseAnyCsv(targetData);

      if (formattedRows.length === 0)
        throw new Error("有効なデータがありません。");

      // 最新バージョンへの投入なのに、含まれる最終プレー日時が
      // すべてリリース日より前 = 旧バージョンCSVの取り違えの可能性がある行が1件以上あるケースを検知する
      const hasLegacyDatedRow = formattedRows.some(
        (row) =>
          row.lastPlayed && dayjs(row.lastPlayed).isBefore(latestVersionReleaseDate),
      );
      if (version === latestVersion && hasLegacyDatedRow) {
        setPendingLegacyConfirm({ rows: formattedRows, version });
        setIsProcessing(false);
        setProcessStatus("");
        return false;
      }

      return await performImport(formattedRows, version);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "エラーが発生しました");
      setIsProcessing(false);
      setProcessStatus("");
      return false;
    }
  };

  const confirmLegacyImport = async () => {
    if (!pendingLegacyConfirm) return false;
    const { rows, version } = pendingLegacyConfirm;
    setPendingLegacyConfirm(null);
    setIsProcessing(true);
    return performImport(rows, version);
  };

  const cancelLegacyImport = () => setPendingLegacyConfirm(null);

  return {
    runImport,
    isProcessing,
    processStatus,
    importResult,
    setImportResult,
    pendingLegacyConfirm,
    confirmLegacyImport,
    cancelLegacyImport,
  };
};
