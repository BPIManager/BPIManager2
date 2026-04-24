"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Download, FileArchive } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { IIDX_VERSIONS } from "@/constants/latestVersion";
import { getVersionNameFromNumber } from "@/constants/versions";
import {
  useDataExport,
  EXPORT_FIELDS,
  ExportField,
} from "@/hooks/export/useDataExport";

export default function DataExportUi() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    selectedVersions,
    toggleVersion,
    selectAll,
    clearAll,
    selectedFields,
    toggleField,
    selectAllFields,
    clearAllFields,
    isExporting,
    progress,
    handleExport,
  } = useDataExport();

  const onExport = async () => {
    await handleExport();
    if (!isExporting) setIsOpen(false);
  };

  return (
    <>
      <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-bpim-primary">
            <FileArchive className="h-4 w-4" />
            <span className="font-bold">データエクスポート</span>
          </div>
          <p className="text-sm text-bpim-muted">
            スコアデータをCSV形式でダウンロードします。
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="w-full md:w-auto gap-2"
        >
          <Download className="h-4 w-4" />
          エクスポート
        </Button>
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => !isExporting && setIsOpen(open)}
      >
        <DialogContent className="max-w-[90vw] sm:max-w-xl border-bpim-border bg-bpim-bg p-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-bpim-border">
            <DialogTitle className="text-lg font-bold text-bpim-text">
              データエクスポート
            </DialogTitle>
            <p className="text-xs text-bpim-muted mt-1">
              複数バージョン選択時はZIPにまとめてダウンロードします。
            </p>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[65vh] p-6 flex flex-col gap-6">
            {/* バージョン選択 */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-bpim-text">
                  バージョン
                </span>
                <div className="flex gap-2">
                  <button
                    className="text-[11px] text-bpim-primary hover:underline"
                    onClick={selectAll}
                  >
                    すべて選択
                  </button>
                  <span className="text-[11px] text-bpim-muted">/</span>
                  <button
                    className="text-[11px] text-bpim-muted hover:underline"
                    onClick={clearAll}
                  >
                    すべて解除
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {IIDX_VERSIONS.map((v) => {
                  const checked = selectedVersions.has(v);
                  const name = getVersionNameFromNumber(v);
                  return (
                    <label
                      key={v}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-bpim-border bg-bpim-surface px-3 py-2 hover:bg-bpim-overlay transition-colors"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleVersion(v)}
                        className="h-4 w-4 border-bpim-border data-[state=checked]:bg-bpim-primary"
                        id={`ver-${v}`}
                      />
                      <Label
                        htmlFor={`ver-${v}`}
                        className="cursor-pointer text-xs font-bold"
                      >
                        {name}
                      </Label>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* フィールド選択 */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-bpim-text">
                  出力フィールド
                </span>
                <div className="flex gap-2">
                  <button
                    className="text-[11px] text-bpim-primary hover:underline"
                    onClick={selectAllFields}
                  >
                    すべて選択
                  </button>
                  <span className="text-[11px] text-bpim-muted">/</span>
                  <button
                    className="text-[11px] text-bpim-muted hover:underline"
                    onClick={clearAllFields}
                  >
                    すべて解除
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {EXPORT_FIELDS.map((f) => {
                  const checked = selectedFields.has(f as ExportField);
                  return (
                    <label
                      key={f}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-bpim-border bg-bpim-surface px-3 py-2 hover:bg-bpim-overlay transition-colors"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleField(f as ExportField)}
                        className="h-4 w-4 border-bpim-border data-[state=checked]:bg-bpim-primary"
                        id={`field-${f}`}
                      />
                      <Label
                        htmlFor={`field-${f}`}
                        className="cursor-pointer font-mono text-xs font-bold"
                      >
                        {f}
                      </Label>
                    </label>
                  );
                })}
              </div>
              {selectedFields.size > 0 && (
                <div className="rounded-lg border border-bpim-border bg-bpim-surface-2/60 p-3 flex flex-wrap gap-1">
                  {EXPORT_FIELDS.filter((f) =>
                    selectedFields.has(f as ExportField),
                  ).map((f) => (
                    <Badge
                      key={f}
                      variant="secondary"
                      className="text-[10px] font-mono py-0 bg-bpim-overlay"
                    >
                      {f}
                    </Badge>
                  ))}
                </div>
              )}
            </section>
          </div>

          <DialogFooter className="flex flex-col items-stretch gap-2 p-6 border-t border-bpim-border sm:flex-row sm:items-center sm:justify-between">
            {isExporting && progress && (
              <p className="text-xs text-bpim-muted animate-pulse sm:flex-1">
                {progress}
              </p>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isExporting}
                className="h-9 px-4 text-bpim-muted hover:text-bpim-text hover:bg-bpim-overlay/50"
              >
                キャンセル
              </Button>
              <Button
                onClick={onExport}
                disabled={
                  isExporting ||
                  selectedVersions.size === 0 ||
                  selectedFields.size === 0
                }
                className="h-9 px-6 font-bold gap-2"
              >
                {isExporting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting ? "エクスポート中..." : "ダウンロード"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
