import { readFileSync } from "fs";
import path from "path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { BpiCalculator } from "@/lib/bpi";
import { usersRepo } from "@/lib/db/domains/users";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { buildRadarGrowth } from "@/lib/monthly-review/radar";
import { buildArena } from "@/lib/monthly-review/arena";
import { periodHeadingOf } from "@/lib/monthly-review/period";
import { getRankDetail } from "@/constants/iidx/rankBorders";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { ARENA_CLASS_STYLES } from "@/constants/iidx/arenaRankStyles";
import {
  DEFAULT_OGP_SECTIONS,
  type OgpSectionKey,
} from "@/lib/monthly-review/ogpSections";
import type { ArenaVersionHistoryEntry } from "@/types/stats/monthlyReview";
import {
  resolveMonthlyReviewPeriod,
  computeOwnerBpiTimeline,
  computeOwnerMonthlyScores,
  computeOwnerTopSongs,
  previousVersionOf,
} from "./_shared";

const WIDTH = 1200;
const HEIGHT = 630;
const TOP_SONGS_COUNT = 5;
const RADAR_ELEMENTS_COUNT = 6;
/** アリーナ戦績ブロックの過去バージョン履歴の表示件数（現在バージョン分は別枠） */
const ARENA_HISTORY_COUNT = 3;

let regularFontCache: Buffer | null = null;
let boldFontCache: Buffer | null = null;

/** satoriはWOFF2非対応・TTF/OTFのみ扱えるため、バンドル済みの静的インスタンス(可変フォントではない)を使う */
function loadFont(weight: "regular" | "bold"): Buffer {
  if (weight === "bold") {
    if (!boldFontCache) {
      boldFontCache = readFileSync(
        path.join(process.cwd(), "src/assets/fonts/NotoSansJP-Bold.ttf"),
      );
    }
    return boldFontCache;
  }
  if (!regularFontCache) {
    regularFontCache = readFileSync(
      path.join(process.cwd(), "src/assets/fonts/NotoSansJP-Regular.ttf"),
    );
  }
  return regularFontCache;
}

/**
 * satoriはSVGパーサーが弱く、dicebearのSVGアバター(identicon等)を読み込めない
 * （実機確認: "Failed to parse SVG image"で画像だけ無言で欠落する）ため、
 * dicebear URLに限りPNG形式へ変換する
 */
function toSatoriSafeImageUrl(url: string): string {
  if (url.includes("api.dicebear.com") && url.includes("/svg")) {
    return url.replace("/svg", "/png");
  }
  return url;
}

/** TopSongsSection/ScoreSublineと同じロジック（AAA以上はAAA+n、それ未満は現ランク+n） */
function scoreLabelOf(exScore: number, notes: number): string {
  const maxEx = notes * 2;
  const aboveAaa = exScore - Math.ceil(maxEx * (8 / 9));
  if (aboveAaa >= 0) return `AAA+${aboveAaa}`;
  const rd = getRankDetail(exScore, maxEx);
  return `${rd.label}+${rd.surplus}`;
}

const RADAR_SIZE = 316;
const RADAR_RADIUS = 111;
const RADAR_LABEL_RADIUS = RADAR_RADIUS + 30;
const RADAR_PAD_X = 52;
const RADAR_PAD_Y = 10;

/**
 * 現時点の要素別BPI（成長ではなく最終状態）をレーダーチャート（多角形）として描画する。
 * satoriは`<svg>`配下の基本図形（polygon/circle/line）はサポートするが`<text>`は
 * 未対応（実機確認: "please convert them to <path>"）のため、ラベルはsvgの外側に
 * 絶対配置したdivとして重ねる
 */
function RadarPolygonChart({
  entries,
}: {
  entries: { element: string; bpiEnd: number }[];
}) {
  if (entries.length < 3) return null;

  const n = entries.length;
  const center = RADAR_SIZE / 2;
  // 固定値(-15)を床にすると、実際の値が近い場合にどの要素が得意か見えづらい
  // （全点が外周付近に固まる）ため、実際の最小値の少し下を床にして、要素間の
  // 凹凸が視覚的に強調されるようにスケールする
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

// 2カラムレイアウトの1カラム分の実幅(WIDTH - padding*2 - gap) / 2 と一致させ、
// svgの明示widthがflexのstretchを上書きして右側に余白ができるのを防ぐ
const GROWTH_CHART_WIDTH = 528;
const GROWTH_CHART_HEIGHT = 230;
// データラベル（数値バッジ）がチャート上端で切れないための上部の空き
const GROWTH_CHART_LABEL_HEADROOM = 30;

function versionLabelOf(version: string): string {
  return version === "INF"
    ? "INF"
    : `IIDX ${getVersionNameFromNumber(version)}`;
}

/** バッジ背景に16進のアルファ接尾辞を付けて使うため、rgba()ではなくhexカラーで統一する */
function compareDiffColor(diff: number): string {
  return diff > 0 ? "#34d399" : diff < 0 ? "#f87171" : "#94a3b8";
}

/** TopSongsSectionと同じ配色・略記（H/A/L）。曲名の前に難易度バッジとして付ける */
const DIFF_COLORS: Record<string, string> = {
  HYPER: "#f59e0b",
  ANOTHER: "#ef4444",
  LEGGENDARIA: "#a855f7",
};
const DIFF_LABELS: Record<string, string> = {
  HYPER: "H",
  ANOTHER: "A",
  LEGGENDARIA: "L",
};

function TopSongsBlock({
  topSongs,
}: {
  topSongs: {
    songId: number;
    title: string;
    difficulty: string;
    bpi: number;
    exScore: number;
    notes: number;
  }[];
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
        BPIトップ{TOP_SONGS_COUNT}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: 6,
        }}
      >
        {topSongs.map((s) => {
          const diffColor = DIFF_COLORS[s.difficulty] ?? "#94a3b8";
          return (
            <div
              key={s.songId}
              style={{
                display: "flex",
                flexDirection: "column",
                paddingTop: 5,
                paddingBottom: 5,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255,255,255,0.1)",
                borderBottomStyle: "solid",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 12,
                      fontWeight: 700,
                      paddingLeft: 6,
                      paddingRight: 6,
                      paddingTop: 2,
                      paddingBottom: 2,
                      borderRadius: 4,
                      background: `${diffColor}33`,
                      color: diffColor,
                    }}
                  >
                    {DIFF_LABELS[s.difficulty] ?? s.difficulty}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      maxWidth: 290,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.title}
                  </div>
                </div>
                <div
                  style={{ display: "flex", fontWeight: 700, color: "#38bdf8" }}
                >
                  {s.bpi.toFixed(2)}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                <div style={{ display: "flex" }}>{s.exScore}</div>
                <div style={{ display: "flex" }}>
                  {scoreLabelOf(s.exScore, s.notes)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RadarBlock({
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

/** BPI推移を単純な折れ線（塗りつぶしエリア付き）で描画する。satori制約はRadarPolygonChartと同じ */
function GrowthChartBlock({
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

/**
 * 対象バージョンの現在の戦績を大きく、過去バージョンを最大3件バージョン・クラス・
 * 順位を列ぞろえして表示する。INF（アリーナランク自体が存在しない）は呼び出し元
 * （generateMonthlyReviewOgpImage）側で常に除外済みの前提
 */
function ArenaBlock({
  current,
  history,
}: {
  current: {
    version: string;
    arenaClass: string;
    arenaRank: number | null;
  } | null;
  history: ArenaVersionHistoryEntry[];
}) {
  if (!current && history.length === 0) return null;

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
        アリーナ戦績
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
        }}
      >
        {current && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 28,
              paddingBottom: 28,
              marginBottom: 20,
              borderRadius: 16,
              background:
                ARENA_CLASS_STYLES[current.arenaClass]?.glow2 ??
                "rgba(255,255,255,0.05)",
              border: `1px solid ${ARENA_CLASS_STYLES[current.arenaClass]?.border ?? "rgba(255,255,255,0.15)"}`,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 15,
                color: "rgba(255,255,255,0.4)",
                marginBottom: 8,
              }}
            >
              {versionLabelOf(current.version)}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 700,
                lineHeight: 1,
                color: ARENA_CLASS_STYLES[current.arenaClass]?.text ?? "#fff",
              }}
            >
              {current.arenaClass}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 16,
                color: "rgba(255,255,255,0.5)",
                marginTop: 6,
              }}
            >
              {current.arenaRank != null ? `#${current.arenaRank}` : "-"}
            </div>
          </div>
        )}
        {history.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.slice(0, ARENA_HISTORY_COUNT).map((h) => {
              const s = ARENA_CLASS_STYLES[h.arenaClass];
              return (
                <div
                  key={h.version}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flex: 1,
                      fontSize: 16,
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {versionLabelOf(h.version)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: 56,
                      justifyContent: "flex-end",
                      fontSize: 16,
                      fontWeight: 700,
                      color: s?.text ?? "rgba(255,255,255,0.5)",
                    }}
                  >
                    {h.arenaClass}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: 64,
                      justifyContent: "flex-end",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    {h.arenaRank != null ? `#${h.arenaRank}` : "-"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface OgpRenderData {
  heading: string;
  userName: string;
  profileImage: string | null;
  bpiEnd: number;
  sections: [OgpSectionKey, OgpSectionKey];
  topSongs: {
    songId: number;
    title: string;
    difficulty: string;
    bpi: number;
    exScore: number;
    notes: number;
  }[];
  topRadar: { element: string; bpiEnd: number }[];
  growthHistory: { date: string; value: number }[];
  arenaCurrent: {
    version: string;
    arenaClass: string;
    arenaRank: number | null;
  } | null;
  arenaHistory: ArenaVersionHistoryEntry[];
  /** 全期間(version)モードのみ。前バージョンとの比較。比較対象が無い場合はnull */
  compareBadge: { version: string; diff: number } | null;
}

async function renderOgpImage(data: OgpRenderData): Promise<Buffer> {
  const { heading, userName, profileImage, bpiEnd, sections, compareBadge } = data;
  const sectionNodes = sections.map((key) => {
    switch (key) {
      case "topSongs":
        return <TopSongsBlock key={key} topSongs={data.topSongs} />;
      case "radar":
        return <RadarBlock key={key} topRadar={data.topRadar} />;
      case "growth":
        return <GrowthChartBlock key={key} history={data.growthHistory} />;
      case "arena":
        return (
          <ArenaBlock
            key={key}
            current={data.arenaCurrent}
            history={data.arenaHistory}
          />
        );
    }
  });

  const svg = await satori(
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: 48,
        background: "linear-gradient(135deg, #0a0a0f 0%, #14141f 100%)",
        fontFamily: "Noto Sans JP",
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 10,
        }}
      >
        {profileImage ? (
          // satori用のJSXで、next/imageではなく生のimg要素を渡す必要がある
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={toSatoriSafeImageUrl(profileImage)}
            alt=""
            width={44}
            height={44}
            style={{
              borderRadius: 22,
              border: "2px solid rgba(255,255,255,0.15)",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 22,
              background: "rgba(255,255,255,0.1)",
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {userName.slice(0, 2)}
          </div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          {userName}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 34,
          fontWeight: 700,
          marginBottom: 14,
        }}
      >
        {heading}
      </div>

      <div
        style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "rgba(255,255,255,0.4)",
            marginBottom: 4,
          }}
        >
          総合BPI
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {bpiEnd.toFixed(2)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              paddingLeft: 14,
              paddingRight: 14,
              paddingTop: 6,
              paddingBottom: 6,
              marginBottom: 6,
              borderRadius: 999,
              background: "rgba(251,191,36,0.12)",
              border: "1px solid rgba(251,191,36,0.35)",
              fontSize: 20,
              fontWeight: 700,
              color: "#fbbf24",
            }}
          >
            推定 {BpiCalculator.estimateRank(bpiEnd).toLocaleString()}位
          </div>
          {compareBadge && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: 14,
                paddingRight: 14,
                paddingTop: 6,
                paddingBottom: 6,
                marginBottom: 6,
                borderRadius: 999,
                background: `${compareDiffColor(compareBadge.diff)}1f`,
                border: `1px solid ${compareDiffColor(compareBadge.diff)}59`,
                fontSize: 20,
                fontWeight: 700,
                color: compareDiffColor(compareBadge.diff),
              }}
            >
              {versionLabelOf(compareBadge.version)}比{" "}
              {compareBadge.diff >= 0 ? "+" : ""}
              {compareBadge.diff.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, gap: 48 }}>{sectionNodes}</div>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        {
          name: "Noto Sans JP",
          data: loadFont("regular"),
          weight: 400,
          style: "normal",
        },
        {
          name: "Noto Sans JP",
          data: loadFont("bold"),
          weight: 700,
          style: "normal",
        },
      ],
    },
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  return resvg.render().asPng();
}

export async function generateMonthlyReviewOgpImage(q: {
  userId: string;
  version: string;
  month: string;
  sections?: [OgpSectionKey, OgpSectionKey];
  compareVersion?: string;
}): Promise<Buffer> {
  const sections = q.sections ?? DEFAULT_OGP_SECTIONS;
  const needsArena = sections.includes("arena");
  const { monthStart, monthEnd, useMonthBuckets, granularity } =
    resolveMonthlyReviewPeriod(q.month);
  // 「前作比」バッジは全期間(version)モードのみ。月次/年次のbpi.diffは
  // 期間内(開始→終了)の伸びであり「前バージョンとの比較」とは別概念のため対象外
  const compareVersion =
    granularity === "version"
      ? (q.compareVersion ?? previousVersionOf(q.version))
      : null;

  const [
    userInfo,
    bpiTimeline,
    { latestInMonth, songUpdateDateMap },
    arenaRows,
    versionHistoryRows,
    compareBpiTimeline,
  ] = await Promise.all([
    usersRepo.getDisplayInfo(q.userId),
    computeOwnerBpiTimeline(
      q.userId,
      q.version,
      monthStart,
      monthEnd,
      useMonthBuckets,
    ),
    computeOwnerMonthlyScores(q.userId, q.version, monthStart, monthEnd),
    needsArena && q.version !== "INF"
      ? monthlyReviewRepo.getMonthlyArenaStats(
          q.userId,
          q.version,
          monthStart,
          monthEnd,
        )
      : Promise.resolve([]),
    needsArena
      ? monthlyReviewRepo.getArenaVersionHistory(q.userId)
      : Promise.resolve([]),
    compareVersion
      ? computeOwnerBpiTimeline(
          q.userId,
          q.version,
          monthStart,
          monthEnd,
          useMonthBuckets,
          compareVersion,
        )
      : Promise.resolve(null),
  ]);
  const { topBpiSongs, topImprovedSongs } = await computeOwnerTopSongs(
    q.userId,
    q.version,
    monthStart,
    latestInMonth,
  );
  // OGPのノーツレーダーは「伸び」ではなく現時点の最終状態を見せるため、
  // buildRadarGrowthの結果からbpiEnd（現在の要素別BPI）だけを使う
  const radarGrowth = buildRadarGrowth(
    topImprovedSongs,
    bpiTimeline.allL12SongMeta,
    songUpdateDateMap,
    bpiTimeline.ownerPreMonthExScoreMap,
    bpiTimeline.finalExScoreMap,
    topBpiSongs,
  );

  const arena = q.version !== "INF" ? buildArena(arenaRows) : null;
  const arenaCurrent = arena
    ? {
        version: q.version,
        arenaClass: arena.bestClass,
        arenaRank: arena.bestRank,
      }
    : null;
  // 「現在」カードと重複しないよう対象バージョン自身を除き、INFはアリーナランクが
  // 存在しないため常に除外する（現在枠・履歴の両方から排除する仕様）
  const arenaHistory = versionHistoryRows
    .filter((r) => r.version !== q.version && r.version !== "INF")
    .map((r) => ({
      version: r.version,
      arenaClass: r.arenaClass,
      arenaRank: r.arenaRank,
    }));

  // バッジのdiffは「現在の総合BPI（画像上部に出ている実数値）− 前バージョンの
  // baseline」。compareBpiTimeline.bpiEnd（compareVersion指定時は"純粋な伸び"に
  // 差し替わる値）ではなく、常に表示中のbpiTimeline.bpiEndを基準にする。
  // 比較先バージョンにスコアが1件も無い場合、baselineは「全曲未プレイ」扱いの
  // 見かけ上のBPI（大きくマイナスになりうる）になり実態と乖離するため出さない
  const compareBadge =
    compareVersion && compareBpiTimeline && compareBpiTimeline.hasCompareData
      ? {
          version: compareVersion,
          diff:
            Math.round((bpiTimeline.bpiEnd - compareBpiTimeline.bpiStart) * 100) /
            100,
        }
      : null;

  return renderOgpImage({
    heading: periodHeadingOf(q.month, q.version, granularity),
    userName: userInfo?.userName ?? q.userId,
    profileImage: userInfo?.profileImage ?? null,
    bpiEnd: bpiTimeline.bpiEnd,
    sections,
    topSongs: topBpiSongs.slice(0, TOP_SONGS_COUNT),
    topRadar: [...radarGrowth]
      .sort((a, b) => b.bpiEnd - a.bpiEnd)
      .slice(0, RADAR_ELEMENTS_COUNT),
    growthHistory: bpiTimeline.history,
    arenaCurrent,
    arenaHistory,
    compareBadge,
  });
}

/**
 * Twitter等でBPIM2自体を紹介するランディングページ用のサンプル画像。
 * 実データに紐づかない架空の値を使う（実在ユーザーの実データを恒久的な
 * マーケティング素材に使わないため）。
 */
export async function generateSampleMonthlyReviewOgpImage(): Promise<Buffer> {
  return renderOgpImage({
    heading: "IIDX 33 Sparkle Showerの振り返り",
    userName: "プレイヤー名",
    profileImage: null,
    bpiEnd: 25.42,
    sections: DEFAULT_OGP_SECTIONS,
    topSongs: [
      {
        songId: -1,
        title: "冥",
        difficulty: "ANOTHER",
        bpi: 23.56,
        exScore: 3333,
        notes: 2000,
      },
      {
        songId: -2,
        title: "灼熱Beach Side Bunny",
        difficulty: "LEGGENDARIA",
        bpi: 12.34,
        exScore: 3000,
        notes: 1719,
      },
      {
        songId: -3,
        title: "卑弥呼",
        difficulty: "ANOTHER",
        bpi: 12.32,
        exScore: 3333,
        notes: 2119,
      },
      {
        songId: -4,
        title: "死神自爆中二妹アイドルももかりん(1歳)",
        difficulty: "ANOTHER",
        bpi: 12.31,
        exScore: 2356,
        notes: 1472,
      },
      {
        songId: -5,
        title: "パラドキシカル・タイムリープトライアル(Short Ver.)",
        difficulty: "ANOTHER",
        bpi: 12.3,
        exScore: 2300,
        notes: 1416,
      },
    ],
    topRadar: [
      { element: "SCRATCH", bpiEnd: 30.1 },
      { element: "CHARGE", bpiEnd: 25.4 },
      { element: "PEAK", bpiEnd: 25.2 },
      { element: "CHORD", bpiEnd: 22.8 },
      { element: "SOFLAN", bpiEnd: 30.5 },
      { element: "NOTES", bpiEnd: 28.9 },
    ],
    growthHistory: [],
    arenaCurrent: null,
    arenaHistory: [],
    compareBadge: { version: "32", diff: 4.86 },
  });
}
