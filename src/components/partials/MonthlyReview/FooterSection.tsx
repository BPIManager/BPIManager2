"use client";

import { useRouter } from "next/router";
import { ArrowLeft, Share2 } from "lucide-react";
import { useInView } from "@/hooks/common/useInView";
import type { MonthlyReviewData } from "@/pages/api/v1/users/[userId]/stats/monthly-review";

const styles = `
  @keyframes footerFade { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
`;

interface Props {
  data: MonthlyReviewData;
}

export const FooterSection = ({ data }: Props) => {
  const router = useRouter();
  const [ref, inView] = useInView(0.1);

  const shareText = [
    `【${data.month}の振り返り】`,
    `総合BPI: ${data.bpi.start.toFixed(2)} → ${data.bpi.end.toFixed(2)} (${data.bpi.diff >= 0 ? "+" : ""}${data.bpi.diff.toFixed(2)})`,
    data.topSongs.topImprovedSongs[0]
      ? `最伸び: ${data.topSongs.topImprovedSongs[0].title} +${data.topSongs.topImprovedSongs[0].diff.toFixed(2)}`
      : null,
    "#IIDX #BPIM2",
  ]
    .filter(Boolean)
    .join("\n");

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`;

  return (
    <>
      <style>{styles}</style>
      <section
        ref={ref as React.RefObject<HTMLDivElement>}
        className="flex w-full flex-col items-center justify-center gap-8 px-6 pb-24 pt-12"
      >
        <div
          className="h-px w-full max-w-sm"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)",
            animation: inView ? "footerFade 0.6s ease-out both" : "none",
          }}
        />

        <div
          className="flex flex-col items-center gap-4 sm:flex-row"
          style={{
            animation: inView ? "footerFade 0.6s ease-out 0.2s both" : "none",
          }}
        >
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all hover:scale-105"
            style={{
              background: "rgba(29,161,242,0.15)",
              border: "1px solid rgba(29,161,242,0.4)",
              color: "#1da1f2",
            }}
          >
            <Share2 className="h-4 w-4" />
            Xでシェア
          </a>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </button>
        </div>
      </section>
    </>
  );
};
