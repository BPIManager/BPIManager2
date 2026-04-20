import { useState } from "react";
import { toast } from "sonner";
import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/apiEndpoints";

type TowerRow = { playDate: string; keyCount: number; scratchCount: number };

function parseTowerCsv(csv: string): TowerRow[] {
  const lines = csv.trim().split(/\r?\n/);
  const rows: TowerRow[] = [];
  for (const line of lines) {
    const parts = line.split(",");
    if (parts.length < 3) continue;
    const [rawDate, rawKey, rawScratch] = parts;
    const playDate = rawDate.trim().replace(/\//g, "-");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(playDate)) continue;
    const keyCount = parseInt(rawKey.trim(), 10);
    const scratchCount = parseInt(rawScratch.trim(), 10);
    if (isNaN(keyCount) || isNaN(scratchCount)) continue;
    rows.push({ playDate, keyCount, scratchCount });
  }
  return rows;
}

export type TowerImportResult = {
  upsertedCount: number;
  addedKeyCount: number;
  addedScratchCount: number;
};

export const useIidxTowerImport = (fbUser: FirebaseUser | null) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState("");
  const [importResult, setImportResult] = useState<TowerImportResult | null>(
    null,
  );

  const runImport = async (
    csvData: string,
    version: string,
  ): Promise<boolean> => {
    if (!fbUser) return false;
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
      const lines = targetData.trim().split(/\r?\n/);
      const dataLines = lines[0].startsWith("プレー日")
        ? lines.slice(1)
        : lines;
      const rows = parseTowerCsv(dataLines.join("\n"));

      if (rows.length === 0)
        throw new Error("有効なデータが見つかりませんでした。");

      setProcessStatus(`${rows.length}件をアップロード中...`);
      const idToken = await fbUser.getIdToken(true);

      const response = await fetch(
        `${API_PREFIX}/users/${fbUser.uid}/iidx-tower`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ version, rows }),
        },
      );

      if (!response.ok) throw new Error("サーバーエラーが発生しました。");

      const result = await response.json();

      const addedKeyCount = rows.reduce((acc, row) => acc + row.keyCount, 0);
      const addedScratchCount = rows.reduce(
        (acc, row) => acc + row.scratchCount,
        0,
      );

      setImportResult({
        upsertedCount: result.upsertedCount,
        addedKeyCount,
        addedScratchCount,
      });

      toast.success(
        `${result.upsertedCount}件のタワーデータをインポートしました`,
      );
      await navigator.clipboard.writeText("");
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
