import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Smartphone, AlertTriangle, ExternalLink } from "lucide-react";

const ANDROID_APP_URL = "https://github.com/BPIManager/BPIM2-Flutter/releases";

export const AndroidAppAccordion = () => {
  const steps = [
    <>
      <a
        href={ANDROID_APP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:decoration-bpim-primary"
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
      className="mt-4 overflow-hidden rounded-xl border border-bpim-border bg-bpim-surface-2/40 backdrop-blur-sm"
    >
      <AccordionItem value="android-app" className="border-none">
        <AccordionTrigger className="px-5 py-2 text-sm font-bold text-bpim-text hover:bg-bpim-primary/5 hover:no-underline [&>svg]:text-bpim-muted">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-bpim-primary/10 p-1.5">
              <Smartphone className="h-4 w-4 text-bpim-primary" />
            </div>
            <span>Android用アプリを使用（コピペ不要）</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 rounded-lg border border-bpim-warning/30 bg-bpim-warning/10 p-4 text-[13px] leading-relaxed text-bpim-text">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bpim-warning" />
              <div className="space-y-2">
                <p>
                  本アプリはGoogle
                  Playに登録しておらず、APKを直接インストールする必要がある「提供元不明のアプリ」扱いです。
                </p>
                <p className="text-bpim-muted text-xs">
                  ソースコードは{" "}
                  <a
                    href="https://github.com/BPIManager/BPIM2-Flutter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-bpim-text underline decoration-bpim-text/30 hover:text-bpim-primary hover:decoration-bpim-primary"
                  >
                    GitHub <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  で公開されています。内容を確認の上、自己責任でご使用ください。
                </p>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed text-bpim-muted">
              Androidアプリを使用すると、
              <span className="mx-1 font-bold text-bpim-text">
                コピー＆ペースト不要
              </span>
              でIIDX公式サイトから自動的にデータを同期できます。
            </p>

            <ol className="flex flex-col gap-3">
              {steps.map((text, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[13px] leading-relaxed text-bpim-text"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bpim-primary text-[10px] font-black text-bpim-bg shadow-sm shadow-bpim-primary/20">
                    {i + 1}
                  </span>
                  <div className="pt-0.5">{text}</div>
                </li>
              ))}
            </ol>

            <div className="pt-2">
              <a
                href={ANDROID_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-bpim-primary bg-bpim-primary/10 px-5 py-2.5 text-sm font-bold text-bpim-primary transition-all hover:bg-bpim-primary hover:text-bpim-bg active:scale-95"
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
