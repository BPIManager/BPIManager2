/** リングの中心（画面に対する比率）。ゲーム画面と同じく左上寄りに置く */
export const RING_CENTER = { x: 0.2, y: 0.3 };

export interface Ring {
  /** 中心から最遠の画面角までの距離を 1 とした半径 */
  radius: number;
  arcs: [start: number, length: number][];
  speed: number;
  rotation: number;
  color: string;
  /** 基準画面（短辺 REFERENCE_SIZE px）での線幅 */
  width: number;
  dash: number[];
}

const REFERENCE_SIZE = 900;
const MIN_WIDTH_SCALE = 0.6;
const MAX_WIDTH_SCALE = 1.6;
const MIN_GAP = 0.01;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// 色が付くのはリングのみ。黒・灰色が主体で、シアンを混ぜ、赤・黄はごく稀にする
function pickStyle(): Pick<Ring, "color" | "width" | "dash"> {
  const k = Math.random();
  if (k < 0.22) return { color: "rgba(18,21,26,.55)", width: rand(3, 6), dash: [] };
  if (k < 0.45) return { color: "rgba(0,180,240,.55)", width: rand(2, 5), dash: [] };
  if (k < 0.6) return { color: "rgba(90,98,108,.45)", width: rand(6, 10), dash: [2, 3] };
  if (k < 0.66) return { color: "rgba(229,50,45,.7)", width: rand(2, 3), dash: [] };
  if (k < 0.71) return { color: "rgba(242,196,0,.75)", width: rand(2, 3), dash: [] };
  return { color: "rgba(120,128,138,.35)", width: rand(1, 2), dash: [] };
}

/**
 * 同心円リングを作る。半径・線幅は画面サイズに依存しない値で持ち、描画時に拡縮するため、
 * 画面サイズが変わってもリングの配置は保たれる。
 *
 * @param sparse - true のときリング数を減らす（小画面向け）
 */
export function createRings(sparse: boolean): Ring[] {
  const stretch = sparse ? 1.7 : 1;
  const rings: Ring[] = [];
  // リング間隔は半径に比例させ、中心付近は密に、外側ほど疎にする
  for (let r = 0.03; r < 1; r += Math.max(MIN_GAP, r * rand(0.2, 0.4) * stretch)) {
    const arcs: Ring["arcs"] = [];
    let angle = rand(0, Math.PI * 2);
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const length = rand(0.6, 2.6);
      arcs.push([angle, length]);
      angle += length + rand(0.3, 1.1);
    }
    rings.push({
      radius: r,
      arcs,
      speed: rand(-0.2, 0.2),
      rotation: rand(0, Math.PI * 2),
      ...pickStyle(),
    });
  }
  return rings;
}

/**
 * リングを画面サイズに合わせて拡縮して描画する。最外のリングが最遠の画面角に届く。
 *
 * @param time - 経過時間（速度倍率を掛けた累積秒）
 */
export function drawRings(
  ctx: CanvasRenderingContext2D,
  rings: Ring[],
  w: number,
  h: number,
  time: number,
) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * RING_CENTER.x;
  const cy = h * RING_CENTER.y;
  const maxRadius = Math.hypot(w - cx, h - cy);
  const widthScale = Math.min(
    MAX_WIDTH_SCALE,
    Math.max(MIN_WIDTH_SCALE, Math.min(w, h) / REFERENCE_SIZE),
  );
  for (const ring of rings) {
    ctx.lineWidth = ring.width * widthScale;
    ctx.strokeStyle = ring.color;
    ctx.setLineDash(ring.dash.map((d) => d * widthScale));
    const offset = ring.rotation + time * ring.speed;
    for (const [start, length] of ring.arcs) {
      ctx.beginPath();
      ctx.arc(cx, cy, ring.radius * maxRadius, offset + start, offset + start + length);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
}
