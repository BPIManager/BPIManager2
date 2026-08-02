import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RivalSongs } from "./RivalSongs";

export function RivalCard({
  rival,
  index,
  inView,
}: {
  rival: MonthlyReviewData["rivals"][number];
  index: number;
  inView: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        animation: inView
          ? `rivalIn 0.6s cubic-bezier(0.22,1,0.36,1) ${index * 0.1}s both`
          : "none",
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={rival.profileImage ?? ""} alt={rival.userName} />
          <AvatarFallback
            className="text-xs"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {rival.userName[0]}
          </AvatarFallback>
        </Avatar>
        <span
          className="flex-1 truncate font-bold"
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: "1rem",
          }}
        >
          {rival.userName}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {rival.bpiGrowth !== null && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
              style={{
                background:
                  rival.bpiGrowth >= 0
                    ? "rgba(52,211,153,0.1)"
                    : "rgba(248,113,113,0.1)",
                color: rival.bpiGrowth >= 0 ? "#34d399" : "#f87171",
                border: `1px solid ${rival.bpiGrowth >= 0 ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
              }}
            >
              BPI {rival.bpiGrowth >= 0 ? "+" : ""}
              {rival.bpiGrowth.toFixed(2)}
            </span>
          )}
          {rival.newWins > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-black"
              style={{
                background: "rgba(52,211,153,0.15)",
                color: "#34d399",
                border: "1px solid rgba(52,211,153,0.3)",
              }}
            >
              ↑{rival.newWins} WIN
            </span>
          )}
          {rival.newLosses > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-black"
              style={{
                background: "rgba(248,113,113,0.15)",
                color: "#f87171",
                border: "1px solid rgba(248,113,113,0.3)",
              }}
            >
              ↓{rival.newLosses} LOSE
            </span>
          )}
        </div>
      </div>
      {rival.topWinningSongs.length > 0 && (
        <RivalSongs songs={rival.topWinningSongs} baseDelay={index * 0.1} />
      )}
    </div>
  );
}
