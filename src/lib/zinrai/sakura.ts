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
    { x: w * 0.08, y: h * 0.92, r: base * 0.42 },
    { x: w * 0.97, y: h * 0.06, r: base * 0.3 },
    { x: w * 0.55, y: h * 1.02, r: base * 0.18 },
  ];
  ctx.clearRect(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let density = 0;
      for (const b of blobs) {
        const d = Math.hypot(x - b.x, (y - b.y) * 1.1) / b.r;
        if (d < 1) density = Math.max(density, (1 - d) * 1.4);
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
