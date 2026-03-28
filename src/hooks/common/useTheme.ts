import type { ThemeId, ThemeDef } from "@/types/ui/theme";

export const THEMES: ThemeDef[] = [
  {
    id: "dark-blue",
    label: "Dark Blue",
    mode: "dark",
    accent: "blue",
    preview: {
      bg: "#060d1a",
      surface: "#0d1a2e",
      primary: "#3b82f6",
      text: "#e2e8f0",
    },
  },
  {
    id: "dark-green",
    label: "Dark Green",
    mode: "dark",
    accent: "green",
    preview: {
      bg: "#050f0a",
      surface: "#0a1f12",
      primary: "#22c55e",
      text: "#dcfce7",
    },
  },
  {
    id: "dark-red",
    label: "Dark Red",
    mode: "dark",
    accent: "red",
    preview: {
      bg: "#130608",
      surface: "#220a0c",
      primary: "#ef4444",
      text: "#fee2e2",
    },
  },
  {
    id: "dark-orange",
    label: "Dark Orange",
    mode: "dark",
    accent: "orange",
    preview: {
      bg: "#120800",
      surface: "#1f1000",
      primary: "#f97316",
      text: "#ffedd5",
    },
  },
  {
    id: "dark-yellow",
    label: "Dark Yellow",
    mode: "dark",
    accent: "yellow",
    preview: {
      bg: "#0f0c00",
      surface: "#1c1600",
      primary: "#eab308",
      text: "#fef9c3",
    },
  },
  {
    id: "dark-purple",
    label: "Dark Purple",
    mode: "dark",
    accent: "purple",
    preview: {
      bg: "#0b0714",
      surface: "#160d26",
      primary: "#a855f7",
      text: "#f3e8ff",
    },
  },
  {
    id: "dark-pink",
    label: "Dark Pink",
    mode: "dark",
    accent: "pink",
    preview: {
      bg: "#130510",
      surface: "#220a1e",
      primary: "#ec4899",
      text: "#fce7f3",
    },
  },
  {
    id: "dark-cyan",
    label: "Dark Cyan",
    mode: "dark",
    accent: "cyan",
    preview: {
      bg: "#030f12",
      surface: "#071d22",
      primary: "#06b6d4",
      text: "#cffafe",
    },
  },
  {
    id: "dark-abyss",
    label: "Abyss",
    mode: "dark",
    accent: "indigo",
    preview: {
      bg: "linear-gradient(135deg, #000010 0%, #05003a 50%, #0a0060 100%)",
      surface: "#08004a",
      primary: "#6644ff",
      text: "#eef0ff",
    },
  },
  {
    id: "dark-midnight",
    label: "RGB Midnight",
    mode: "dark",
    accent: "violet",
    preview: {
      bg: "linear-gradient(135deg, #0a0010 0%, #200040 50%, #0d003a 100%)",
      surface: "#1a0038",
      primary: "#ee00ff",
      text: "#f5e0ff",
    },
  },
  {
    id: "dark-forest",
    label: "Dark Forest",
    mode: "dark",
    accent: "emerald",
    preview: {
      bg: "linear-gradient(135deg, #000a04 0%, #001a08 50%, #002e10 100%)",
      surface: "#002010",
      primary: "#00ff70",
      text: "#ccffe0",
    },
  },
  {
    id: "dark-ember",
    label: "Ember",
    mode: "dark",
    accent: "orange-red",
    preview: {
      bg: "linear-gradient(135deg, #120000 0%, #2a0400 50%, #180800 100%)",
      surface: "#2a0600",
      primary: "#ff5500",
      text: "#ffe0cc",
    },
  },
  {
    id: "dark-onsen",
    label: "Onsen",
    mode: "dark",
    accent: "onsen",
    preview: {
      bg: "linear-gradient(135deg, #040d0e 0%, #071618 50%, #0a1e20 100%)",
      surface: "#0c2022",
      primary: "#a8e6a3",
      text: "#e8f5e4",
    },
  },
  {
    id: "light-blue",
    label: "Light Blue",
    mode: "light",
    accent: "blue",
    preview: {
      bg: "#f0f4ff",
      surface: "#ffffff",
      primary: "#2563eb",
      text: "#1e293b",
    },
  },
  {
    id: "light-green",
    label: "Light Green",
    mode: "light",
    accent: "green",
    preview: {
      bg: "#f0fdf4",
      surface: "#ffffff",
      primary: "#16a34a",
      text: "#14532d",
    },
  },
  {
    id: "light-rose",
    label: "Light Rose",
    mode: "light",
    accent: "rose",
    preview: {
      bg: "#fff1f2",
      surface: "#ffffff",
      primary: "#e11d48",
      text: "#4c0519",
    },
  },
  {
    id: "light-purple",
    label: "Light Purple",
    mode: "light",
    accent: "purple",
    preview: {
      bg: "#faf5ff",
      surface: "#ffffff",
      primary: "#9333ea",
      text: "#3b0764",
    },
  },
];

export const STORAGE_KEY = "bpim2-theme";
export const DEFAULT_THEME: ThemeId = "dark-blue";

/**
 * localStorage に保存されたテーマ ID を返す。
 * 未保存または無効な値の場合は {@link DEFAULT_THEME} を返す。
 *
 * @returns 保存済みテーマ ID
 */
export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v && THEMES.find((t) => t.id === v)) return v as ThemeId;
  return DEFAULT_THEME;
}

/**
 * 指定テーマを `<html>` 要素に適用し、localStorage に保存する。
 *
 * @param id - 適用するテーマ ID
 */
export function applyTheme(id: ThemeId) {
  const html = document.documentElement;
  const def = THEMES.find((t) => t.id === id)!;

  html.classList.remove("dark", "light");
  html.classList.add(def.mode);

  html.setAttribute("data-theme", id);

  localStorage.setItem(STORAGE_KEY, id);
}
