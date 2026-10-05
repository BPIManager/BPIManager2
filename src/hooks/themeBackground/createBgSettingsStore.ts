import { useSyncExternalStore } from "react";
import { safeGetItem, safeSetItem } from "@/utils/common/safeStorage";

export type BgSpeed = "slow" | "normal" | "fast";

export interface BgSettings {
  enabled: boolean;
  speed: BgSpeed;
}

export interface BgSettingsStore {
  useSettings: () => BgSettings;
  setSettings: (patch: Partial<BgSettings>) => void;
}

export const BG_SPEEDS: BgSpeed[] = ["slow", "normal", "fast"];
export const BG_SPEED_FACTOR: Record<BgSpeed, number> = {
  slow: 0.5,
  normal: 1,
  fast: 2,
};

const SERVER_SNAPSHOT: BgSettings = { enabled: false, speed: "normal" };

/**
 * テーマ固有の背景アニメーション設定（有効/無効・速度）を localStorage に保存し、購読中の全コンポーネントへ反映するストアを作る。
 *
 * @param keyPrefix - localStorage キーの接頭辞（`<prefix>-enabled` / `<prefix>-speed` を使う）
 */
export function createBgSettingsStore(keyPrefix: string): BgSettingsStore {
  const enabledKey = `${keyPrefix}-enabled`;
  const speedKey = `${keyPrefix}-speed`;
  const listeners = new Set<() => void>();
  let cache: BgSettings | null = null;

  // 未設定時は OS の「視差効果を減らす」に従い、有効化は明示的な操作に限る
  const read = (): BgSettings => {
    const storedEnabled = safeGetItem(enabledKey);
    const storedSpeed = safeGetItem(speedKey);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    return {
      enabled: storedEnabled === null ? !reduced : storedEnabled === "true",
      speed: BG_SPEEDS.find((s) => s === storedSpeed) ?? "normal",
    };
  };

  const getSnapshot = (): BgSettings => {
    cache ??= read();
    return cache;
  };

  const subscribe = (onChange: () => void) => {
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  };

  return {
    useSettings: () =>
      useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT),
    setSettings: (patch) => {
      const next = { ...getSnapshot(), ...patch };
      cache = next;
      safeSetItem(enabledKey, String(next.enabled));
      safeSetItem(speedKey, next.speed);
      listeners.forEach((l) => l());
    },
  };
}
