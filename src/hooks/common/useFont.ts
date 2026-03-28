import type { FontId, FontDef } from "@/types/ui/font";

export const FONTS: FontDef[] = [
  {
    id: "default",
    label: "ブラウザ設定",
    googleParam: null,
    cssFamily:
      "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    id: "mplus",
    label: "M PLUS Rounded 1c",
    googleParam: "family=M+PLUS+Rounded+1c:wght@400;500;700",
    cssFamily: "'M PLUS Rounded 1c', sans-serif",
  },
  {
    id: "sawarabi-mincho",
    label: "さわらび明朝",
    googleParam: "family=Sawarabi+Mincho",
    cssFamily: "'Sawarabi Mincho', serif",
  },
  {
    id: "sawarabi-gothic",
    label: "さわらびゴシック",
    googleParam: "family=Sawarabi+Gothic",
    cssFamily: "'Sawarabi Gothic', sans-serif",
  },
  {
    id: "noto-sans-jp",
    label: "Noto Sans JP",
    googleParam: "family=Noto+Sans+JP:wght@400;500;700",
    cssFamily: "'Noto Sans JP', sans-serif",
  },
];

export const FONT_STORAGE_KEY = "bpim2-font";
export const DEFAULT_FONT: FontId = "default";

/**
 * localStorage に保存されたフォント ID を返す。
 * 未保存または無効な値の場合は {@link DEFAULT_FONT} を返す。
 *
 * @returns 保存済みフォント ID
 */
export function getStoredFont(): FontId {
  if (typeof window === "undefined") return DEFAULT_FONT;
  const v = localStorage.getItem(FONT_STORAGE_KEY);
  if (v && FONTS.find((f) => f.id === v)) return v as FontId;
  return DEFAULT_FONT;
}

function getLinkId(fontId: FontId) {
  return `bpim2-gfont-${fontId}`;
}

function loadGoogleFont(def: FontDef) {
  if (!def.googleParam) return;
  const id = getLinkId(def.id);
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${def.googleParam}&display=swap`;
  document.head.appendChild(link);
}

/**
 * 指定フォントを `--bpim-font-family` CSS カスタムプロパティに適用し、
 * 必要に応じて Google Fonts を動的にロードして localStorage に保存する。
 *
 * @param id - 適用するフォント ID
 */
export function applyFont(id: FontId) {
  const def = FONTS.find((f) => f.id === id)!;
  loadGoogleFont(def);
  document.documentElement.style.setProperty("--bpim-font-family", def.cssFamily);
  localStorage.setItem(FONT_STORAGE_KEY, id);
}
