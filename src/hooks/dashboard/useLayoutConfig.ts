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
    return parsed;
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
