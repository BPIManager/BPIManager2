import { useSyncExternalStore } from "react";
import { safeGetItem, safeSetItem } from "@/utils/common/safeStorage";

export type V34BgSpeed = "slow" | "normal" | "fast";

export interface V34BgSettings {
  enabled: boolean;
  speed: V34BgSpeed;
}

export const V34_BG_SPEEDS: V34BgSpeed[] = ["slow", "normal", "fast"];
export const V34_BG_SPEED_FACTOR: Record<V34BgSpeed, number> = {
  slow: 0.5,
  normal: 1,
  fast: 2,
};

const ENABLED_KEY = "bpim2-v34-bg-enabled";
const SPEED_KEY = "bpim2-v34-bg-speed";
const SERVER_SNAPSHOT: V34BgSettings = { enabled: false, speed: "normal" };

const listeners = new Set<() => void>();
let cache: V34BgSettings | null = null;

// 未設定時は OS の「視差効果を減らす」に従い、有効化は明示的な操作に限る
function readSettings(): V34BgSettings {
  const storedEnabled = safeGetItem(ENABLED_KEY);
  const storedSpeed = safeGetItem(SPEED_KEY);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    enabled: storedEnabled === null ? !reduced : storedEnabled === "true",
    speed: V34_BG_SPEEDS.find((s) => s === storedSpeed) ?? "normal",
  };
}

function getSnapshot(): V34BgSettings {
  cache ??= readSettings();
  return cache;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/**
 * V34 テーマの背景アニメーション設定を localStorage に保存し、購読中の全コンポーネントへ反映する。
 *
 * @param patch - 変更する項目
 */
export function setV34BgSettings(patch: Partial<V34BgSettings>) {
  const next = { ...getSnapshot(), ...patch };
  cache = next;
  safeSetItem(ENABLED_KEY, String(next.enabled));
  safeSetItem(SPEED_KEY, next.speed);
  listeners.forEach((l) => l());
}

/**
 * V34 テーマの背景アニメーション設定（有効/無効・速度）を返す。
 *
 * @returns 現在の設定
 */
export function useV34BgSettings(): V34BgSettings {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}
