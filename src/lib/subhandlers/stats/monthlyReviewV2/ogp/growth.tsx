


// 2カラムレイアウトの1カラム分の実幅(WIDTH - padding*2 - gap) / 2 と一致させ、
// svgの明示widthがflexのstretchを上書きして右側に余白ができるのを防ぐ
export const GROWTH_CHART_WIDTH = 528;

export const GROWTH_CHART_HEIGHT = 230;

// データラベル（数値バッジ）がチャート上端で切れないための上部の空き
export const GROWTH_CHART_LABEL_HEADROOM = 30;

/** BPI推移を単純な折れ線（塗りつぶしエリア付き）で描画する。satori制約はRadarPolygonChartと同じ */
export function GrowthChartBlock({
  history,
}: {
  history: { date: string; value: number }[];
}) {
  if (history.length < 2) return null;

  const values = history.map((h) => h.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = Math.max(0.01, maxVal - minVal);
  const drawableHeight = GROWTH_CHART_HEIGHT - GROWTH_CHART_LABEL_HEADROOM;
  const stepX = GROWTH_CHART_WIDTH / (history.length - 1);
  const points = history.map((h, i) => ({
    x: i * stepX,
    y:
      GROWTH_CHART_LABEL_HEADROOM +
      drawableHeight * (1 - (h.value - minVal) / range),
  }));
  const start = values[0];
  const end = values[values.length - 1];
  const diff = Math.round((end - start) * 100) / 100;
  // バッジ背景に16進のアルファ接尾辞(${accent}1f 等)を付けて使うため、
  // rgba()ではなくhexカラーで統一する
  const accent = diff > 0 ? "#34d399" : diff < 0 ? "#f87171" : "#94a3b8";
  const lineStr = points
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaStr = `0,${GROWTH_CHART_HEIGHT} ${lineStr} ${GROWTH_CHART_WIDTH},${GROWTH_CHART_HEIGHT}`;

  // データラベル: 0%(開始)・25%・50%・75%・100%(終了)地点を候補に、既に確定した
  // ラベルの横幅と重なるものは間引く（開始・終了は必ず両端固定で採用する）
  const estimateLabelWidth = (value: number) => value.toFixed(2).length * 8 + 16;
  const LABEL_GAP = 10;
  const startWidth = estimateLabelWidth(start);
  const endWidth = estimateLabelWidth(end);
  const occupied: [number, number][] = [
    [0, startWidth],
    [GROWTH_CHART_WIDTH - endWidth, GROWTH_CHART_WIDTH],
  ];
  const labels: {
    p: { x: number; y: number };
    value: number;
    style: React.CSSProperties;
  }[] = [
    { p: points[0], value: start, style: { left: 0 } },
    { p: points[points.length - 1], value: end, style: { right: 0 } },
  ];
  for (const fraction of [0.25, 0.5, 0.75]) {
    const idx = Math.round(fraction * (points.length - 1));
    if (idx <= 0 || idx >= points.length - 1) continue;
    const value = values[idx];
    const width = estimateLabelWidth(value);
    const left = points[idx].x - width / 2;
    const right = left + width;
    if (left < 0 || right > GROWTH_CHART_WIDTH) continue;
    const overlaps = occupied.some(
      ([a, b]) => !(right + LABEL_GAP <= a || left - LABEL_GAP >= b),
    );
    if (overlaps) continue;
    occupied.push([left, right]);
    labels.push({ p: points[idx], value, style: { left } });
  }

  // X軸の日付目盛り。0/25/50/75/100%地点を候補にラベル同士の重なりを避けつつ
  // 日付ラベル(単純なテキスト)専用に幅の見積もりをやり直す
  const formatTickDate = (dateStr: string) => {
    const [, m, d] = dateStr.split("-");
    return `${Number(m)}/${Number(d)}`;
  };
  const estimateTickWidth = (text: string) => text.length * 7 + 4;
  const dateOccupied: [number, number][] = [];
  const dateTicks: { left: number; text: string }[] = [];
  for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
    const idx = Math.round(fraction * (points.length - 1));
    const text = formatTickDate(history[idx].date);
    const width = estimateTickWidth(text);
    let left = points[idx].x - width / 2;
    left = Math.max(0, Math.min(left, GROWTH_CHART_WIDTH - width));
    const right = left + width;
    const overlaps = dateOccupied.some(
      ([a, b]) => !(right + LABEL_GAP <= a || left - LABEL_GAP >= b),
    );
    if (overlaps) continue;
    dateOccupied.push([left, right]);
    dateTicks.push({ left, text });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div
        style={{
          display: "flex",
          fontSize: 20,
          color: "rgba(255,255,255,0.4)",
          marginBottom: 8,
        }}
      >
        期間の総合BPI推移
      </div>
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          alignItems: "center",
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 6,
          paddingBottom: 6,
          marginBottom: 18,
          borderRadius: 999,
          background: `${accent}1f`,
          border: `1px solid ${accent}59`,
          fontSize: 22,
          fontWeight: 700,
          color: accent,
        }}
      >
        {diff >= 0 ? "+" : ""}
        {diff.toFixed(2)}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            width: GROWTH_CHART_WIDTH,
            height: GROWTH_CHART_HEIGHT,
          }}
        >
          <svg
            width={GROWTH_CHART_WIDTH}
            height={GROWTH_CHART_HEIGHT}
            viewBox={`0 0 ${GROWTH_CHART_WIDTH} ${GROWTH_CHART_HEIGHT}`}
            style={{ position: "absolute", left: 0, top: 0 }}
          >
            <polygon points={areaStr} fill={`${accent}26`} />
            <polyline
              points={lineStr}
              fill="none"
              stroke={accent}
              strokeWidth={3}
            />
            {[points[0], points[points.length - 1]].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={5} fill={accent} />
            ))}
          </svg>
          {labels.map(({ p, value, style }, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                display: "flex",
                top: p.y - 30,
                ...style,
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 3,
                paddingBottom: 3,
                borderRadius: 6,
                background: "rgba(8,8,14,0.85)",
                border: `1px solid ${accent}66`,
                fontSize: 13,
                fontWeight: 700,
                color: accent,
              }}
            >
              {value.toFixed(2)}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            width: GROWTH_CHART_WIDTH,
            height: 20,
            marginTop: 8,
          }}
        >
          {dateTicks.map(({ left, text }, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                display: "flex",
                left,
                top: 0,
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
