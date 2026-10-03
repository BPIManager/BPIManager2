

import { ARENA_CLASS_STYLES } from "@/constants/iidx/arenaRankStyles";
import type { ArenaVersionHistoryEntry } from "@/types/stats/monthlyReview";

import { ARENA_HISTORY_COUNT, versionLabelOf } from "@/lib/subhandlers/stats/monthlyReviewV2/ogp/shared";


/**
 * 対象バージョンの戦績を大きく、過去バージョンを最大3件、バージョン・クラス・順位を列ぞろえして表示する。INF は呼び出し元で除外済み。
 */
export function ArenaBlock({
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
