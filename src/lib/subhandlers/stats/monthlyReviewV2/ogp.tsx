import { readFileSync } from "fs";
import path from "path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import dayjs from "@/lib/dayjs";
import { usersRepo } from "@/lib/db/domains/users";
import { buildRadarGrowth } from "@/lib/monthly-review/radar";
import { getRankDetail } from "@/constants/iidx/rankBorders";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
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

function periodHeadingOf(
  month: string,
  version: string,
  granularity: "month" | "year" | "version",
): string {
  if (granularity === "version") {
    const versionName =
      version === "INF" ? "INFINITAS" : `IIDX ${getVersionNameFromNumber(version)}`;
    return `${versionName}の振り返り`;
  }
  if (granularity === "year") return `${dayjs.tz(`${month}-01-01`).format("YYYY年")}の振り返り`;
  return `${dayjs.tz(`${month}-01`).format("YYYY年M月")}の振り返り`;
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
      computeOwnerBpiTimeline(q.userId, q.version, monthStart, monthEnd, useMonthBuckets),
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

  const heading = periodHeadingOf(q.month, q.version, granularity);
  const topSongs = topBpiSongs.slice(0, TOP_SONGS_COUNT);
  const topRadar = [...radarGrowth]
    .sort((a, b) => b.bpiEnd - a.bpiEnd)
    .slice(0, RADAR_ELEMENTS_COUNT);
  const maxRadarEnd = Math.max(1, ...topRadar.map((r) => r.bpiEnd + 15));

  const svg = await satori(
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: 56,
        background: "linear-gradient(135deg, #0a0a0f 0%, #14141f 100%)",
        fontFamily: "Noto Sans JP",
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        {userInfo?.profileImage ? (
          // satori用のJSXで、next/imageではなく生のimg要素を渡す必要がある
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={toSatoriSafeImageUrl(userInfo.profileImage)}
            alt=""
            width={44}
            height={44}
            style={{ borderRadius: 22, border: "2px solid rgba(255,255,255,0.15)" }}
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
            {(userInfo?.userName ?? q.userId).slice(0, 2)}
          </div>
        )}
        <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.55)" }}>
          {userInfo?.userName ?? q.userId}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 34,
          fontWeight: 700,
          marginBottom: 20,
        }}
      >
        {heading}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 28 }}>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.4)" }}>
          総合BPI
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>
          {bpiTimeline.bpiEnd.toFixed(2)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            color: bpiTimeline.bpiDiff >= 0 ? "#34d399" : "#f87171",
          }}
        >
          {bpiTimeline.bpiDiff >= 0 ? "+" : ""}
          {bpiTimeline.bpiDiff.toFixed(2)}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 20, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20 }}>
                <div style={{ display: "flex", maxWidth: 320, overflow: "hidden" }}>{s.title}</div>
                <div style={{ display: "flex", fontWeight: 700, color: "#38bdf8" }}>
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
                <div style={{ display: "flex" }}>{s.exScore.toLocaleString()}</div>
                <div style={{ display: "flex" }}>{scoreLabelOf(s.exScore, s.notes)}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 20, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
            ノーツレーダー
          </div>
          {topRadar.map((r) => (
            <div key={r.element} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", width: 70, fontSize: 16, color: "rgba(255,255,255,0.5)" }}>
                {r.element}
              </div>
              <div
                style={{
                  display: "flex",
                  width: 160,
                  height: 10,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: `${Math.max(0, Math.min(100, ((r.bpiEnd + 15) / maxRadarEnd) * 100))}%`,
                    height: "100%",
                    borderRadius: 6,
                    background: "#38bdf8",
                  }}
                />
              </div>
              <div style={{ display: "flex", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>
                {r.bpiEnd.toFixed(2)}
              </div>
            </div>
          ))}
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
        { name: "Noto Sans JP", data: loadFont("regular"), weight: 400, style: "normal" },
        { name: "Noto Sans JP", data: loadFont("bold"), weight: 700, style: "normal" },
      ],
    },
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  return resvg.render().asPng();
}
