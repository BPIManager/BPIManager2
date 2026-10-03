
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { BpiCalculator } from "@/lib/bpi";
import { usersRepo } from "@/lib/db/domains/users";
import { monthlyActivityRepo } from "@/lib/db/aggregates/monthly-review/activity";
import { buildRadarGrowth } from "@/lib/monthly-review/radar";
import { buildArena } from "@/lib/monthly-review/arena";
import { periodHeadingOf } from "@/lib/monthly-review/period";

import { DEFAULT_OGP_SECTIONS, type OgpSectionKey } from "@/lib/monthly-review/ogpSections";

import { resolveMonthlyReviewPeriod, previousVersionOf } from "@/lib/subhandlers/stats/monthlyReviewV2/period";
import { computeOwnerBpiTimeline } from "@/lib/subhandlers/stats/monthlyReviewV2/timeline";
import { computeOwnerMonthlyScores, computeOwnerTopSongs } from "@/lib/subhandlers/stats/monthlyReviewV2/scores";
import { OgpRenderData, WIDTH, HEIGHT, TOP_SONGS_COUNT, RADAR_ELEMENTS_COUNT, loadFont, toSatoriSafeImageUrl, versionLabelOf, compareDiffColor } from "@/lib/subhandlers/stats/monthlyReviewV2/ogp/shared";
import { RadarBlock } from "@/lib/subhandlers/stats/monthlyReviewV2/ogp/radar";
import { GrowthChartBlock } from "@/lib/subhandlers/stats/monthlyReviewV2/ogp/growth";
import { TopSongsBlock } from "@/lib/subhandlers/stats/monthlyReviewV2/ogp/topSongs";
import { ArenaBlock } from "@/lib/subhandlers/stats/monthlyReviewV2/ogp/arena";

export async function renderOgpImage(data: OgpRenderData): Promise<Buffer> {
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
      ? monthlyActivityRepo.getMonthlyArenaStats(
          q.userId,
          q.version,
          monthStart,
          monthEnd,
        )
      : Promise.resolve([]),
    needsArena
      ? monthlyActivityRepo.getArenaVersionHistory(q.userId)
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

  // バッジの diff は「現在の総合BPI − 前バージョンの baseline」で、常に表示中の bpiTimeline.bpiEnd を基準にする。
   // 比較先にスコアが無い場合 baseline は全曲未プレイ扱いの見かけ上の値になるため、差分は出さない。
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
 * BPIM2 紹介用のサンプル画像。実在ユーザーの実データを恒久的な素材に使わないため、架空の値を使う。
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
