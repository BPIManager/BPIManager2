import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangle, Bookmark, Copy } from "lucide-react";
import { iidxUrl } from "@/constants/iidxUrl";
import { toast } from "sonner";

const BOOKMARKLET_CODE =
  "javascript:(function(){var s=document.createElement('script');s.src='https://bpi2.poyashi.me/bookmarklet.js?t='+Date.now();document.body.appendChild(s);})();";

export const BookmarkletAccordion = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const iidxLink = (
    <a
      href={iidxUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-bpim-primary underline decoration-blue-400/30 underline-offset-4 transition-colors hover:decoration-blue-300"
    >
      IIDX公式サイト
    </a>
  );

  const desktopSteps = [
    <>
      下のボタンをブラウザのブックマークバーにドラッグ＆ドロップして登録します。
    </>,
    <>{iidxLink}を開きます。</>,
    <>登録したブックマークレットをクリックして実行します。</>,
    <>このページに戻り、「インポートを開始」ボタンをクリックします。</>,
  ];

  const mobileSteps = [
    <>
      下の「コードをコピー」ボタンでブックマークレットのコードをコピーします。
    </>,
    <>
      ブラウザで任意のページをブックマークし、そのブックマークを編集してURLをコピーしたコードに書き換えます。
    </>,
    <>{iidxLink}を開き、アドレスバーにブックマーク名を入力して実行します。</>,
    <>このページに戻り、「インポートを開始」ボタンをクリックします。</>,
  ];

  const steps = isMobile ? mobileSteps : desktopSteps;

  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-xl border border-bpim-border bg-bpim-surface-2/60 mt-4"
    >
      <AccordionItem value="bookmarklet" className="border-none">
        <AccordionTrigger className="px-4 py-2 text-xs text-bpim-text hover:no-underline [&>svg]:text-bpim-muted">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-bpim-primary" />
            ブックマークレット経由で登録
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4">
          <div className="flex flex-col text-xs text-bpim-muted">
            <div className="mb-3 flex gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-yellow-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="leading-relaxed">
                このブックマークレットはログイン中の e-AMUSEMENT GATE
                上で実行されます。ブックマークレットはページ上で任意の
                JavaScript
                を実行できるため、悪意あるコードであればセッション情報（Cookie・トークン等）を第三者に送信するなどの個人情報の窃取が理論上可能です。本ブックマークレットはソースコードを{" "}
                <a
                  href="https://github.com/BPIManager/IIDX-Scraping-Bookmarklet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-yellow-200"
                >
                  GitHub で公開
                </a>
                しているため、内容を確認の上、自己責任でご使用ください。
              </p>
            </div>
            <p className="leading-relaxed">
              以下の手順でブックマークレット経由でスコアデータをインポートすることができます。
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
            {isMobile ? (
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={BOOKMARKLET_CODE}
                    onFocus={(e) => e.target.select()}
                    className="min-w-0 flex-1 rounded-md border border-bpim-border bg-bpim-surface-1 px-3 py-1.5 font-mono text-xs text-bpim-muted"
                  />
                  <CopyCodeButton />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={BOOKMARKLET_CODE}
                    onFocus={(e) => e.target.select()}
                    className="min-w-0 flex-1 rounded-md border border-bpim-border bg-bpim-surface-1 px-3 py-1.5 font-mono text-xs text-bpim-muted"
                  />
                  <CopyCodeButton />
                </div>
                <div className="flex items-center gap-3">
                  <BookmarkletButton />
                  <span className="text-xs text-bpim-muted">
                    ← ブックマークバーにドラッグ
                  </span>
                </div>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const CopyCodeButton = () => {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(BOOKMARKLET_CODE);
    toast.success("コードをコピーしました");
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-bpim-primary bg-bpim-primary/10 px-4 py-2 text-sm font-bold text-bpim-primary transition-colors hover:bg-bpim-primary/20 select-none"
    >
      <Copy className="h-4 w-4" />
      コピー
    </button>
  );
};

const BookmarkletButton = () => {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    ref.current?.setAttribute(
      "href",
      "javascript:(function(){var s=document.createElement('script');s.src='https://bpi2.poyashi.me/bookmarklet.js?t='+Date.now();document.body.appendChild(s);})();",
    );
  }, []);
  return (
    <a
      ref={ref}
      href="#"
      className="inline-flex items-center gap-2 rounded-lg border border-bpim-primary bg-bpim-primary/10 px-4 py-2 text-sm font-bold text-bpim-primary transition-colors hover:bg-bpim-primary/20 select-none"
      draggable
      onClick={(e) => e.preventDefault()}
    >
      <Bookmark className="h-4 w-4" />
      スコア取得
    </a>
  );
};
