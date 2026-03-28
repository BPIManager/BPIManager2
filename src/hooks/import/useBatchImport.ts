import { useState } from "react";
import { parseCSV } from "@/utils/csv/parse";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { toast } from "sonner";
import { User as FirebaseUser } from "firebase/auth";

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

  const runImport = async (csvData: string, version: string) => {
    if (!fbUser) return;
    setIsProcessing(true);
    let targetData = csvData.trim();

    try {
      if (!targetData) {
        setProcessStatus("クリップボードを確認中...");
        const text = await navigator.clipboard.readText();
        if (!text.trim()) throw new Error("データが空です。");
        targetData = text;
        toast.info("クリップボードから読み込みました");
      }

      setProcessStatus("CSVを解析中...");
      const formattedRows = parseCSV(targetData);

      if (formattedRows.length === 0)
        throw new Error("有効なデータがありません。");

      setProcessStatus(`${formattedRows.length}件をアップロード中...`);
      const idToken = await fbUser.getIdToken(true);

      const response = await fetch(
        `${API_PREFIX}/users/${fbUser.uid}/scores/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ version, csvRows: formattedRows }),
        },
      );

      if (!response.ok) throw new Error("サーバーエラーが発生しました。");

      const result = await response.json();
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
      await navigator.clipboard.writeText("");

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

  return {
    runImport,
    isProcessing,
    processStatus,
    importResult,
    setImportResult,
  };
};
