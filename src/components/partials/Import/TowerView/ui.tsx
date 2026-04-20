import {
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { versionsOptions } from "@/constants/versions";
import { BookmarkletAccordion } from "../View/bookmarklet";

interface Props {
  csvData: string;
  setCsvData: (v: string) => void;
  selectedVersion: string[];
  setSelectedVersion: (v: string[]) => void;
  isProcessing: boolean;
  processStatus: string;
  onStartImport: () => void;
}

function isValidTowerCsv(csv: string): boolean {
  const lines = csv.trim().split(/\r?\n/);
  const dataLines = lines[0]?.startsWith("プレー日") ? lines.slice(1) : lines;
  return dataLines.some((line) => {
    const parts = line.split(",");
    if (parts.length < 3) return false;
    const dateStr = parts[0].trim().replace(/\//g, "-");
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  });
}

export const TowerImportView = ({
  csvData,
  setCsvData,
  selectedVersion,
  setSelectedVersion,
  isProcessing,
  processStatus,
  onStartImport,
}: Props) => {
  const isValid = csvData.trim() ? isValidTowerCsv(csvData) : null;
  const towerDownloadUrl =
    "https://p.eagate.573.jp/game/2dx/33/djdata/score_download.html?style=tower";

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Label htmlFor="tower-csv" className="text-sm font-bold text-bpim-text">
          IIDXタワーCSVデータ(
          <a
            href={towerDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-bpim-primary underline decoration-blue-400/30 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-blue-300"
          >
            公式CSVダウンロードはこちら
          </a>
          )
        </Label>
        <p className="text-[10px] text-bpim-muted">
          データを改変しないですべて貼り付けてください
          <br />
          「インポートを開始」をクリックして、貼り付けを省略してクリップボードから読み取ることもできます。
        </p>
        <Textarea
          id="tower-csv"
          placeholder={
            "プレー日,鍵盤,スクラッチ\n2026/04/20,14419,1296\n2026/04/18,85630,7091"
          }
          className="max-h-12.5 border-bpim-border bg-bpim-surface-2/60 p-4 font-mono text-sm transition-colors focus:border-bpim-primary focus:ring-0"
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
        />
        {csvData.trim() && (
          <div className="flex items-center gap-1.5">
            {isValid ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-bpim-danger" />
            )}
            <span
              className={`text-xs font-medium ${
                isValid ? "text-green-500" : "text-bpim-danger"
              }`}
            >
              {isValid
                ? "検出: IIDXタワーCSV"
                : "対応していないフォーマットです"}
            </span>
          </div>
        )}

        <BookmarkletAccordion />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-bold text-bpim-text">
          保存先バージョン
        </Label>
        <p className="text-[10px] text-bpim-muted">
          データを反映させるバージョンを選択してください
        </p>
        <Select
          value={selectedVersion[0]}
          onValueChange={(value) => setSelectedVersion([value])}
        >
          <SelectTrigger className="w-full border-bpim-border bg-bpim-surface-2/60 text-sm md:w-75">
            <SelectValue placeholder="バージョンを選択" />
          </SelectTrigger>
          <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
            {versionsOptions.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Button
          variant="ghost"
          className="w-full text-bpim-danger hover:bg-bpim-danger/10 hover:text-bpim-danger sm:w-auto"
          onClick={() => setCsvData("")}
          disabled={!csvData || isProcessing}
        >
          <Trash2 className="mr-2 h-4 w-4" /> 入力をクリア
        </Button>
        <Button
          className="w-full bg-bpim-primary px-8 font-bold text-white hover:bg-bpim-primary sm:w-auto"
          size="lg"
          disabled={
            isProcessing ||
            !selectedVersion[0] ||
            (!!csvData.trim() && !isValid)
          }
          onClick={onStartImport}
        >
          {isProcessing ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-bpim-border border-t-white" />
              {processStatus}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> インポートを開始
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
