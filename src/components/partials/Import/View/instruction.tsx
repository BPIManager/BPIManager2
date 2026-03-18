import { iidxUrl } from "@/constants/iidxUrl";
import { HelpCircle } from "lucide-react";

export const InstructionSection = () => {
  const steps = [
    {
      step: 1,
      text: (
        <>
          <a
            href={iidxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-bpim-primary underline decoration-blue-400/30 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-blue-300"
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

  return (
    <div className="rounded-xl border border-blue-500/20 bg-bpim-primary/10 p-5">
      <div className="mb-4 flex items-center gap-3">
        <HelpCircle className="h-5 w-5 text-bpim-text" />
        <h3 className="text-lg font-bold text-white">インポート方法</h3>
      </div>
      <ul className="flex flex-col gap-3">
        {steps.map((item) => (
          <li
            key={item.step}
            className="flex items-start gap-3 text-sm leading-relaxed text-bpim-text"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bpim-primary text-[10px] font-bold text-white">
              {item.step}
            </span>
            <div className="pt-0.5">{item.text}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};
