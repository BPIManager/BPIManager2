import { Meta } from "@/components/partials/common/PageChrome/Head";
import MonthlyReviewView from "@/components/partials/features/MonthlyReview/index";
import PeriodSelector from "@/components/partials/features/MonthlyReview/PeriodSelector";
import LoadingChecklist from "@/components/partials/features/MonthlyReview/LoadingChecklist";
import { StarfieldBackground } from "@/components/ui/starfield-background";
import { useMonthlyReviewBpi } from "@/hooks/stats/useMonthlyReviewBpi";
import { useMonthlyReviewTopSongs } from "@/hooks/stats/useMonthlyReviewTopSongs";
import { useMonthlyReviewActivity } from "@/hooks/stats/useMonthlyReviewActivity";
import { useMonthlyReviewRivals } from "@/hooks/stats/useMonthlyReviewRivals";
import { useMonthlyReviewArena } from "@/hooks/stats/useMonthlyReviewArena";
import { useMonthlyReviewRadarGrowth } from "@/hooks/stats/useMonthlyReviewRadarGrowth";
import { useTranslation } from "@/hooks/common/useTranslation";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

const orbitStyles = `
  @keyframes orbitA { 0%{transform:rotate(0deg) translateX(30px) rotate(0deg)} 100%{transform:rotate(360deg) translateX(30px) rotate(-360deg)} }
  @keyframes orbitB { 0%{transform:rotate(120deg) translateX(30px) rotate(-120deg)} 100%{transform:rotate(480deg) translateX(30px) rotate(-480deg)} }
  @keyframes orbitC { 0%{transform:rotate(240deg) translateX(30px) rotate(-240deg)} 100%{transform:rotate(600deg) translateX(30px) rotate(-600deg)} }
  @keyframes corePulse { 0%,100%{opacity:0.4;transform:translate(-50%,-50%) scale(0.85)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)} }
  @keyframes ringPulse { 0%,100%{opacity:0.06} 50%{opacity:0.18} }
  @keyframes loadingFade { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.35em} }
`;

const authStatusOf = (error: unknown): number | undefined =>
  (error as { status?: number } | undefined)?.status;

export default function MonthlyReviewPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { userId, month: rawMonth } = router.query;
  const version = (router.query.version as string) || latestVersion;
  const userIdStr = router.isReady ? (userId as string) : undefined;
  const month = router.isReady ? (rawMonth as string) : undefined;

  const isAllMode = month === "all";
  const isYearMode = !isAllMode && /^\d{4}$/.test(month ?? "");
  const granularity: "month" | "year" | "version" = isAllMode
    ? "version"
    : isYearMode
      ? "year"
      : "month";

  // 楽曲ハイライト「最も伸びた曲」の比較先バージョン（全期間モードのみ有効・
  // configボタンから変更可能）。未指定時はサーバー側で既定値（前バージョン）が使われる。
  // ルート（対象期間）が変わったら選択をリセットする（レンダー中の状態調整）
  const routeKey = `${userIdStr ?? ""}:${version}:${month ?? ""}`;
  const [compareVersionRouteKey, setCompareVersionRouteKey] =
    useState(routeKey);
  const [compareVersion, setCompareVersion] = useState<string | undefined>(
    undefined,
  );
  if (compareVersionRouteKey !== routeKey) {
    setCompareVersionRouteKey(routeKey);
    setCompareVersion(undefined);
  }

  const bpi = useMonthlyReviewBpi(userIdStr, version, month, compareVersion);
  const topSongs = useMonthlyReviewTopSongs(
    userIdStr,
    version,
    month,
    compareVersion,
  );
  const activity = useMonthlyReviewActivity(userIdStr, version, month);
  const rivals = useMonthlyReviewRivals(userIdStr, version, month);
  const arena = useMonthlyReviewArena(userIdStr, version, month);
  const radarGrowth = useMonthlyReviewRadarGrowth(
    userIdStr,
    version,
    month,
    compareVersion,
  );

  const sections = [
    { key: "bpi", label: t("monthlyReview.loading.bpi"), ...bpi },
    {
      key: "topSongs",
      label: t("monthlyReview.loading.topSongs"),
      ...topSongs,
    },
    {
      key: "activity",
      label: t("monthlyReview.loading.activity"),
      ...activity,
    },
    { key: "rivals", label: t("monthlyReview.loading.rivals"), ...rivals },
    { key: "arena", label: t("monthlyReview.loading.arena"), ...arena },
    {
      key: "radarGrowth",
      label: t("monthlyReview.loading.radarGrowth"),
      ...radarGrowth,
    },
  ];
  const allSettled = sections.every((s) => !s.isLoading);
  const isAuthError = sections.every((s) => {
    const status = authStatusOf(s.error);
    return status === 401 || status === 403;
  });

  // 初回ロード完了後は、比較先バージョン変更等による個別セクションの再フェッチで
  // 画面全体のローディング演出に戻らないよう、ルート（対象期間）単位で
  // 「初回ロード済みか」を記憶する（レンダー中の状態調整）
  const [loadedRouteKey, setLoadedRouteKey] = useState<string | null>(null);
  if (allSettled && loadedRouteKey !== routeKey) {
    setLoadedRouteKey(routeKey);
  }
  const showFullScreenLoading = !router.isReady || loadedRouteKey !== routeKey;

  const BackBtn = (
    <button
      onClick={() => router.back()}
      className="fixed left-4 top-4 z-50 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold backdrop-blur-sm transition-colors hover:bg-white/10"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.6)",
      }}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back
    </button>
  );

  const MetaTag =
    router.isReady && userIdStr && month ? (
      <Meta
        title={t("page.monthlyReviewShare.title")}
        ogImage={`https://bpi2.poyashi.me${API_V2_PREFIX}/users/${userIdStr}/stats/monthly-review/ogp?version=${version}&month=${month}`}
      />
    ) : null;

  const handlePeriodSelect = (newVersion: string, period: string) => {
    router.push(
      `/users/${userId as string}/monthly-review/${period}?version=${newVersion}`,
    );
  };

  const CalendarBtn = router.isReady ? (
    <PeriodSelector
      currentVersion={version}
      currentPeriod={month as string}
      onSelect={handlePeriodSelect}
    />
  ) : null;

  if (showFullScreenLoading) {
    return (
      <div className="fixed inset-0" style={{ background: "#0a0a0f" }}>
        {MetaTag}
        <style>{orbitStyles}</style>
        {BackBtn}
        {CalendarBtn}
        <StarfieldBackground count={600} speed={3} twinkle />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8">
          <div style={{ position: "relative", width: 80, height: 80 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.08)",
                animation: "ringPulse 2.4s ease-in-out infinite",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 14,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.7)",
                animation: "corePulse 2s ease-in-out infinite",
              }}
            />

            {[
              { anim: "orbitA", dur: "1.8s", color: "#38bdf8" },
              { anim: "orbitB", dur: "2.4s", color: "#a78bfa" },
              { anim: "orbitC", dur: "3.0s", color: "#34d399" },
            ].map(({ anim, dur, color }) => (
              <div
                key={anim}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 6,
                  height: 6,
                  marginTop: -3,
                  marginLeft: -3,
                  animation: `${anim} ${dur} linear infinite`,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 8px ${color}`,
                    opacity: 0.9,
                  }}
                />
              </div>
            ))}
          </div>
          <p
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: "0.625rem",
              fontWeight: 700,
              animation: "loadingFade 0.8s ease-out both",
            }}
          >
            LOADING
          </p>
          {router.isReady && (
            <LoadingChecklist
              items={sections.map((s) => ({
                key: s.key,
                label: s.label,
                status: s.isLoading ? "loading" : s.error ? "error" : "done",
              }))}
            />
          )}
        </div>
      </div>
    );
  }

  if (isAuthError) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-3"
        style={{ background: "#0a0a0f" }}
      >
        {BackBtn}
        {CalendarBtn}
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.875rem" }}>
          このデータを閲覧する権限がありません
        </p>
      </div>
    );
  }

  return (
    <>
      {MetaTag}
      {BackBtn}
      {CalendarBtn}
      <MonthlyReviewView
        data={{
          month: month as string,
          version,
          granularity,
          bpi: bpi.data,
          topSongs: topSongs.data,
          activity: activity.data,
          rivals: rivals.data,
          arena: arena.data?.arena ?? null,
          arenaVersionHistory: arena.data?.versionHistory ?? [],
          radarGrowth: radarGrowth.data?.radarGrowth ?? null,
          radarGrowthCompareVersion: radarGrowth.data?.compareVersion ?? null,
          radarGrowthUsingFallback:
            radarGrowth.data?.usingFallbackComparison ?? false,
        }}
        topSongsLoading={topSongs.isLoading}
        radarGrowthLoading={radarGrowth.isLoading}
        onCompareVersionChange={setCompareVersion}
      />
    </>
  );
}
