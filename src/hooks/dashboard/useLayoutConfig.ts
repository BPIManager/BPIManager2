"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DashboardLayoutConfig,
  DEFAULT_LAYOUT_CONFIG,
} from "@/types/dashboard/layout";

const STORAGE_KEY = "bpim2_dashboard_layout_v2";

function loadConfig(): DashboardLayoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT_CONFIG;
    const parsed = JSON.parse(raw) as DashboardLayoutConfig;
    if (parsed.version !== 2) return DEFAULT_LAYOUT_CONFIG;
    // 新ウィジェットが保存済みconfigに存在しない場合はデフォルト設定で末尾に追加
    const existingIds = new Set(parsed.widgets.map((w) => w.id));
    const defaults = DEFAULT_LAYOUT_CONFIG.widgets;
    const widgets = [...parsed.widgets];
    defaults.forEach((w, i) => {
      if (existingIds.has(w.id)) return;
      const prevId = defaults[i - 1]?.id;
      const prevIdx = widgets.findIndex((x) => x.id === prevId);
      widgets.splice(prevIdx >= 0 ? prevIdx + 1 : widgets.length, 0, w);
    });
    if (widgets.length === parsed.widgets.length) return parsed;
    // バージョン別件数カードの追加に合わせ、旧既定(full)のままのBPM帯別を左右に並ぶ1/2幅へ移行する
    return {
      ...parsed,
      widgets: widgets.map((w) =>
        w.id === "bpmBpiDistribution" && !existingIds.has("versionCountDistribution") && w.width === "full"
          ? { ...w, width: "half" }
          : w,
      ),
    };
  } catch {
    return DEFAULT_LAYOUT_CONFIG;
  }
}

function saveConfig(config: DashboardLayoutConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage unavailable (private mode etc.)
  }
}

export function useLayoutConfig() {
  const [config, setConfig] = useState<DashboardLayoutConfig>(
    DEFAULT_LAYOUT_CONFIG
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage は SSR で無いため、hydration 後にのみ読み込んでハイドレーションミスマッチを避ける。
     // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfig(loadConfig());
    setHydrated(true);
  }, []);

  const updateConfig = useCallback((next: DashboardLayoutConfig) => {
    setConfig(next);
    saveConfig(next);
  }, []);

  const resetConfig = useCallback(() => {
    updateConfig(DEFAULT_LAYOUT_CONFIG);
  }, [updateConfig]);

  return { config, updateConfig, resetConfig, hydrated };
}
