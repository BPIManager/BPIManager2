import { iidxUrl } from "@/constants/iidxUrl";
import {
  HelpCircle,
  Info,
  AlertTriangle,
  Monitor,
  Gamepad2,
} from "lucide-react";

export const InstructionSection = () => {
  const acSteps = [
    {
      step: 1,
      text: (
        <>
          <a
            href={iidxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-bpim-primary"
          >
            IIDX公式サイト
          </a>{" "}
          にアクセスしてCSVをダウンロードします。
        </>
      ),
    },
    { step: 2, text: "入力エリアにCSVデータを直接貼り付けてください。" },
    { step: 3, text: "「インポートを開始」ボタンを押して完了を待ちます。" },
  ];

  const infinitasSteps = [
    {
      step: 1,
      text: (
        <>
          「
          <a
            href="https://github.com/kaktuswald/inf-notebook/wiki"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-bpim-primary"
          >
            リザルト手帳
          </a>
          」「
          <a
            href="https://github.com/olji/Reflux"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-bpim-primary"
          >
            Reflux
          </a>
          」「
          <a
            href="https://github.com/dj-kata/inf_daken_counter_obsw"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-bpim-primary"
          >
            打鍵カウンタ
          </a>
          」から出力されるCSVまたはTSVを用意します。
        </>
      ),
    },
    { step: 2, text: "保存先バージョンを「INFINITAS」へ変更します。" },
    { step: 3, text: "入力エリアにデータを直接貼り付けてください。" },
    { step: 4, text: "「インポートを開始」ボタンを押して完了を待ちます。" },
  ];

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-surface/40 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center gap-3 border-b border-bpim-border pb-4">
        <HelpCircle className="h-6 w-6 text-bpim-primary" />
        <h3 className="text-xl font-bold text-bpim-text">
          データインポート方法
        </h3>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-bpim-primary">
            <Monitor className="h-5 w-5" />
            <h4 className="font-bold">アーケード版</h4>
          </div>
          <ul className="flex flex-col gap-3">
            {acSteps.map((item) => (
              <StepItem key={item.step} step={item.step} text={item.text} />
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-bpim-info">
            <Gamepad2 className="h-5 w-5" />
            <h4 className="font-bold font-sans">INFINITAS</h4>
          </div>
          <ul className="flex flex-col gap-3">
            {infinitasSteps.map((item) => (
              <StepItem key={item.step} step={item.step} text={item.text} />
            ))}
          </ul>

          <div className="mt-4 space-y-2 rounded-lg border border-bpim-info/20 bg-bpim-info/5 p-4 text-[13px] leading-relaxed">
            <div className="flex items-start gap-2 text-bpim-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-bpim-muted text-xs">
                Refluxからのデータは楽曲名の表記揺れにより、一部取り込みエラーが発生する場合があるため、打鍵カウンタ又はリザルト手帳の利用を推奨します。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepItem = ({ step, text }: { step: number; text: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-sm leading-relaxed text-bpim-text">
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bpim-primary text-[10px] font-black text-bpim-bg shadow-sm shadow-bpim-primary/20">
      {step}
    </span>
    <div className="pt-0.5">{text}</div>
  </li>
);
