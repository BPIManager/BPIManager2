import type { WidgetId } from "@/types/dashboard/layout";
import { P, M, S, MiniPreview } from "./shared";

export const listsPreviews: Pick<Record<WidgetId, React.ReactNode>, "officialArenaHistory" | "rankingTabs" | "optimizerProgress"> = {
  officialArenaHistory: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        <text x="3" y="7" fontSize="4" fontWeight="700" fill={P}>
          ARENA履歴
        </text>
        <line
          x1="3"
          y1="10"
          x2="53"
          y2="10"
          stroke={M}
          strokeOpacity={0.25}
          strokeWidth="0.5"
        />
        <polyline
          points="3,30 12,22 22,20 32,18 42,16 52,14"
          fill="none"
          stroke={P}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {([3, 12, 22, 32, 42, 52] as number[]).map((x, i) => (
          <circle key={i} cx={x} cy={30 - i * 2.4} r="1.3" fill={P} />
        ))}
      </svg>
    </MiniPreview>
  ),
  rankingTabs: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        <rect
          x="2"
          y="2"
          width="15"
          height="6"
          rx="1"
          fill={P}
          fillOpacity={0.7}
        />
        <rect
          x="19"
          y="2"
          width="15"
          height="6"
          rx="1"
          fill={M}
          fillOpacity={0.2}
        />
        <rect
          x="36"
          y="2"
          width="18"
          height="6"
          rx="1"
          fill={M}
          fillOpacity={0.2}
        />
        <line
          x1="2"
          y1="10"
          x2="54"
          y2="10"
          stroke={M}
          strokeOpacity={0.25}
          strokeWidth="0.5"
        />
        {([14, 19, 24, 29] as number[]).map((y, i) => (
          <g key={i}>
            <rect
              x="2"
              y={y}
              width="4"
              height="4"
              rx="0.5"
              fill={P}
              fillOpacity={0.6 - i * 0.1}
            />
            <rect
              x="8"
              y={y + 0.5}
              width={38 - i * 3}
              height="3"
              rx="0.5"
              fill={M}
              fillOpacity={0.3}
            />
          </g>
        ))}
      </svg>
    </MiniPreview>
  ),

  // Optimizerメモ達成状況 – 曲ごとの目標EXスコア進捗バー
  optimizerProgress: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        <text x="3" y="6" fontSize="4" fontWeight="700" fill={P}>
          目標BPI 12.00
        </text>
        {([9, 18, 27] as number[]).map((y, i) => (
          <g key={i}>
            <rect
              x="3"
              y={y}
              width="50"
              height="3"
              rx="1.5"
              fill={M}
              fillOpacity={0.15}
            />
            <rect
              x="3"
              y={y}
              width={[38, 24, 12][i]}
              height="3"
              rx="1.5"
              fill={i === 0 ? S : P}
              fillOpacity={0.75}
            />
          </g>
        ))}
      </svg>
    </MiniPreview>
  ),
};
