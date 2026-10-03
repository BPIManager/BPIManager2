


export const RADAR_SIZE = 316;

export const RADAR_RADIUS = 111;

export const RADAR_LABEL_RADIUS = RADAR_RADIUS + 30;

export const RADAR_PAD_X = 52;

export const RADAR_PAD_Y = 10;

/**
 * 要素別BPI（最終状態）をレーダーチャート（多角形）として描画する。satori は svg 内の text 未対応のため、ラベルは外側に絶対配置した div で重ねる。
 */
export function RadarPolygonChart({
  entries,
}: {
  entries: { element: string; bpiEnd: number }[];
}) {
  if (entries.length < 3) return null;

  const n = entries.length;
  const center = RADAR_SIZE / 2;
  // 固定の床（-15）だと全点が外周に固まり得意要素が見えにくいため、実際の最小値の少し下を床にして凹凸を強調する。
  const values = entries.map((e) => e.bpiEnd);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const floor = minVal - Math.max(2, (maxVal - minVal) * 0.15 || 2);
  const range = Math.max(1, maxVal - floor);
  const bestElement = entries[values.indexOf(maxVal)]?.element;
  const angleOf = (i: number) => -Math.PI / 2 + i * ((2 * Math.PI) / n);
  const pointAt = (i: number, radius: number) => {
    const a = angleOf(i);
    return {
      x: center + radius * Math.cos(a),
      y: center + radius * Math.sin(a),
    };
  };
  const polygonAt = (ratio: number) =>
    Array.from({ length: n }, (_, i) => pointAt(i, ratio * RADAR_RADIUS))
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
  const dataPoints = entries.map((e, i) =>
    pointAt(
      i,
      Math.max(0, Math.min(1, (e.bpiEnd - floor) / range)) * RADAR_RADIUS,
    ),
  );
  const dataPointsStr = dataPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: RADAR_SIZE + RADAR_PAD_X * 2,
        height: RADAR_SIZE + RADAR_PAD_Y * 2,
      }}
    >
      <svg
        width={RADAR_SIZE}
        height={RADAR_SIZE}
        viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
        style={{ position: "absolute", left: RADAR_PAD_X, top: RADAR_PAD_Y }}
      >
        {[0.33, 0.66, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={polygonAt(ratio)}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />
        ))}
        {entries.map((e, i) => {
          const p = pointAt(i, RADAR_RADIUS);
          return (
            <line
              key={e.element}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          );
        })}
        <polygon
          points={dataPointsStr}
          fill="rgba(56,189,248,0.28)"
          stroke="#38bdf8"
          strokeWidth={2}
        />
        {dataPoints.map((p, i) => (
          <circle
            key={entries[i].element}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill="#38bdf8"
          />
        ))}
      </svg>
      {entries.map((e, i) => {
        const p = pointAt(i, RADAR_LABEL_RADIUS);
        const lx = RADAR_PAD_X + p.x;
        const ly = RADAR_PAD_Y + p.y;
        const isBest = e.element === bestElement;
        return (
          <div
            key={e.element}
            style={{
              position: "absolute",
              left: lx - 34,
              top: ly - 14,
              width: 68,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 13,
                fontWeight: 700,
                color: isBest ? "#fbbf24" : "rgba(255,255,255,0.6)",
              }}
            >
              {e.element}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 12,
                fontWeight: isBest ? 700 : 400,
                color: isBest ? "#fbbf24" : "#38bdf8",
              }}
            >
              {e.bpiEnd.toFixed(1)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RadarBlock({
  topRadar,
}: {
  topRadar: { element: string; bpiEnd: number }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div
        style={{
          display: "flex",
          fontSize: 20,
          color: "rgba(255,255,255,0.4)",
          marginBottom: 26,
        }}
      >
        ノーツレーダー
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <RadarPolygonChart entries={topRadar} />
      </div>
    </div>
  );
}
