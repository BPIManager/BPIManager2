import { useSyncExternalStore } from "react";
import { safeGetItem, safeSetItem } from "@/utils/common/safeStorage";

export type ZinraiBgSpeed = "slow" | "normal" | "fast";

export interface ZinraiBgSettings {
  enabled: boolean;
  speed: ZinraiBgSpeed;
}

export const ZINRAI_BG_SPEEDS: ZinraiBgSpeed[] = ["slow", "normal", "fast"];
export const ZINRAI_BG_SPEED_FACTOR: Record<ZinraiBgSpeed, number> = {
  slow: 0.5,
  normal: 1,
  fast: 2,
};

const ENABLED_KEY = "bpim2-zinrai-bg-enabled";
const SPEED_KEY = "bpim2-zinrai-bg-speed";
const SERVER_SNAPSHOT: ZinraiBgSettings = { enabled: false, speed: "normal" };

const listeners = new Set<() => void>();
let cache: ZinraiBgSettings | null = null;

// 未設定時は OS の「視差効果を減らす」に従い、有効化は明示的な操作に限る
function readSettings(): ZinraiBgSettings {
  const storedEnabled = safeGetItem(ENABLED_KEY);
  const storedSpeed = safeGetItem(SPEED_KEY);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    enabled: storedEnabled === null ? !reduced : storedEnabled === "true",
    speed: ZINRAI_BG_SPEEDS.find((s) => s === storedSpeed) ?? "normal",
  };
}

function getSnapshot(): ZinraiBgSettings {
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
 * ZINRAI テーマの背景アニメーション設定を localStorage に保存し、購読中の全コンポーネントへ反映する。
 *
 * @param patch - 変更する項目
 */
export function setZinraiBgSettings(patch: Partial<ZinraiBgSettings>) {
  const next = { ...getSnapshot(), ...patch };
  cache = next;
  safeSetItem(ENABLED_KEY, String(next.enabled));
  safeSetItem(SPEED_KEY, next.speed);
  listeners.forEach((l) => l());
}

/**
 * ZINRAI テーマの背景アニメーション設定（有効/無効・速度）を返す。
 *
 * @returns 現在の設定
 */
export function useZinraiBgSettings(): ZinraiBgSettings {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}
