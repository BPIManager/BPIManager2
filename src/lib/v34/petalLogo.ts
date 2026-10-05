export interface PetalPixel {
  x: number;
  y: number;
  color: string;
}

/** ロゴのドット絵グリッド一辺のドット数（16px表示で1ドット=1pxになる） */
export const PETAL_LOGO_GRID = 16;

// 下（濃い紫）→ 上（薄いピンク）のグラデーション停止点
const GRADIENT_STOPS: [number, string][] = [
  [0, "#8B2FD0"],
  [0.35, "#C926AA"],
  [0.65, "#FF4FD8"],
  [1, "#FFB3EC"],
];
// BPIM の4本バーに対応する花びらの高さ。幅は3ドット・間隔1ドット
const PETAL_HEIGHTS = [14, 10, 7, 4];
const PETAL_WIDTH = 3;
const PETAL_STRIDE = 4;

const parseHex = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function gradientColor(t: number): string {
  const v = Math.min(1, Math.max(0, t));
  const idx = GRADIENT_STOPS.findIndex(([stop]) => v <= stop);
  const [t0, c0] = GRADIENT_STOPS[Math.max(0, idx - 1)];
  const [t1, c1] = GRADIENT_STOPS[Math.max(1, idx)];
  const k = (v - t0) / (t1 - t0);
  const a = parseHex(c0);
  const b = parseHex(c1);
  const rgb = a.map((from, j) => Math.round(from + (b[j] - from) * k));
  return `#${rgb.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

// 先端に1ドットの切れ込み、下2段をすぼめて花びら形にする
function petalRow(row: number, height: number): string {
  if (row === 0 && height >= 5) return "#.#";
  if (row >= height - 2 && height >= 7) return ".#.";
  return "###";
}

function buildPixels(): PetalPixel[] {
  const pixels: PetalPixel[] = [];
  PETAL_HEIGHTS.forEach((height, i) => {
    for (let r = 0; r < height; r++) {
      const shape = petalRow(r, height);
      const fade = (r / (height - 1)) * 0.9 * (1 - i * 0.12);
      const color = gradientColor(1 - fade - (i === 1 ? 0 : 0.1));
      for (let c = 0; c < PETAL_WIDTH; c++) {
        if (shape[c] !== "#") continue;
        pixels.push({
          x: i * PETAL_STRIDE + c,
          y: PETAL_LOGO_GRID - height + r,
          color,
        });
      }
    }
  });
  return pixels;
}

export const PETAL_LOGO_PIXELS: PetalPixel[] = buildPixels();

/** ファビコン用に、花びらロゴを単体のSVG文字列として返す */
export function petalLogoSvgString(): string {
  const rects = PETAL_LOGO_PIXELS.map(
    (p) =>
      `<rect x="${p.x}" y="${p.y}" width="1.02" height="1.02" fill="${p.color}"/>`,
  ).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PETAL_LOGO_GRID} ${PETAL_LOGO_GRID}" shape-rendering="crispEdges">` +
    `${rects}</svg>`
  );
}
