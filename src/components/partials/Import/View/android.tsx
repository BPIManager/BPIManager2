import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Smartphone, AlertTriangle } from "lucide-react";
import { iidxUrl } from "@/constants/iidxUrl";

const ANDROID_APP_URL = "https://github.com/BPIManager/BPIM2-Flutter/releases";

export const AndroidAppAccordion = () => {
  const steps = [
    <>
      <a
        href={ANDROID_APP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-bpim-primary underline decoration-blue-400/30 underline-offset-4 transition-colors hover:decoration-blue-300"
      >
        こちら
      </a>
      からAndroidアプリをダウンロード・インストールします。
    </>,
    <>アプリを起動し、BPIM2アカウントでログインします。</>,
    <>
      右下の更新ボタンをタップすると、アプリがIIDX公式サイトからCSVを自動的に読み込みインポートします。
    </>,
  ];

  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-xl border border-bpim-border bg-bpim-surface-2/60 mt-2"
    >
      <AccordionItem value="android-app" className="border-none">
        <AccordionTrigger className="px-4 py-2 text-xs text-bpim-text hover:no-underline [&>svg]:text-bpim-muted">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-bpim-primary" />
            BPIM2のAndroid用アプリを使用（コピペ不要）
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4">
          <div className="flex flex-col text-xs text-bpim-muted">
            <div className="mb-3 flex gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-yellow-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="leading-relaxed">
                本アプリはGoogle
                Playに登録しておらず、APKを直接インストールする必要がある、いわゆる野良アプリです。インストール時にAndroidの「提供元不明のアプリ」を許可する操作が必要です。ソースコードは{" "}
                <a
                  href="https://github.com/BPIManager/BPIM2-Flutter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-yellow-200"
                >
                  GitHub で公開
                </a>
                しているため、内容を確認の上、自己責任でご使用ください。
              </p>
            </div>
            <p className="leading-relaxed mb-3">
              Androidアプリを使用すると、{" "}
              <span className="font-bold">コピー＆ペースト不要</span>
              でIIDX公式サイトから自動的にCSVを読み込んでインポートできます。
            </p>
            <ol className="flex flex-col gap-2">
              {steps.map((text, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 leading-relaxed text-bpim-text"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bpim-primary text-[10px] font-bold text-bpim-text">
                    {i + 1}
                  </span>
                  <div className="pt-0.5">{text}</div>
                </li>
              ))}
            </ol>
            <div className="pt-3">
              <a
                href={ANDROID_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-bpim-primary bg-bpim-primary/10 px-4 py-2 text-sm font-bold text-bpim-primary transition-colors hover:bg-bpim-primary/20 select-none"
              >
                <Smartphone className="h-4 w-4" />
                アプリをダウンロード
              </a>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
