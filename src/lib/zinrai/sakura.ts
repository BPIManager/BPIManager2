/** 背景キャンバスの1論理ピクセルあたりのCSSピクセル数（ドット絵の粗さ） */
export const PIXEL_SIZE = 4;

const BLOSSOM_COLORS = ["#E040C0", "#FF7FDF", "#FFB3EC", "#7A2BD6"];

/** 画面の隅にディザ状のピクセル桜の塊を描く */
export function drawBlossoms(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const base = Math.min(w, h);
  const blobs = [
    { x: w * 0.08, y: h * 0.92, r: base * 0.32 },
    { x: w * 0.97, y: h * 0.06, r: base * 0.22 },
    { x: w * 0.55, y: h * 1.02, r: base * 0.14 },
  ];
  ctx.clearRect(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let density = 0;
      for (const b of blobs) {
        const d = Math.hypot(x - b.x, (y - b.y) * 1.1) / b.r;
        if (d < 1) density = Math.max(density, (1 - d) * 1.1);
      }
      if (density <= 0 || Math.random() >= Math.min(0.95, density)) continue;
      const k = Math.random();
      ctx.fillStyle =
        k < 0.45
          ? BLOSSOM_COLORS[0]
          : k < 0.75
            ? BLOSSOM_COLORS[1]
            : k < 0.93
              ? BLOSSOM_COLORS[2]
              : BLOSSOM_COLORS[3];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

const PETAL_SPRITES = [
  ["#.#", "###", ".#."],
  ["##.##", "#####", ".###.", "..#.."],
  ["##.#.##", "#######", ".#####.", "..###.."],
];
const PETAL_COLORS = ["#E040C0", "#FF7FDF", "#FFB3EC"];
const rand = (min: number, max: number) => min + Math.random() * (max - min);

export interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  sway: number;
  sprite: number;
  color: string;
}

function createPetal(w: number, h: number, scatter: boolean): Petal {
  const r = Math.random();
  return {
    x: rand(-20, w + 20),
    y: scatter ? rand(-10, h) : rand(-20, -4),
    vx: rand(0.06, 0.22),
    vy: rand(0.12, 0.35),
    phase: rand(0, Math.PI * 2),
    sway: rand(0.2, 0.6),
    sprite: r < 0.5 ? 0 : r < 0.85 ? 1 : 2,
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
  };
}

/** 初期配置で画面全体に散らした桜の花びらを作る */
export function createPetals(w: number, h: number, count: number): Petal[] {
  return Array.from({ length: count }, () => createPetal(w, h, true));
}

/**
 * 花びらを1フレーム分進め、画面外へ出たものは上端から再投入する。
 *
 * @param speed - 速度倍率
 * @param dt - 60fps を 1 とした経過フレーム数
 */
export function stepPetals(
  petals: Petal[],
  w: number,
  h: number,
  speed: number,
  dt: number,
) {
  for (const p of petals) {
    p.phase += 0.03 * speed * dt;
    p.x += (p.vx + Math.sin(p.phase) * p.sway) * speed * dt;
    p.y += p.vy * 1.6 * speed * dt;
    if (p.y > h + 6 || p.x > w + 10) {
      Object.assign(p, createPetal(w, h, false), { x: rand(-30, w) });
    }
  }
}

export function drawPetals(
  ctx: CanvasRenderingContext2D,
  petals: Petal[],
  w: number,
  h: number,
) {
  ctx.clearRect(0, 0, w, h);
  for (const p of petals) {
    ctx.fillStyle = p.color;
    PETAL_SPRITES[p.sprite].forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] === "#") {
          ctx.fillRect(Math.round(p.x) + c, Math.round(p.y) + r, 1, 1);
        }
      }
    });
  }
}

export interface GlitchBar {
  x: number;
  y: number;
  h: number;
  color: string;
  alpha: number;
}

/** グリッチ1回分の、シアン/マゼンタの細い横帯を1〜2本作る */
export function createGlitchBars(h: number): GlitchBar[] {
  return Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () => ({
    x: Math.round(rand(-3, 3)),
    y: Math.round(rand(0, h)),
    h: Math.max(1, Math.round(rand(0.003, 0.01) * h)),
    color: Math.random() < 0.5 ? "#00E5FF" : "#FF2BD6",
    alpha: rand(0.06, 0.14),
  }));
}

export function drawGlitchBars(
  ctx: CanvasRenderingContext2D,
  bars: GlitchBar[],
  w: number,
) {
  for (const b of bars) {
    ctx.globalAlpha = b.alpha;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, w, b.h);
  }
  ctx.globalAlpha = 1;
}
