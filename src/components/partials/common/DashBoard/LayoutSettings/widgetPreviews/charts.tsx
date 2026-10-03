import type { WidgetId } from "@/types/dashboard/layout";
import { P, M, S, D, MiniPreview, RadarPreviewSvgContent } from "./shared";

export const chartsPreviews: Pick<Record<WidgetId, React.ReactNode>, "bpiHistory" | "bpiBoxStats" | "rivalWinLoss" | "radar" | "iidxTower"> = {
  bpiHistory: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        {[3, 5, 2, 7, 4, 6, 5, 3, 7, 2].map((h, i) => (
          <rect
            key={i}
            x={4 + i * 4.9}
            y={31 - h}
            width={3.9}
            height={h}
            rx={0.5}
            fill={P}
            fillOpacity={0.2}
          />
        ))}
        <polyline
          points="4,27 9,25 14,23 19,20 24,18 29,16 34,14 39,13 44,12 49,11"
          fill="none"
          stroke={P}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </MiniPreview>
  ),

  // 時系列エリアチャート（25-75%帯 + 中央線 + 打鍵効率点線）
  bpiBoxStats: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        <path
          d="M4,28 L10,24 L16,21 L22,19 L28,17 L34,15 L40,13 L46,11 L52,10 L52,18 L46,20 L40,22 L34,24 L28,25 L22,26 L16,27 L10,28 L4,30 Z"
          fill={P}
          fillOpacity={0.2}
        />
        <polyline
          points="4,29 10,26 16,24 22,22 28,21 34,19 40,17 46,15 52,14"
          fill="none"
          stroke={P}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="4,22 10,25 16,19 22,23 28,18 34,22 40,17 46,21 52,16"
          fill="none"
          stroke={M}
          strokeWidth="1"
          strokeDasharray="2 1.5"
          strokeLinecap="round"
        />
        <line
          x1="4"
          y1="32"
          x2="52"
          y2="32"
          stroke={M}
          strokeOpacity={0.2}
          strokeWidth="0.5"
        />
      </svg>
    </MiniPreview>
  ),
  rivalWinLoss: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        {[{ w: 42 }, { w: 28 }, { w: 16 }].map(({ w }, i) => (
          <g key={i}>
            <rect
              x={3}
              y={5 + i * 9}
              width={50}
              height={6}
              rx={1}
              fill={D}
              fillOpacity={0.35}
            />
            <rect
              x={3}
              y={5 + i * 9}
              width={(50 * w) / 56}
              height={6}
              rx={1}
              fill={S}
              fillOpacity={0.65}
            />
          </g>
        ))}
        <text x="28" y="34" textAnchor="middle" fontSize="3.5" fill={M}>
          WIN / LOSE
        </text>
      </svg>
    </MiniPreview>
  ),
  radar: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        <RadarPreviewSvgContent />
      </svg>
    </MiniPreview>
  ),

  // IIDXタワー – ランキング棒グラフ（正=青・負=橙の2色バー）
  iidxTower: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        <text x="3" y="6" fontSize="4" fontWeight="700" fill={P}>
          58,261
        </text>
        <text
          x="33"
          y="6"
          fontSize="4"
          fontWeight="700"
          fill={M}
          fillOpacity={0.7}
        >
          6,245
        </text>

        <line
          x1="3"
          y1="22"
          x2="53"
          y2="22"
          stroke={M}
          strokeOpacity={0.3}
          strokeWidth="0.5"
        />

        {(
          [
            { h: 8, neg: false },
            { h: 5, neg: true },
            { h: 10, neg: false },
            { h: 3, neg: true },
            { h: 7, neg: false },
            { h: 4, neg: true },
            { h: 9, neg: false },
            { h: 6, neg: true },
            { h: 5, neg: false },
          ] as { h: number; neg: boolean }[]
        ).map(({ h, neg }, i) => (
          <rect
            key={i}
            x={3 + i * 5.6}
            y={neg ? 22 : 22 - h}
            width={4.6}
            height={h}
            rx={0.3}
            fill={neg ? M : P}
            fillOpacity={neg ? 0.65 : 0.8}
          />
        ))}
      </svg>
    </MiniPreview>
  ),
};
