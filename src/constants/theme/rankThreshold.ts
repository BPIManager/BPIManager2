/** DJランク別しきい値・配色定義 */
export const RANK_THRESHOLDS = [
  {
    label: "MAX-",
    ratio: 17 / 18,
    bg: "bg-orange-500",
    text: "text-slate-950",
  },
  { label: "AAA", ratio: 8 / 9, bg: "bg-yellow-400", text: "text-black" },
  { label: "AA", ratio: 7 / 9, bg: "bg-green-400", text: "text-slate-900" },
  { label: "A", ratio: 6 / 9, bg: "bg-bpim-primary", text: "text-slate-900" },
  { label: "B", ratio: 5 / 9, bg: "bg-slate-500", text: "text-bpim-text" },
  { label: "C", ratio: 4 / 9, bg: "bg-bpim-overlay", text: "text-bpim-text" },
  { label: "D", ratio: 3 / 9, bg: "bg-slate-700", text: "text-bpim-text" },
  { label: "E", ratio: 2 / 9, bg: "bg-bpim-surface-2", text: "text-bpim-text" },
  { label: "F", ratio: 0, bg: "bg-bpim-bg", text: "text-bpim-muted" },
] as const;
