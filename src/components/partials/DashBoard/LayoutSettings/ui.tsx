"use client";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Columns, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetConfig, WidgetId, WIDGET_META } from "@/types/dashboard/layout";

export function ColsPreview({ cols }: { cols: 1 | 2 }) {
  return (
    <div className="flex gap-0.5 w-12 h-6">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1 rounded-sm bg-current opacity-40" />
      ))}
    </div>
  );
}

const P = "hsl(var(--bpim-primary))";
const M = "hsl(var(--bpim-text-muted))";
const S = "hsl(var(--bpim-success))";
const D = "hsl(var(--bpim-danger))";

function MiniPreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-14 h-9 flex-shrink-0 overflow-hidden rounded-sm border border-bpim-border/40 bg-bpim-overlay/10">
      {children}
    </div>
  );
}

function RadarPreviewSvgContent() {
  const cx = 28, cy = 18, r = 13;
  const angles = [0, 1, 2, 3, 4, 5].map((i) => ((i * 60 - 90) * Math.PI) / 180);
  const outer = angles.map((a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  const ratios = [0.8, 0.6, 0.9, 0.7, 0.5, 0.85];
  const data = angles.map((a, i) => [cx + ratios[i] * r * Math.cos(a), cy + ratios[i] * r * Math.sin(a)]);
  const toD = (pts: number[][]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + "Z";
  return (
    <>
      {outer.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke={M} strokeOpacity={0.3} strokeWidth="0.5" />
      ))}
      <path d={toD(outer)} fill="none" stroke={M} strokeOpacity={0.3} strokeWidth="0.5" />
      <path d={toD(data)} fill={P} fillOpacity={0.2} stroke={P} strokeOpacity={0.85} strokeWidth="1" />
    </>
  );
}

const ACTIVITY_GRID: number[][] = [
  [0, 2, 0, 3, 1, 0, 2, 4, 0, 1],
  [1, 0, 3, 1, 2, 0, 0, 2, 3, 0],
  [0, 1, 1, 4, 0, 3, 2, 0, 1, 2],
  [2, 0, 0, 1, 3, 1, 0, 3, 0, 4],
];
const ACT_OPACITY = [0.08, 0.25, 0.5, 0.75, 1] as const;

const WIDGET_PREVIEWS: Record<WidgetId, React.ReactNode> = {
  currentBpi: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        <text x="28" y="15" textAnchor="middle" fontSize="12" fontWeight="700" fill={P}>84.52</text>
        <text x="28" y="22" textAnchor="middle" fontSize="4" fill={M}>総合BPI</text>
        <rect x="5" y="27" width="46" height="3" rx="1.5" fill={P} fillOpacity={0.15} />
        <rect x="5" y="27" width="32" height="3" rx="1.5" fill={P} fillOpacity={0.65} />
        <path d="M46,20 L49,16 L52,20" fill="none" stroke={S} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
              x={3.5 + ci * 5} y={8.5 + ri * 5}
              width={4} height={4} rx={0.5}
              fill={P} fillOpacity={ACT_OPACITY[val]}
            />
          ))
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
            x={3 + i * 6.25} y={31 - h} width={5.25} height={h} rx={0.5}
            fill={P} fillOpacity={0.35 + (h / 20) * 0.55}
          />
        ))}
        <line x1="3" y1="31" x2="53" y2="31" stroke={M} strokeOpacity={0.25} strokeWidth="0.5" />
      </svg>
    </MiniPreview>
  ),

  bpiDistribution: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        {[3, 5, 8, 14, 22, 20, 14, 8, 4, 2].map((h, i) => (
          <rect
            key={i}
            x={1.5 + i * 5.3} y={31 - h} width={4.3} height={h} rx={0.5}
            fill={P} fillOpacity={i === 4 ? 0.9 : 0.45}
          />
        ))}
        <line x1="1.5" y1="31" x2="54.5" y2="31" stroke={M} strokeOpacity={0.25} strokeWidth="0.5" />
      </svg>
    </MiniPreview>
  ),

  bpmBpiDistribution: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        <line x1="5" y1="31" x2="53" y2="31" stroke={M} strokeOpacity={0.3} strokeWidth="0.5" />
        <line x1="5" y1="4" x2="5" y2="31" stroke={M} strokeOpacity={0.3} strokeWidth="0.5" />
        {([
          [10, 22], [15, 12], [18, 26], [24, 16], [27, 8],
          [30, 20], [33, 14], [38, 24], [41, 10], [44, 18],
          [47, 26], [50, 14], [52, 20], [22, 28], [36, 6],
        ] as [number, number][]).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.5} fill={P} fillOpacity={0.65} />
        ))}
      </svg>
    </MiniPreview>
  ),

  bpiHistory: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        {[3, 5, 2, 7, 4, 6, 5, 3, 7, 2].map((h, i) => (
          <rect key={i} x={4 + i * 4.9} y={31 - h} width={3.9} height={h} rx={0.5}
            fill={P} fillOpacity={0.2} />
        ))}
        <polyline
          points="4,27 9,25 14,23 19,20 24,18 29,16 34,14 39,13 44,12 49,11"
          fill="none" stroke={P} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
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
          fill={P} fillOpacity={0.2}
        />
        <polyline
          points="4,29 10,26 16,24 22,22 28,21 34,19 40,17 46,15 52,14"
          fill="none" stroke={P} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points="4,22 10,25 16,19 22,23 28,18 34,22 40,17 46,21 52,16"
          fill="none" stroke={M} strokeWidth="1" strokeDasharray="2 1.5" strokeLinecap="round"
        />
        <line x1="4" y1="32" x2="52" y2="32" stroke={M} strokeOpacity={0.2} strokeWidth="0.5" />
      </svg>
    </MiniPreview>
  ),

  rivalWinLoss: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        {[{ w: 42 }, { w: 28 }, { w: 16 }].map(({ w }, i) => (
          <g key={i}>
            <rect x={3} y={5 + i * 9} width={50} height={6} rx={1} fill={D} fillOpacity={0.35} />
            <rect x={3} y={5 + i * 9} width={50 * w / 56} height={6} rx={1} fill={S} fillOpacity={0.65} />
          </g>
        ))}
        <text x="28" y="34" textAnchor="middle" fontSize="3.5" fill={M}>WIN / LOSE</text>
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
        {/* 数値ラベル */}
        <text x="3" y="6" fontSize="4" fontWeight="700" fill={P}>58,261</text>
        <text x="33" y="6" fontSize="4" fontWeight="700" fill={M} fillOpacity={0.7}>6,245</text>
        {/* ゼロライン */}
        <line x1="3" y1="22" x2="53" y2="22" stroke={M} strokeOpacity={0.3} strokeWidth="0.5" />
        {/* 正負バー */}
        {([
          { h: 8, neg: false }, { h: 5, neg: true }, { h: 10, neg: false },
          { h: 3, neg: true  }, { h: 7, neg: false }, { h: 4, neg: true  },
          { h: 9, neg: false }, { h: 6, neg: true  }, { h: 5, neg: false },
        ] as { h: number; neg: boolean }[]).map(({ h, neg }, i) => (
          <rect key={i}
            x={3 + i * 5.6} y={neg ? 22 : 22 - h}
            width={4.6} height={h} rx={0.3}
            fill={neg ? M : P} fillOpacity={neg ? 0.65 : 0.8}
          />
        ))}
      </svg>
    </MiniPreview>
  ),

  rankingTabs: (
    <MiniPreview>
      <svg viewBox="0 0 56 36" className="w-full h-full">
        <rect x="2" y="2" width="15" height="6" rx="1" fill={P} fillOpacity={0.7} />
        <rect x="19" y="2" width="15" height="6" rx="1" fill={M} fillOpacity={0.2} />
        <rect x="36" y="2" width="18" height="6" rx="1" fill={M} fillOpacity={0.2} />
        <line x1="2" y1="10" x2="54" y2="10" stroke={M} strokeOpacity={0.25} strokeWidth="0.5" />
        {([14, 19, 24, 29] as number[]).map((y, i) => (
          <g key={i}>
            <rect x="2" y={y} width="4" height="4" rx="0.5" fill={P} fillOpacity={0.6 - i * 0.1} />
            <rect x="8" y={y + 0.5} width={38 - i * 3} height="3" rx="0.5" fill={M} fillOpacity={0.3} />
          </g>
        ))}
      </svg>
    </MiniPreview>
  ),
};


interface WidgetRowProps {
  widget: WidgetConfig;
  mainCols: 1 | 2;
  onToggleVisible: () => void;
  onToggleWidth: () => void;
  isOverlay?: boolean;
}

export function WidgetRow({
  widget,
  mainCols,
  onToggleVisible,
  onToggleWidth,
  isOverlay = false,
}: WidgetRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: isOverlay });

  const style = isOverlay
    ? {}
    : { transform: CSS.Transform.toString(transform), transition };

  const meta = WIDGET_META[widget.id];

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-bpim-border bg-bpim-surface px-3 py-2 transition-shadow select-none",
        isDragging && !isOverlay && "opacity-40",
        isOverlay && "shadow-xl ring-1 ring-bpim-primary/40",
        !widget.visible && !isOverlay && "opacity-50",
      )}
    >
      <button
        {...(isOverlay ? {} : { ...attributes, ...listeners })}
        className="cursor-grab touch-none text-bpim-muted active:cursor-grabbing"
        aria-label="並び替え"
        tabIndex={-1}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {WIDGET_PREVIEWS[widget.id]}

      <span className="flex-1 truncate text-sm text-bpim-text">
        {meta.label}
      </span>

      {widget.section === "main" && mainCols === 2 && (
        <button
          onClick={onToggleWidth}
          disabled={!widget.visible}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
            widget.width === "half"
              ? "bg-bpim-primary/20 text-bpim-primary"
              : "bg-bpim-overlay/30 text-bpim-muted",
            !widget.visible && "pointer-events-none",
          )}
          title={widget.width === "half" ? "2列中1列" : "全幅"}
        >
          {widget.width === "half" ? (
            <Columns className="h-3 w-3" />
          ) : (
            <Square className="h-3 w-3" />
          )}
          <span>{widget.width === "half" ? "1/2" : "全幅"}</span>
        </button>
      )}

      <button
        onClick={onToggleVisible}
        className="text-bpim-muted transition-colors hover:text-bpim-text"
        aria-label={widget.visible ? "非表示にする" : "表示する"}
      >
        {widget.visible ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export function DropZone({
  sectionId,
  label,
  widgets,
  mainCols,
  isDragTarget,
  onToggleVisible,
  onToggleWidth,
}: {
  sectionId: "main" | "sidebar";
  label: string;
  widgets: WidgetConfig[];
  mainCols: 1 | 2;
  isDragTarget: boolean;
  onToggleVisible: (id: WidgetId) => void;
  onToggleWidth: (id: WidgetId) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3
        className={cn(
          "text-sm font-semibold text-bpim-text transition-colors",
          isDragTarget && "text-bpim-primary",
        )}
      >
        {label}
        {sectionId === "main" && (
          <span className="ml-2 text-xs font-normal text-bpim-muted">
            ドラッグで並び替え・移動
          </span>
        )}
      </h3>
      <SortableContext
        items={widgets.map((w) => w.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={cn(
            "flex min-h-14 flex-col gap-2 rounded-lg border-2 border-dashed p-2 transition-colors",
            isDragTarget
              ? "border-bpim-primary/60 bg-bpim-primary/5"
              : "border-bpim-border/40 bg-transparent",
          )}
        >
          {widgets.length === 0 && (
            <div className="flex items-center justify-center py-3 text-xs text-bpim-muted">
              ここにドロップ
            </div>
          )}
          {widgets.map((widget) => (
            <WidgetRow
              key={widget.id}
              widget={widget}
              mainCols={mainCols}
              onToggleVisible={() => onToggleVisible(widget.id)}
              onToggleWidth={() => onToggleWidth(widget.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
