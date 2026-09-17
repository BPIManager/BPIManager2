import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, ExternalLink } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";

const MCP_INFO_URL = "https://bpi2.poyashi.me/api/mcp";
const MCP_SETTINGS_URL = "/settings";

const McpEntryAccordion = () => {
  const { t } = useTranslation();

  const steps = [
    <>{t("import.mcp.step1")}</>,
    <>{t("import.mcp.step2")}</>,
    <>{t("import.mcp.step3")}</>,
  ];

  return (
    <Accordion
      type="single"
      collapsible
      className="mt-4 overflow-hidden rounded-xl border border-bpim-border bg-bpim-surface-2/40 backdrop-blur-sm"
    >
      <AccordionItem value="mcp-entry" className="border-none">
        <AccordionTrigger className="px-5 py-2 text-sm font-bold text-bpim-text hover:bg-bpim-primary/5 hover:no-underline [&>svg]:text-bpim-muted">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-bpim-primary/10 p-1.5">
              <Sparkles className="h-4 w-4 text-bpim-primary" />
            </div>
            <span>{t("import.mcp.accordionTitle")}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          <div className="flex flex-col gap-4">
            <p className="text-[13px] leading-relaxed text-bpim-muted">
              {t("import.mcp.desc")}
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

            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a
                href={MCP_INFO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1 text-[13px] text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:decoration-bpim-primary"
              >
                {t("import.mcp.infoLinkText")}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={MCP_SETTINGS_URL}
                className="inline-flex w-fit items-center gap-1 text-[13px] text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:decoration-bpim-primary"
              >
                {t("import.mcp.settingsLinkText")}
              </a>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default McpEntryAccordion;
