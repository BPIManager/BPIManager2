import { Trash2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
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
import { versionsOptions } from "@/constants/iidx/versionTitles";
import { towerDownloadUrl } from "@/constants/iidx/eamusementUrls";
import BookmarkletAccordion from "@/components/partials/common/Bookmarklet";
import { useTranslation } from "@/hooks/common/useTranslation";
import StepCard from "../StepCard";

export interface TowerImportProps {
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

const TowerImportView = ({
  csvData,
  setCsvData,
  selectedVersion,
  setSelectedVersion,
  isProcessing,
  processStatus,
  onStartImport,
}: TowerImportProps) => {
  const { t } = useTranslation();
  const isValid = csvData.trim() ? isValidTowerCsv(csvData) : null;

  return (
    <div className="flex flex-col gap-6">
      <StepCard
        step={1}
        title={
          <Label
            htmlFor="tower-csv"
            className="text-sm font-bold text-bpim-text"
          >
            {t("import.towerCsv.label")}(
            <a
              href={towerDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:decoration-bpim-primary"
            >
              {t("import.csv.officialDownload")}
            </a>
            )
          </Label>
        }
      >
        <p className="text-[10px] text-bpim-muted">
          {t("import.csv.pasteHint")}
          <br />
          {t("import.csv.clipboardHint")}
        </p>
        <Textarea
          id="tower-csv"
          placeholder={
            "プレー日,鍵盤,スクラッチ\n2026/04/20,14419,1296\n2026/04/18,85630,7091"
          }
          className="max-h-12.5 border-bpim-border bg-bpim-surface-2 p-4 font-mono text-sm transition-colors focus:border-bpim-primary focus:ring-0"
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
        />
        {csvData.trim() && (
          <div className="flex items-center gap-1.5">
            {isValid ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-bpim-success" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-bpim-danger" />
            )}
            <span
              className={`text-xs font-medium ${
                isValid ? "text-bpim-success" : "text-bpim-danger"
              }`}
            >
              {isValid
                ? t("import.towerCsv.detected")
                : t("import.towerCsv.unsupported")}
            </span>
          </div>
        )}
        <BookmarkletAccordion />
      </StepCard>

      <StepCard step={2} title={t("import.version.label")}>
        <p className="text-[10px] text-bpim-muted">
          {t("import.version.desc")}
        </p>
        <Select
          value={selectedVersion[0]}
          onValueChange={(value) => setSelectedVersion([value])}
        >
          <SelectTrigger className="w-full border-bpim-border bg-bpim-surface-2 text-sm md:w-75">
            <SelectValue placeholder={t("import.version.placeholder")} />
          </SelectTrigger>
          <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
            {versionsOptions.map((v) => (
              <SelectItem key={v.value} value={v.value} disabled={v.disabled}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </StepCard>

      <StepCard step={3} title={t("import.step.run.title")}>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Button
            variant="ghost"
            className="w-full text-bpim-danger hover:bg-bpim-danger/10 hover:text-bpim-danger sm:w-auto"
            onClick={() => setCsvData("")}
            disabled={!csvData || isProcessing}
          >
            <Trash2 className="mr-2 h-4 w-4" /> {t("import.button.clear")}
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
                <Upload className="mr-2 h-4 w-4" /> {t("import.button.start")}
              </>
            )}
          </Button>
        </div>
      </StepCard>
    </div>
  );
};

export default TowerImportView;
