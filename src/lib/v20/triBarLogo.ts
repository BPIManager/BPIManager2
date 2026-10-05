export interface TriBarPixel {
  x: number;
  y: number;
  color: string;
}

/** ロゴのドット絵グリッド一辺のドット数（16px表示で1ドット=1pxになる） */
export const TRI_BAR_LOGO_GRID = 16;

// BPIM の4本バーに対応する棒（赤・黄・青・黒）。幅は3ドット・間隔1ドット
const BARS = [
  { height: 14, color: "#E5322D" },
  { height: 10, color: "#F2C400" },
  { height: 7, color: "#1F63C6" },
  { height: 4, color: "#2A2F36" },
];
const BAR_WIDTH = 3;
const BAR_STRIDE = 4;
const STRIPE_EVERY = 3;
const STRIPE_LIGHTEN = 0.35;

const parseHex = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function lighten(hex: string, ratio: number): string {
  const rgb = parseHex(hex).map((v) => Math.round(v + (255 - v) * ratio));
  return `#${rgb.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function buildPixels(): TriBarPixel[] {
  const pixels: TriBarPixel[] = [];
  BARS.forEach(({ height, color }, i) => {
    for (let r = 0; r < height; r++) {
      // 横縞のドットで tricoro のロゴ文字の質感を出す
      const rowColor =
        r % STRIPE_EVERY === STRIPE_EVERY - 1
          ? lighten(color, STRIPE_LIGHTEN)
          : color;
      for (let c = 0; c < BAR_WIDTH; c++) {
        pixels.push({
          x: i * BAR_STRIDE + c,
          y: TRI_BAR_LOGO_GRID - height + r,
          color: rowColor,
        });
      }
    }
  });
  return pixels;
}

export const TRI_BAR_LOGO_PIXELS: TriBarPixel[] = buildPixels();

/** ファビコン用に、トリコロールのバーロゴを単体のSVG文字列として返す */
export function triBarLogoSvgString(): string {
  const rects = TRI_BAR_LOGO_PIXELS.map(
    (p) =>
      `<rect x="${p.x}" y="${p.y}" width="1.02" height="1.02" fill="${p.color}"/>`,
  ).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TRI_BAR_LOGO_GRID} ${TRI_BAR_LOGO_GRID}" shape-rendering="crispEdges">` +
    `${rects}</svg>`
  );
}
