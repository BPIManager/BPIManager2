import { useEffect, useState } from "react";

const getCssVar = (name: string): string => {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
};

const toHsl = (raw: string): string =>
  raw.startsWith("hsl") ? raw : `hsl(${raw})`;

const parseHsl = (hsl: string) => {
  const m = hsl.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!m) return null;
  return { h: +m[1], s: +m[2], l: +m[3] };
};

const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
};

const toRgba = (hsl: string, opacity: number): string => {
  const parsed = parseHsl(hsl);
  if (!parsed) return `rgba(128,128,128,${opacity})`;
  const { r, g, b } = hslToRgb(parsed.h, parsed.s, parsed.l);
  return `rgba(${r},${g},${b},${opacity})`;
};

/** チャート描画に使用するテーマカラーのセット */
export interface ChartColors {
  /** プライマリカラー（HSL 文字列） */
  primary: string;
  /** 警告色（HSL 文字列） */
  warning: string;
  /** 成功色（HSL 文字列） */
  success: string;
  /** 危険色（HSL 文字列） */
  danger: string;
  /** ミュートテキスト色（HSL 文字列） */
  muted: string;
  /** グリッド線色（HSL 文字列） */
  grid: string;
  /** 背景色（HSL 文字列） */
  surface: string;
  /** オーバーレイ色（HSL 文字列） */
  overlay: string;
  /** プライマリカラーを指定透明度の rgba 文字列に変換する関数 */
  primaryRgba: (opacity: number) => string;
  /** 警告色を指定透明度の rgba 文字列に変換する関数 */
  warningRgba: (opacity: number) => string;
  /** ミュート色を指定透明度の rgba 文字列に変換する関数 */
  mutedRgba: (opacity: number) => string;
}

/**
 * CSS カスタムプロパティからチャート用カラーパレットを読み取り、
 * テーマ変更を監視して自動更新するフック。
 *
 * @returns 現在のテーマに対応した {@link ChartColors} オブジェクト
 */
export const useChartColors = (): ChartColors => {
  const read = (): ChartColors => {
    const primary = toHsl(getCssVar("--bpim-primary"));
    const warning = toHsl(getCssVar("--bpim-warning"));
    const muted = toHsl(getCssVar("--bpim-text-muted"));
    return {
      primary,
      warning,
      success: toHsl(getCssVar("--bpim-success")),
      danger: toHsl(getCssVar("--bpim-danger")),
      muted,
      grid: toHsl(getCssVar("--bpim-chart-grid")),
      surface: toHsl(getCssVar("--bpim-bg")),
      overlay: toHsl(getCssVar("--bpim-overlay")),
      primaryRgba: (op) => toRgba(primary, op),
      warningRgba: (op) => toRgba(warning, op),
      mutedRgba: (op) => toRgba(muted, op),
    };
  };

  const [colors, setColors] = useState<ChartColors>(read);

  useEffect(() => {
    setColors(read());
    const observer = new MutationObserver(() => setColors(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return colors;
};
