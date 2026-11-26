import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Camera, ExternalLink, Info } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import {
  BPIM2_CAMERA_SOURCE_URL,
  BPIM2_CAMERA_URL,
} from "@/constants/site/camera";

/** リザルト画面を撮影して1曲ずつ登録する BPIM2 Camera の案内 */
const CameraAppAccordion = () => {
  const { t } = useTranslation();

  const steps = [
    <>
      <a
        href={BPIM2_CAMERA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:decoration-bpim-primary"
      >
        {t("import.camera.step1.linkText")}
      </a>
      {t("import.camera.step1.suffix")}
    </>,
    <>{t("import.camera.step2")}</>,
    <>{t("import.camera.step3")}</>,
  ];

  return (
    <Accordion
      type="single"
      collapsible
      className="mt-4 overflow-hidden rounded-xl border border-bpim-border bg-bpim-surface-2/40 backdrop-blur-sm"
    >
      <AccordionItem value="camera-app" className="border-none">
        <AccordionTrigger className="px-5 py-2 text-sm font-bold text-bpim-text hover:bg-bpim-primary/5 hover:no-underline [&>svg]:text-bpim-muted">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-bpim-primary/10 p-1.5">
              <Camera className="h-4 w-4 text-bpim-primary" />
            </div>
            <span>{t("import.camera.accordionTitle")}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          <div className="flex flex-col gap-4">
            <p className="text-[13px] leading-relaxed text-bpim-muted">
              {t("import.camera.desc")}
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

            <div className="flex gap-3 rounded-lg border border-bpim-border bg-bpim-bg/40 p-4 text-xs leading-relaxed text-bpim-muted">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-bpim-primary" />
              <div className="space-y-1">
                <p>{t("import.camera.note")}</p>
                <a
                  href={BPIM2_CAMERA_SOURCE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-bpim-text underline decoration-bpim-text/30 hover:text-bpim-primary hover:decoration-bpim-primary"
                >
                  GitHub <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={BPIM2_CAMERA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-bpim-primary bg-bpim-primary/10 px-5 py-2.5 text-sm font-bold text-bpim-primary transition-all hover:bg-bpim-primary hover:text-bpim-bg active:scale-95"
              >
                <Camera className="h-4 w-4" />
                {t("import.camera.openButton")}
              </a>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default CameraAppAccordion;
