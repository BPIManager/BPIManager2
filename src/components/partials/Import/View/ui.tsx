import { PageContainer, PageHeader } from "@/components/partials/Header";
import { DashboardLayout } from "@/components/partials/Main";
import { InstructionSection } from "./instruction";
import { LoginRequiredCard } from "../../LoginRequired/ui";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { versionsOptions } from "@/constants/versions";
import { iidxUrl } from "@/constants/iidxUrl";
import { BookmarkletAccordion } from "./bookmarklet";
import { AndroidAppAccordion } from "./android";
import {
  type CsvType,
  CSV_TYPE_LABELS,
  validateCsvTypeForVersion,
} from "@/utils/csv/detect";
import { TowerImportView } from "../TowerView/ui";

interface Props {
  csvData: string;
  setCsvData: (v: string) => void;
  detectedType: CsvType;
  selectedVersion: string[];
  setSelectedVersion: (v: string[]) => void;
  isProcessing: boolean;
  isLoggedIn: boolean;
  processStatus: string;
  onStartImport: () => void;
  towerCsvData: string;
  setTowerCsvData: (v: string) => void;
  towerSelectedVersion: string[];
  setTowerSelectedVersion: (v: string[]) => void;
  isTowerProcessing: boolean;
  towerProcessStatus: string;
  onStartTowerImport: () => void;
  defaultTab?: "score" | "tower";
}

export const ImportView = (props: Props) => {
  const { defaultTab = "score" } = props;
  const version = props.selectedVersion[0];
  const csvVersionError =
    props.csvData && props.detectedType !== "unknown"
      ? validateCsvTypeForVersion(props.detectedType, version)
      : null;

  return (
    <DashboardLayout>
      {!props.isLoggedIn ? (
        <LoginRequiredCard />
      ) : (
        <>
          <PageHeader
            title="インポート"
            description="CSVデータをアップロードしてデータを更新します。"
          />
          <PageContainer>
            <Tabs defaultValue={defaultTab}>
              <TabsList className="mb-4 w-full sm:w-auto">
                <TabsTrigger value="score">スコアインポート</TabsTrigger>
                <TabsTrigger value="tower">IIDXタワーインポート</TabsTrigger>
              </TabsList>

              <TabsContent value="score">
                <div className="relative">
                  <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="csv-data"
                        className="text-sm font-bold text-bpim-text"
                      >
                        CSVデータ(
                        <a
                          href={iidxUrl}
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
                        id="csv-data"
                        placeholder="バージョン,タイトル,ジャンル,アーティスト,プレー回数,..."
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
                              ? `検出: ${CSV_TYPE_LABELS[props.detectedType]}`
                              : "未対応のフォーマットです"}
                          </span>
                        </div>
                      )}
                      <BookmarkletAccordion />
                      <AndroidAppAccordion />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-bpim-text">
                        保存先バージョン
                      </Label>
                      <p className="text-[10px] text-bpim-muted">
                        データを反映させるバージョンを選択してください
                      </p>
                      <Select
                        value={props.selectedVersion[0]}
                        onValueChange={(value) =>
                          props.setSelectedVersion([value])
                        }
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
                        <Trash2 className="mr-2 h-4 w-4" /> 入力をクリア
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
                            <Upload className="mr-2 h-4 w-4" /> インポートを開始
                          </>
                        )}
                      </Button>
                    </div>

                    <Separator className="bg-bpim-overlay/60" />
                    <InstructionSection />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tower">
                <TowerImportView
                  csvData={props.towerCsvData}
                  setCsvData={props.setTowerCsvData}
                  selectedVersion={props.towerSelectedVersion}
                  setSelectedVersion={props.setTowerSelectedVersion}
                  isProcessing={props.isTowerProcessing}
                  processStatus={props.towerProcessStatus}
                  onStartImport={props.onStartTowerImport}
                />
              </TabsContent>
            </Tabs>
          </PageContainer>
        </>
      )}
    </DashboardLayout>
  );
};
