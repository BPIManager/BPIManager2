export type ThemeId = "dark-blue" | "dark-green" | "light-blue" | "light-green";

export interface ThemeDef {
  id: ThemeId;
  label: string;
  mode: "dark" | "light";
  accent: "blue" | "green";
  preview: {
    bg: string;
    surface: string;
    primary: string;
    text: string;
  };
}

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
];

export const STORAGE_KEY = "bpim2-theme";
export const DEFAULT_THEME: ThemeId = "dark-blue";

export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v && THEMES.find((t) => t.id === v)) return v as ThemeId;
  return DEFAULT_THEME;
}

export function applyTheme(id: ThemeId) {
  const html = document.documentElement;
  const def = THEMES.find((t) => t.id === id)!;

  html.classList.remove("dark", "light");
  html.classList.add(def.mode);

  html.setAttribute("data-theme", id);

  localStorage.setItem(STORAGE_KEY, id);
}
