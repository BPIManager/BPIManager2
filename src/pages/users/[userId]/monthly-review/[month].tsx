import { MonthlyReviewView } from "@/components/partials/MonthlyReview/index";
import { PeriodSelector } from "@/components/partials/MonthlyReview/PeriodSelector";
import { StarfieldBackground } from "@/components/ui/starfield-background";
import { useMonthlyReview } from "@/hooks/stats/useMonthlyReview";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";

const orbitStyles = `
  @keyframes orbitA { 0%{transform:rotate(0deg) translateX(30px) rotate(0deg)} 100%{transform:rotate(360deg) translateX(30px) rotate(-360deg)} }
  @keyframes orbitB { 0%{transform:rotate(120deg) translateX(30px) rotate(-120deg)} 100%{transform:rotate(480deg) translateX(30px) rotate(-480deg)} }
  @keyframes orbitC { 0%{transform:rotate(240deg) translateX(30px) rotate(-240deg)} 100%{transform:rotate(600deg) translateX(30px) rotate(-600deg)} }
  @keyframes corePulse { 0%,100%{opacity:0.4;transform:translate(-50%,-50%) scale(0.85)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)} }
  @keyframes ringPulse { 0%,100%{opacity:0.06} 50%{opacity:0.18} }
  @keyframes loadingFade { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.35em} }
`;

export default function MonthlyReviewPage() {
  const router = useRouter();
  const { userId, month } = router.query;
  const version = (router.query.version as string) || latestVersion;

  const { data, isLoading, error } = useMonthlyReview(
    router.isReady ? (userId as string) : undefined,
    version,
    router.isReady ? (month as string) : undefined,
  );

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

  if (!router.isReady || isLoading) {
    return (
      <div className="fixed inset-0" style={{ background: "#0a0a0f" }}>
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
        </div>
      </div>
    );
  }

  if (error || !data) {
    const statusCode = (error as { status?: number } | undefined)?.status;
    const isAuthError = statusCode === 401 || statusCode === 403;
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-3"
        style={{ background: "#0a0a0f" }}
      >
        {BackBtn}
        {CalendarBtn}
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.875rem" }}>
          {isAuthError
            ? "このデータを閲覧する権限がありません"
            : "この期間のデータがありません"}
        </p>
      </div>
    );
  }

  return (
    <>
      {BackBtn}
      {CalendarBtn}
      <MonthlyReviewView data={data} />
    </>
  );
}
