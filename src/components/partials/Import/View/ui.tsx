import { Trash2, Upload, AlertCircle } from "lucide-react";
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
import { versionsOptions } from "@/constants/versions";
import { iidxUrl } from "@/constants/iidxUrl";
import { BookmarkletAccordion } from "./bookmarklet";

interface Props {
  csvData: string;
  setCsvData: (v: string) => void;
  selectedVersion: string[];
  setSelectedVersion: (v: string[]) => void;
  isProcessing: boolean;
  isLoggedIn: boolean;
  processStatus: string;
  onStartImport: () => void;
}

export const ImportView = (props: Props) => (
  <DashboardLayout>
    <div className="flex flex-col gap-8">
      <PageHeader
        title="インポート"
        description="CSVデータをアップロードしてBPIを更新します。"
      />

      <PageContainer>
        <div className="relative">
          {!props.isLoggedIn ? (
            <LoginRequiredCard />
          ) : (
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
                    ダウンロードはこちら
                  </a>
                  )
                </Label>
                <p className="text-[10px] text-bpim-muted">
                  データを改変しないですべて貼り付けてください
                </p>
                <Textarea
                  id="csv-data"
                  placeholder="バージョン,タイトル,ジャンル,アーティスト,プレー回数,..."
                  className="max-h-[50px] border-bpim-border bg-bpim-surface-2/60 p-4 font-mono text-sm transition-colors focus:border-bpim-primary focus:ring-0"
                  value={props.csvData}
                  onChange={(e) => props.setCsvData(e.target.value)}
                />
                <BookmarkletAccordion />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-bpim-text">
                  保存先バージョン
                </Label>
                <Select
                  value={props.selectedVersion[0]}
                  onValueChange={(value) => props.setSelectedVersion([value])}
                >
                  <SelectTrigger className="w-full border-bpim-border bg-bpim-surface-2/60 text-sm md:w-[300px]">
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
                <p className="text-[10px] text-bpim-muted">
                  データを反映させるバージョンを選択してください
                </p>
              </div>

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
                  disabled={props.isProcessing}
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

              <div className="flex items-start gap-3 rounded-lg bg-bpim-surface-2/60 p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-bpim-primary" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-bpim-text">Note</span>
                  <p className="text-xs leading-relaxed text-bpim-muted">
                    CSVデータはクリップボードから読み取ることもできます。
                    <br />
                    <strong className="text-bpim-text">
                      データの更新には最大1分程度かかります。
                    </strong>
                  </p>
                </div>
              </div>

              <Separator className="bg-bpim-overlay/60" />
              <InstructionSection />
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  </DashboardLayout>
);
