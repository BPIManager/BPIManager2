import { RANK_TABLE } from "@/constants/iidx/rankBorders";

/** DJランク別しきい値・配色定義 */
const ratioByLabel = new Map(RANK_TABLE.map((r) => [r.label, r.ratio]));
const ratioOf = (label: string): number => {
  const ratio = ratioByLabel.get(label);
  if (ratio === undefined) throw new Error(`Unknown rank label: ${label}`);
  return ratio;
};

export const RANK_THRESHOLDS = [
  {
    label: "MAX-",
    ratio: ratioOf("MAX-"),
    bg: "bg-orange-500",
    text: "text-slate-950",
  },
  { label: "AAA", ratio: ratioOf("AAA"), bg: "bg-yellow-400", text: "text-black" },
  { label: "AA", ratio: ratioOf("AA"), bg: "bg-green-400", text: "text-slate-900" },
  { label: "A", ratio: ratioOf("A"), bg: "bg-bpim-primary", text: "text-slate-900" },
  { label: "B", ratio: ratioOf("B"), bg: "bg-slate-500", text: "text-bpim-text" },
  { label: "C", ratio: ratioOf("C"), bg: "bg-bpim-overlay", text: "text-bpim-text" },
  { label: "D", ratio: ratioOf("D"), bg: "bg-slate-700", text: "text-bpim-text" },
  { label: "E", ratio: ratioOf("E"), bg: "bg-bpim-surface-2", text: "text-bpim-text" },
  { label: "F", ratio: ratioOf("F"), bg: "bg-bpim-bg", text: "text-bpim-muted" },
] as const;
