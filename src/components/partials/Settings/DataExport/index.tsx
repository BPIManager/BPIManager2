"use client";

import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Loader, FileArchive } from "lucide-react";
import { IIDX_VERSIONS, IIDXVersion } from "@/constants/latestVersion";
import { getVersionNameFromNumber } from "@/constants/versions";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { SongWithScore } from "@/types/songs/withScore";
import JSZip from "jszip";

function songsToCSV(songs: SongWithScore[], version: string): string {
  const header = [
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
    "wrScore",
    "kaidenAvg",
  ].join(",");

  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = songs.map((s) =>
    [
      version,
      escape(s.title),
      escape(s.difficulty),
      s.difficultyLevel,
      s.notes,
      escape(s.bpm),
      s.exScore ?? "",
      s.bpi ?? "",
      escape(s.clearState),
      s.missCount ?? "",
      s.scoreAt ? new Date(s.scoreAt as any).toISOString() : "",
      s.wrScore ?? "",
      s.kaidenAvg ?? "",
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

async function fetchScoresForVersion(
  userId: string,
  version: IIDXVersion,
  token: string,
): Promise<SongWithScore[]> {
  const url = `${API_PREFIX}/users/${userId}/scores?version=${version}&asOf=latest`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`v${version} の取得に失敗しました`);
  return res.json();
}

async function downloadAsZip(
  files: { name: string; content: string }[],
  zipName: string,
) {
  try {
    const zip = new JSZip();
    files.forEach(({ name, content }) => {
      zip.file(name, content);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipName;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    files.forEach(({ name, content }) => {
      const blob = new Blob(["\uFEFF" + content], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

export default function DataExportUi() {
  const { fbUser } = useUser();
  const [selectedVersions, setSelectedVersions] = useState<Set<IIDXVersion>>(
    new Set(IIDX_VERSIONS),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const toggleVersion = (v: IIDXVersion) => {
    setSelectedVersions((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  const handleExport = async () => {
    if (!fbUser?.uid) return;
    if (selectedVersions.size === 0) {
      toast.error("エクスポートするバージョンを選択してください");
      return;
    }

    setIsExporting(true);
    setProgress("");

    try {
      const token = await fbUser.getIdToken(true);
      const versions = IIDX_VERSIONS.filter((v) => selectedVersions.has(v));
      const files: { name: string; content: string }[] = [];

      for (const v of versions) {
        const name = getVersionNameFromNumber(v).replace(/\s/g, "_");
        setProgress(
          `${name} を取得中... (${files.length + 1}/${versions.length})`,
        );
        try {
          const songs = await fetchScoresForVersion(fbUser.uid, v, token);
          const csv = songsToCSV(songs, v);
          files.push({ name: `bpim2_scores_v${v}_${name}.csv`, content: csv });
        } catch (e: any) {
          toast.warning(`v${v} のデータ取得をスキップしました: ${e.message}`);
        }
      }

      if (files.length === 0) {
        toast.error("エクスポートできるデータがありませんでした");
        return;
      }

      setProgress("ZIP を生成中...");
      const today = new Date().toISOString().slice(0, 10);
      if (files.length === 1) {
        const { name, content } = files[0];
        const blob = new Blob(["\uFEFF" + content], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await downloadAsZip(files, `bpim2_scores_${today}.zip`);
      }

      toast.success(`${files.length} バージョンのデータをエクスポートしました`);
    } catch (e: any) {
      toast.error("エクスポートに失敗しました: " + e.message);
    } finally {
      setIsExporting(false);
      setProgress("");
    }
  };

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
            onClick={() => setSelectedVersions(new Set(IIDX_VERSIONS))}
          >
            すべて選択
          </button>
          <span className="text-[11px] text-bpim-muted">/</span>
          <button
            className="text-[11px] text-bpim-muted hover:underline"
            onClick={() => setSelectedVersions(new Set())}
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
            "wrScore",
            "kaidenAvg",
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
            <Loader className="h-4 w-4 animate-spin" />
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
