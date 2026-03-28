"use client";

import { useState } from "react";
import { toast } from "sonner";
import JSZip from "jszip";
import { IIDX_VERSIONS, IIDXVersion } from "@/constants/latestVersion";
import { getVersionNameFromNumber } from "@/constants/versions";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { SongWithScore } from "@/types/songs/withScore";
import { useUser } from "@/contexts/users/UserContext";

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
  ].join(",");

  const escape = (v: string | number | null | undefined) => {
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
      s.scoreAt ? new Date(s.scoreAt).toISOString() : "",
    ].join(","),
  );
  return [header, ...rows].join("\r\n");
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

/**
 * 選択バージョンのスコアを CSV ファイルとしてエクスポートするフック。
 * 複数バージョン選択時は ZIP にまとめてダウンロードし、ZIP 生成失敗時は個別ダウンロードにフォールバックする。
 *
 * @returns バージョン選択状態・トグル関数・全選択/全解除・エクスポート実行関数・進捗テキスト
 */
export function useDataExport() {
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

  const selectAll = () => setSelectedVersions(new Set(IIDX_VERSIONS));
  const clearAll = () => setSelectedVersions(new Set());

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
          const withBom = "\uFEFF" + csv;
          files.push({
            name: `bpim2_scores_v${v}_${name}.csv`,
            content: withBom,
          });
        } catch (e) {
          toast.warning(
            `v${v} のデータ取得をスキップしました: ${e instanceof Error ? e.message : String(e)}`,
          );
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
        const blob = new Blob([content], {
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
    } catch (e) {
      toast.error(
        "エクスポートに失敗しました: " +
          (e instanceof Error ? e.message : String(e)),
      );
    } finally {
      setIsExporting(false);
      setProgress("");
    }
  };

  return {
    selectedVersions,
    toggleVersion,
    selectAll,
    clearAll,
    isExporting,
    progress,
    handleExport,
  };
}
