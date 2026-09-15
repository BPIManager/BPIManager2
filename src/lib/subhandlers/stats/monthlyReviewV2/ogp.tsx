import { readFileSync } from "fs";
import path from "path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { BpiCalculator } from "@/lib/bpi";
import { usersRepo } from "@/lib/db/domains/users";
import { buildRadarGrowth } from "@/lib/monthly-review/radar";
import { periodHeadingOf } from "@/lib/monthly-review/period";
import { getRankDetail } from "@/constants/iidx/rankBorders";
import {
  resolveMonthlyReviewPeriod,
  computeOwnerBpiTimeline,
  computeOwnerMonthlyScores,
  computeOwnerTopSongs,
} from "./_shared";

const WIDTH = 1200;
const HEIGHT = 630;
const TOP_SONGS_COUNT = 4;
const RADAR_ELEMENTS_COUNT = 6;

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

interface OgpRenderData {
  heading: string;
  userName: string;
  profileImage: string | null;
  bpiEnd: number;
  topSongs: {
    songId: number;
    title: string;
    bpi: number;
    exScore: number;
    notes: number;
  }[];
  topRadar: { element: string; bpiEnd: number }[];
}

async function renderOgpImage(data: OgpRenderData): Promise<Buffer> {
  const { heading, userName, profileImage, bpiEnd, topSongs, topRadar } = data;

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
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              color: "rgba(255,255,255,0.4)",
              marginBottom: 12,
            }}
          >
            BPIトップ{TOP_SONGS_COUNT}
          </div>
          {topSongs.map((s) => (
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
                  justifyContent: "space-between",
                  fontSize: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    maxWidth: 320,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.title}
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
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              fontSize: 20,
              color: "rgba(255,255,255,0.4)",
              marginBottom: 4,
            }}
          >
            ノーツレーダー
          </div>
          <RadarPolygonChart entries={topRadar} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 56,
          bottom: 24,
          display: "flex",
          fontSize: 18,
          color: "rgba(255,255,255,0.25)",
        }}
      >
        BPIManager2
      </div>
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
}): Promise<Buffer> {
  const { monthStart, monthEnd, useMonthBuckets, granularity } =
    resolveMonthlyReviewPeriod(q.month);

  const [userInfo, bpiTimeline, { latestInMonth, songUpdateDateMap }] =
    await Promise.all([
      usersRepo.getDisplayInfo(q.userId),
      computeOwnerBpiTimeline(
        q.userId,
        q.version,
        monthStart,
        monthEnd,
        useMonthBuckets,
      ),
      computeOwnerMonthlyScores(q.userId, q.version, monthStart, monthEnd),
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

  return renderOgpImage({
    heading: periodHeadingOf(q.month, q.version, granularity),
    userName: userInfo?.userName ?? q.userId,
    profileImage: userInfo?.profileImage ?? null,
    bpiEnd: bpiTimeline.bpiEnd,
    topSongs: topBpiSongs.slice(0, TOP_SONGS_COUNT),
    topRadar: [...radarGrowth]
      .sort((a, b) => b.bpiEnd - a.bpiEnd)
      .slice(0, RADAR_ELEMENTS_COUNT),
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
    topSongs: [
      { songId: -1, title: "冥", bpi: 12.34, exScore: 3333, notes: 2000 },
      {
        songId: -2,
        title: "灼熱Beach Side Bunny",
        bpi: 12.34,
        exScore: 3000,
        notes: 1719,
      },
      { songId: -3, title: "卑弥呼", bpi: 12.67, exScore: 3333, notes: 2119 },
      {
        songId: -4,
        title: "死神自爆中二妹アイドルももかりん(1歳)",
        bpi: 23.56,
        exScore: 2356,
        notes: 1472,
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
  });
}
