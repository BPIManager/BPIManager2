import { useState } from "react";
import { toaster } from "@/components/ui/chakra/toaster";
import { parseCSV } from "@/utils/csv/parse";
import { API_PREFIX } from "@/constants/apiEndpoints";

export const useBatchImport = (fbUser: any, refresh: () => Promise<void>) => {
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
        toaster.create({
          title: "クリップボードから読み込みました",
          type: "info",
        });
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
      if (result.updatedCount > 0) {
        setImportResult({
          batchId: result.batchId,
          updatedCount: result.updatedCount,
          previousTotalBpi: result.previousTotalBpi,
          newTotalBpi: result.newTotalBpi,
        });
      } else {
        toaster.create({
          title: "更新なし",
          description: "最新の状態です",
          type: "info",
        });
      }
      await navigator.clipboard.writeText("");

      await refresh();
      return true;
    } catch (e: any) {
      toaster.create({
        title: "エラー",
        description: e.message,
        type: "error",
      });
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
