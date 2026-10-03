


import { TOP_SONGS_COUNT, scoreLabelOf, DIFF_COLORS, DIFF_LABELS } from "@/lib/subhandlers/stats/monthlyReviewV2/ogp/shared";

export function TopSongsBlock({
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
