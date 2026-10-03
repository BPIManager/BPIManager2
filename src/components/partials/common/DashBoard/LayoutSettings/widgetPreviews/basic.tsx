import type { WidgetId } from "@/types/dashboard/layout";
import { P, M, S, MiniPreview, ACTIVITY_GRID, ACT_OPACITY } from "./shared";

export const basicPreviews: Pick<Record<WidgetId, React.ReactNode>, "currentBpi" | "activity" | "rankDistribution" | "bpiDistribution" | "bpmBpiDistribution"> = {
  currentBpi: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        <text
          x="28"
          y="15"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill={P}
        >
          84.52
        </text>
        <text x="28" y="22" textAnchor="middle" fontSize="4" fill={M}>
          総合BPI
        </text>
        <rect
          x="5"
          y="27"
          width="46"
          height="3"
          rx="1.5"
          fill={P}
          fillOpacity={0.15}
        />
        <rect
          x="5"
          y="27"
          width="32"
          height="3"
          rx="1.5"
          fill={P}
          fillOpacity={0.65}
        />
        <path
          d="M46,20 L49,16 L52,20"
          fill="none"
          stroke={S}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </MiniPreview>
  ),
  activity: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        {ACTIVITY_GRID.map((row, ri) =>
          row.map((val, ci) => (
            <rect
              key={`${ri}-${ci}`}
              x={3.5 + ci * 5}
              y={8.5 + ri * 5}
              width={4}
              height={4}
              rx={0.5}
              fill={P}
              fillOpacity={ACT_OPACITY[val]}
            />
          )),
        )}
      </svg>
    </MiniPreview>
  ),
  rankDistribution: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        {[4, 7, 12, 18, 20, 16, 10, 5].map((h, i) => (
          <rect
            key={i}
            x={3 + i * 6.25}
            y={31 - h}
            width={5.25}
            height={h}
            rx={0.5}
            fill={P}
            fillOpacity={0.35 + (h / 20) * 0.55}
          />
        ))}
        <line
          x1="3"
          y1="31"
          x2="53"
          y2="31"
          stroke={M}
          strokeOpacity={0.25}
          strokeWidth="0.5"
        />
      </svg>
    </MiniPreview>
  ),
  bpiDistribution: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        {[3, 5, 8, 14, 22, 20, 14, 8, 4, 2].map((h, i) => (
          <rect
            key={i}
            x={1.5 + i * 5.3}
            y={31 - h}
            width={4.3}
            height={h}
            rx={0.5}
            fill={P}
            fillOpacity={i === 4 ? 0.9 : 0.45}
          />
        ))}
        <line
          x1="1.5"
          y1="31"
          x2="54.5"
          y2="31"
          stroke={M}
          strokeOpacity={0.25}
          strokeWidth="0.5"
        />
      </svg>
    </MiniPreview>
  ),
  bpmBpiDistribution: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        <line
          x1="5"
          y1="31"
          x2="53"
          y2="31"
          stroke={M}
          strokeOpacity={0.3}
          strokeWidth="0.5"
        />
        <line
          x1="5"
          y1="4"
          x2="5"
          y2="31"
          stroke={M}
          strokeOpacity={0.3}
          strokeWidth="0.5"
        />
        {(
          [
            [10, 22],
            [15, 12],
            [18, 26],
            [24, 16],
            [27, 8],
            [30, 20],
            [33, 14],
            [38, 24],
            [41, 10],
            [44, 18],
            [47, 26],
            [50, 14],
            [52, 20],
            [22, 28],
            [36, 6],
          ] as [number, number][]
        ).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.5} fill={P} fillOpacity={0.65} />
        ))}
      </svg>
    </MiniPreview>
  ),
};
