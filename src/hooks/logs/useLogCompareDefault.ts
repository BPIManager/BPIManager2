"use client";

import { useState, useCallback, useEffect } from "react";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";

export type LogCompareDefaultConfig =
  | { mode: "previous" }
  | { mode: "fixed"; version: string };

const STORAGE_KEY = "bpim2_log_compare_default";
const DEFAULT_CONFIG: LogCompareDefaultConfig = { mode: "previous" };

function loadConfig(): LogCompareDefaultConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as LogCompareDefaultConfig;
    if (parsed.mode === "fixed" && typeof parsed.version === "string") {
      return parsed;
    }
    if (parsed.mode === "previous") return parsed;
    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config: LogCompareDefaultConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage unavailable (private mode等)
  }
}

/**
 * 選択中バージョンから「機械的に1つ前」のバージョンを算出する。
 * `IIDX_VERSIONS`配列上の直前の要素を返すだけで、スコアの有無は見ない。
 * 最古バージョンの場合はnull。
 */
export function getMechanicalPreviousVersion(version: string): string | null {
  const idx = (IIDX_VERSIONS as readonly string[]).indexOf(version);
  if (idx <= 0) return null;
  return IIDX_VERSIONS[idx - 1];
}

/**
 * 設定と閲覧中バージョンから、更新ログページの比較対象バージョンの初期値を解決する。
 * `mode: "fixed"`で閲覧中バージョンと同一バージョンが指定されている場合は
 * 比較不能（自分自身との比較になるため）としてundefinedを返す。
 */
export function resolveLogCompareVersion(
  config: LogCompareDefaultConfig,
  currentVersion: string,
): string | undefined {
  if (config.mode === "fixed") {
    return config.version !== currentVersion ? config.version : undefined;
  }
  return getMechanicalPreviousVersion(currentVersion) ?? undefined;
}

/**
 * 更新ログページ（バッチ詳細・楽曲タブ）で使う比較対象バージョンのデフォルト設定を
 * localStorageで管理するフック。
 */
export function useLogCompareDefault() {
  const [config, setConfig] = useState<LogCompareDefaultConfig>(DEFAULT_CONFIG);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // SSR時はlocalStorageが無くサーバー/クライアントで結果が変わるため、
    // hydration後にのみ読み込んでハイドレーションミスマッチを避ける
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfig(loadConfig());
    setHydrated(true);
  }, []);

  const updateConfig = useCallback((next: LogCompareDefaultConfig) => {
    setConfig(next);
    saveConfig(next);
  }, []);

  return { config, updateConfig, hydrated };
}
