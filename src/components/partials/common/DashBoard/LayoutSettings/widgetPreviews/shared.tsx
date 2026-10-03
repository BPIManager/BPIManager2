

export const P = "hsl(var(--bpim-primary))";
export const M = "hsl(var(--bpim-text-muted))";
export const S = "hsl(var(--bpim-success))";
export const D = "hsl(var(--bpim-danger))";

export function MiniPreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-14 h-9 shrink-0 overflow-hidden rounded-sm border border-bpim-border/40 bg-bpim-overlay/10">
      {children}
    </div>
  );
}

export function RadarPreviewSvgContent() {
  const cx = 28,
    cy = 18,
    r = 13;
  const angles = [0, 1, 2, 3, 4, 5].map((i) => ((i * 60 - 90) * Math.PI) / 180);
  const outer = angles.map((a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  const ratios = [0.8, 0.6, 0.9, 0.7, 0.5, 0.85];
  const data = angles.map((a, i) => [
    cx + ratios[i] * r * Math.cos(a),
    cy + ratios[i] * r * Math.sin(a),
  ]);
  const toD = (pts: number[][]) =>
    pts
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`,
      )
      .join(" ") + "Z";
  return (
    <>
      {outer.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p[0]}
          y2={p[1]}
          stroke={M}
          strokeOpacity={0.3}
          strokeWidth="0.5"
        />
      ))}
      <path
        d={toD(outer)}
        fill="none"
        stroke={M}
        strokeOpacity={0.3}
        strokeWidth="0.5"
      />
      <path
        d={toD(data)}
        fill={P}
        fillOpacity={0.2}
        stroke={P}
        strokeOpacity={0.85}
        strokeWidth="1"
      />
    </>
  );
}

export const ACTIVITY_GRID: number[][] = [
  [0, 2, 0, 3, 1, 0, 2, 4, 0, 1],
  [1, 0, 3, 1, 2, 0, 0, 2, 3, 0],
  [0, 1, 1, 4, 0, 3, 2, 0, 1, 2],
  [2, 0, 0, 1, 3, 1, 0, 3, 0, 4],
];
export const ACT_OPACITY = [0.08, 0.25, 0.5, 0.75, 1] as const;

/**
 * ウィジェット並び替え設定画面(`LayoutSettings`)で各ウィジェットの
 * サムネイルとして表示する、ハードコードされたミニSVGプレビュー群。
 */
