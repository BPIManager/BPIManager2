import type { ReactNode } from "react";

interface StepCardProps {
  /** 手順番号。省略すると番号バッジを出さない */
  step?: number;
  title: ReactNode;
  children: ReactNode;
}

/** インポート画面の入力・設定・実行を手順ごとの不透明カードにまとめる殻 */
const StepCard = ({ step, title, children }: StepCardProps) => (
  <section className="flex flex-col gap-4 rounded-2xl border border-bpim-border bg-bpim-surface p-4 md:p-6">
    <div className="flex items-center gap-3">
      {step !== undefined && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bpim-primary text-xs font-black text-white">
          {step}
        </span>
      )}
      <div className="text-sm font-bold text-bpim-text">{title}</div>
    </div>
    <div className="flex flex-col gap-2">{children}</div>
  </section>
);

export default StepCard;
