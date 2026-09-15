import { readFileSync } from "fs";
import path from "path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import dayjs from "@/lib/dayjs";
import { usersRepo } from "@/lib/db/domains/users";
import { buildRadarGrowth } from "@/lib/monthly-review/radar";
import {
  resolveMonthlyReviewPeriod,
  computeOwnerBpiTimeline,
  computeOwnerMonthlyScores,
  computeOwnerTopSongs,
} from "./_shared";

const WIDTH = 1200;
const HEIGHT = 630;

let fontDataCache: Buffer | null = null;

/** satoriはWOFF2非対応・TTF/OTFのみ扱えるため、バンドル済みの静的インスタンス(可変フォントではない)を使う */
function loadFont(): Buffer {
  if (!fontDataCache) {
    fontDataCache = readFileSync(
      path.join(process.cwd(), "src/assets/fonts/NotoSansJP-Regular.ttf"),
    );
  }
  return fontDataCache;
}

function periodLabelOf(
  month: string,
  version: string,
  granularity: "month" | "year" | "version",
): string {
  if (granularity === "version")
    return `${version === "INF" ? "INF" : `IIDX${version}`} 全体`;
  if (granularity === "year") return dayjs.tz(`${month}-01-01`).format("YYYY年");
  return dayjs.tz(`${month}-01`).format("YYYY年M月");
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
  const radarGrowth = buildRadarGrowth(
    topImprovedSongs,
    bpiTimeline.allL12SongMeta,
    songUpdateDateMap,
    bpiTimeline.ownerPreMonthExScoreMap,
    bpiTimeline.finalExScoreMap,
  );

  const periodLabel = periodLabelOf(q.month, q.version, granularity);
  const top3 = topBpiSongs.slice(0, 3);
  const topRadar = [...radarGrowth]
    .sort((a, b) => Math.abs(b.totalDiff) - Math.abs(a.totalDiff))
    .slice(0, 6);
  const maxAbsDiff = Math.max(1, ...topRadar.map((r) => Math.abs(r.totalDiff)));

  const svg = await satori(
    <div
      style={{
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
      <div style={{ display: "flex", flexDirection: "column", marginBottom: 32 }}>
        <div style={{ display: "flex", fontSize: 28, color: "rgba(255,255,255,0.5)" }}>
          {userInfo?.userName ?? q.userId} の先月のまとめ
        </div>
        <div style={{ display: "flex", fontSize: 20, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
          {periodLabel}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 40 }}>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.4)" }}>
          総合BPI
        </div>
        <div style={{ display: "flex", fontSize: 64 }}>{bpiTimeline.bpiEnd.toFixed(2)}</div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
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
            BPIトップ3
          </div>
          {top3.map((s) => (
            <div
              key={s.songId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 22,
                paddingTop: 8,
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255,255,255,0.1)",
                borderBottomStyle: "solid",
              }}
            >
              <div style={{ display: "flex", maxWidth: 320, overflow: "hidden" }}>{s.title}</div>
              <div style={{ display: "flex", color: "#38bdf8" }}>{s.bpi.toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 20, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
            ノーツレーダー成長
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
                    width: `${Math.min(100, (Math.abs(r.totalDiff) / maxAbsDiff) * 100)}%`,
                    height: "100%",
                    borderRadius: 6,
                    background: r.totalDiff >= 0 ? "#34d399" : "#f87171",
                  }}
                />
              </div>
              <div style={{ display: "flex", fontSize: 15, color: "rgba(255,255,255,0.6)" }}>
                {r.totalDiff >= 0 ? "+" : ""}
                {r.totalDiff.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", fontSize: 18, color: "rgba(255,255,255,0.25)", marginTop: 24 }}>
        BPIManager2
      </div>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [{ name: "Noto Sans JP", data: loadFont(), weight: 400, style: "normal" }],
    },
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  return resvg.render().asPng();
}
