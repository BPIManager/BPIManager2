"use client";

import { useState } from "react";
import { toast } from "sonner";
import JSZip from "jszip";
import { IIDX_VERSIONS } from "@/constants/latestVersion";
import type { IIDXVersion } from "@/types/iidx/version";
import { getVersionNameFromNumber } from "@/constants/versions";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { SongWithScore } from "@/types/songs/score";
import { useUser } from "@/contexts/users/UserContext";

export const EXPORT_FIELDS = [
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
] as const;

export type ExportField = (typeof EXPORT_FIELDS)[number];

function songsToCSV(
  songs: SongWithScore[],
  version: string,
  fields: Set<ExportField>,
): string {
  const escape = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const getValue = (s: SongWithScore, field: ExportField): string => {
    switch (field) {
      case "version":       return version;
      case "title":         return escape(s.title);
      case "difficulty":    return escape(s.difficulty);
      case "difficultyLevel": return String(s.difficultyLevel);
      case "notes":         return String(s.notes);
      case "bpm":           return escape(s.bpm);
      case "exScore":       return s.exScore != null ? String(s.exScore) : "";
      case "bpi":           return s.bpi != null ? String(s.bpi) : "";
      case "clearState":    return escape(s.clearState);
      case "missCount":     return s.missCount != null ? String(s.missCount) : "";
      case "scoreAt":       return s.scoreAt ? new Date(s.scoreAt).toISOString() : "";
    }
  };

  const activeFields = EXPORT_FIELDS.filter((f) => fields.has(f));
  const header = activeFields.join(",");
  const rows = songs.map((s) => activeFields.map((f) => getValue(s, f)).join(","));
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

export function useDataExport() {
  const { fbUser } = useUser();
  const [selectedVersions, setSelectedVersions] = useState<Set<IIDXVersion>>(
    new Set(IIDX_VERSIONS),
  );
  const [selectedFields, setSelectedFields] = useState<Set<ExportField>>(
    new Set(EXPORT_FIELDS),
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

  const selectAllVersions = () => setSelectedVersions(new Set(IIDX_VERSIONS));
  const clearAllVersions = () => setSelectedVersions(new Set());

  const toggleField = (f: ExportField) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  };

  const selectAllFields = () => setSelectedFields(new Set(EXPORT_FIELDS));
  const clearAllFields = () => setSelectedFields(new Set());

  const handleExport = async () => {
    if (!fbUser?.uid) return;
    if (selectedVersions.size === 0) {
      toast.error("エクスポートするバージョンを選択してください");
      return;
    }
    if (selectedFields.size === 0) {
      toast.error("エクスポートするフィールドを選択してください");
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
          const csv = songsToCSV(songs, v, selectedFields);
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
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
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

  // 後方互換: 旧 selectAll / clearAll を残す
  const selectAll = selectAllVersions;
  const clearAll = clearAllVersions;

  return {
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
  };
}
