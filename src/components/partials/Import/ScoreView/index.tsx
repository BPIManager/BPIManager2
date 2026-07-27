import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { versionsOptions } from "@/constants/iidx/versionTitles";
import { iidxUrl } from "@/constants/iidx/eamusementUrls";
import { BookmarkletAccordion } from "../View/bookmarklet";
import { AndroidAppAccordion } from "../View/android";
import { InstructionSection } from "../View/instruction";
import {
  type CsvType,
  CSV_TYPE_LABELS,
  validateCsvTypeForVersion,
} from "@/utils/csv/detect";
import { useTranslation } from "@/hooks/common/useTranslation";

export interface ScoreImportProps {
  csvData: string;
  setCsvData: (v: string) => void;
  detectedType: CsvType;
  selectedVersion: string[];
  setSelectedVersion: (v: string[]) => void;
  isProcessing: boolean;
  processStatus: string;
  onStartImport: () => void;
}

export const ScoreImportView = (props: ScoreImportProps) => {
  const { t } = useTranslation();
  const version = props.selectedVersion[0];
  const csvVersionError =
    props.csvData && props.detectedType !== "unknown"
      ? validateCsvTypeForVersion(props.detectedType, version)
      : null;

  return (
    <div className="relative">
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Label
            htmlFor="csv-data"
            className="text-sm font-bold text-bpim-text"
          >
            {t("import.csv.label")}(
            <a
              href={iidxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-bpim-primary underline decoration-blue-400/30 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-blue-300"
            >
              {t("import.csv.officialDownload")}
            </a>
            )
          </Label>
          <p className="text-[10px] text-bpim-muted">
            {t("import.csv.pasteHint")}
            <br />
            {t("import.csv.clipboardHint")}
          </p>
          <Textarea
            id="csv-data"
            placeholder={t("import.csv.placeholder")}
            className="max-h-12.5 border-bpim-border bg-bpim-surface-2/60 p-4 font-mono text-sm transition-colors focus:border-bpim-primary focus:ring-0"
            value={props.csvData}
            onChange={(e) => props.setCsvData(e.target.value)}
          />
          {props.csvData && (
            <div className="flex items-center gap-1.5">
              {props.detectedType !== "unknown" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-bpim-danger" />
              )}
              <span
                className={`text-xs font-medium ${
                  props.detectedType !== "unknown"
                    ? "text-green-500"
                    : "text-bpim-danger"
                }`}
              >
                {props.detectedType !== "unknown"
                  ? `${t("import.csv.detectedPrefix")}${CSV_TYPE_LABELS[props.detectedType]}`
                  : t("import.csv.unsupported")}
              </span>
            </div>
          )}
          <BookmarkletAccordion />
          <AndroidAppAccordion />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold text-bpim-text">
            {t("import.version.label")}
          </Label>
          <p className="text-[10px] text-bpim-muted">
            {t("import.version.desc")}
          </p>
          <Select
            value={props.selectedVersion[0]}
            onValueChange={(value) => props.setSelectedVersion([value])}
          >
            <SelectTrigger className="w-full border-bpim-border bg-bpim-surface-2/60 text-sm md:w-75">
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
        </div>

        {csvVersionError && (
          <div className="flex items-start gap-2 rounded-lg border border-bpim-danger/40 bg-bpim-danger/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-bpim-danger" />
            <p className="text-xs leading-relaxed text-bpim-danger">
              {csvVersionError}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Button
            variant="ghost"
            className="w-full text-bpim-danger hover:bg-bpim-danger/10 hover:text-bpim-danger sm:w-auto"
            onClick={() => props.setCsvData("")}
            disabled={!props.csvData || props.isProcessing}
          >
            <Trash2 className="mr-2 h-4 w-4" /> {t("import.button.clear")}
          </Button>
          <Button
            className="w-full bg-bpim-primary px-8 font-bold text-white hover:bg-bpim-primary sm:w-auto"
            size="lg"
            disabled={props.isProcessing || !!csvVersionError}
            onClick={props.onStartImport}
          >
            {props.isProcessing ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-bpim-border border-t-white" />
                {props.processStatus}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> {t("import.button.start")}
              </>
            )}
          </Button>
        </div>

        <Separator className="bg-bpim-overlay/60" />
        <InstructionSection />
      </div>
    </div>
  );
};
