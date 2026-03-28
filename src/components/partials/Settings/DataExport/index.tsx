"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileArchive } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { IIDX_VERSIONS } from "@/constants/latestVersion";
import { getVersionNameFromNumber } from "@/constants/versions";
import { useDataExport } from "@/hooks/export/useDataExport";

export default function DataExportUi() {
  const {
    selectedVersions,
    toggleVersion,
    selectAll,
    clearAll,
    isExporting,
    progress,
    handleExport,
  } = useDataExport();

  return (
    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <FileArchive className="h-4 w-4" />
          <span className="font-bold">データエクスポート</span>
        </div>
        <p className="text-sm text-bpim-muted">
          スコアデータをCSV形式でダウンロードします。複数バージョンを選択するとZIPにまとめてダウンロードします。
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-bpim-muted">
          エクスポートするバージョン
        </span>
        <div className="flex flex-wrap gap-3">
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
        <div className="flex gap-2 mt-1">
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

      <div className="rounded-lg border border-bpim-border bg-bpim-surface-2/60 p-3 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-muted mb-1">
          出力フィールド
        </span>
        <div className="flex flex-wrap gap-1">
          {[
            "version",
            "title",
            "difficulty",
            "difficultyLevel",
            "notes",
            "bpm",
            "exScore",
            "bpi",
            "clearState",
            "missCount",
            "scoreAt",
          ].map((f) => (
            <Badge
              key={f}
              variant="secondary"
              className="text-[10px] font-mono py-0 bg-bpim-overlay"
            >
              {f}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-start gap-2">
        <Button
          onClick={handleExport}
          disabled={isExporting || selectedVersions.size === 0}
          className="gap-2 min-w-[160px]"
        >
          {isExporting ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? "エクスポート中..." : "CSVをダウンロード"}
        </Button>
        {isExporting && progress && (
          <p className="text-xs text-bpim-muted animate-pulse">{progress}</p>
        )}
      </div>
    </div>
  );
}
