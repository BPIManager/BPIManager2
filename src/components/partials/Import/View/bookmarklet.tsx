import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertTriangle,
  Bookmark,
  Copy,
  ExternalLink,
  MousePointer2,
} from "lucide-react";
import { iidxUrl } from "@/constants/iidxUrl";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/common/useTranslation";

const BOOKMARKLET_CODE =
  "javascript:(function(){var s=document.createElement('script');s.src='https://bpi2.poyashi.me/bookmarklet.js?t='+Date.now();document.body.appendChild(s);})();";

interface BookmarkletAccordionProps {
  lastStep?: React.ReactNode;
}

export const BookmarkletAccordion = ({ lastStep }: BookmarkletAccordionProps = {}) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const iidxLink = (
    <a
      href={iidxUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:decoration-bpim-primary font-bold"
    >
      {t("import.instruction.iidxSiteLink")}
    </a>
  );

  const defaultLastStep = <>{t("import.bookmarklet.lastStep")}</>;
  const finalStep = lastStep ?? defaultLastStep;

  const desktopSteps = [
    <>{t("import.bookmarklet.desktop.step1")}</>,
    <>{t("import.bookmarklet.desktop.step2.prefix")}{iidxLink}{t("import.bookmarklet.desktop.step2.suffix")}</>,
    <>{t("import.bookmarklet.desktop.step3")}</>,
    finalStep,
  ];

  const mobileSteps = [
    <>{t("import.bookmarklet.mobile.step1")}</>,
    <>{t("import.bookmarklet.mobile.step2")}</>,
    <>{t("import.bookmarklet.mobile.step3.prefix")}{iidxLink}{t("import.bookmarklet.mobile.step3.suffix")}</>,
    finalStep,
  ];

  const steps = isMobile ? mobileSteps : desktopSteps;

  return (
    <Accordion
      type="single"
      collapsible
      className="mt-4 overflow-hidden rounded-xl border border-bpim-border bg-bpim-surface-2/40 backdrop-blur-sm"
    >
      <AccordionItem value="bookmarklet" className="border-none">
        <AccordionTrigger className="px-5 py-2 text-sm font-bold text-bpim-text hover:bg-bpim-primary/5 hover:no-underline [&>svg]:text-bpim-muted">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-bpim-primary/10 p-1.5">
              <Bookmark className="h-4 w-4 text-bpim-primary" />
            </div>
            <span>{t("import.bookmarklet.accordionTitle")}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 rounded-lg border border-bpim-warning/30 bg-bpim-warning/10 p-4 text-[13px] leading-relaxed text-bpim-text">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bpim-warning" />
              <div className="space-y-2">
                <p>{t("import.bookmarklet.warning.main")}</p>
                <p className="text-bpim-muted text-xs">
                  {t("import.bookmarklet.warning.detailPrefix")}{" "}
                  <a
                    href="https://github.com/BPIManager/IIDX-Scraping-Bookmarklet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-bpim-text underline decoration-bpim-text/30 hover:text-bpim-primary hover:decoration-bpim-primary"
                  >
                    GitHub <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  {t("import.bookmarklet.warning.detailSuffix")}
                  <br />
                  {t("import.bookmarklet.warning.proxyNote")}
                </p>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed text-bpim-muted">
              {t("import.bookmarklet.desc")}
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

            <div className="mt-2 flex flex-col gap-4 border-t border-bpim-border pt-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
                  {t("import.bookmarklet.codeLabel")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={BOOKMARKLET_CODE}
                    onFocus={(e) => e.target.select()}
                    className="min-w-0 flex-1 rounded-md border border-bpim-border bg-bpim-surface px-3 py-2 font-mono text-[11px] text-bpim-muted outline-none focus:border-bpim-primary/50"
                  />
                  <CopyCodeButton />
                </div>
              </div>

              {!isMobile && (
                <div className="flex items-center gap-4 rounded-lg bg-bpim-surface p-3 border border-bpim-border">
                  <BookmarkletButton />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-bpim-text">
                      <MousePointer2 className="h-3.5 w-3.5 text-bpim-primary" />
                      {t("import.bookmarklet.dragLabel")}
                    </div>
                    <p className="text-[11px] text-bpim-muted">
                      {t("import.bookmarklet.dragHint")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const CopyCodeButton = () => {
  const { t } = useTranslation();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(BOOKMARKLET_CODE);
    toast.success(t("import.bookmarklet.copied"));
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-bpim-primary bg-bpim-primary/10 px-4 py-2 text-sm font-bold text-bpim-primary transition-all hover:bg-bpim-primary hover:text-bpim-bg active:scale-95 select-none"
    >
      <Copy className="h-4 w-4" />
      {t("import.bookmarklet.copyButton")}
    </button>
  );
};

const BookmarkletButton = () => {
  const { t } = useTranslation();
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    ref.current?.setAttribute("href", BOOKMARKLET_CODE);
  }, []);

  return (
    <a
      ref={ref}
      href="#"
      className="inline-flex items-center gap-2 rounded-lg border border-bpim-primary bg-bpim-primary/10 px-6 py-3 text-sm font-black text-bpim-primary transition-all hover:bg-bpim-primary hover:text-bpim-bg cursor-grab active:cursor-grabbing select-none"
      draggable
      onClick={(e) => e.preventDefault()}
    >
      <Bookmark className="h-4 w-4" />
      {t("import.bookmarklet.button")}
    </a>
  );
};
