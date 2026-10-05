/**
 * `"217 91% 60%"` のような shadcn 形式の HSL 値（カンマ無し・度/％）を `#rrggbb` に変換する。
 *
 * @param hsl - `H S% L%` 形式の文字列
 * @returns `#rrggbb`。解釈できない場合は null
 */
export function hslTripletToHex(hsl: string): string | null {
  const m = hsl.trim().match(/^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) return null;
  const h = (((Number(m[1]) % 360) + 360) % 360) / 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const channel = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
