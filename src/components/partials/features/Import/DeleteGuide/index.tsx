import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LifeBuoy } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/iidx/iidxVersions";

const DeleteGuideAccordion = () => {
  const { t } = useTranslation();
  const { user } = useUser();

  const steps = [
    t("import.deleteGuide.step1"),
    t("import.deleteGuide.step2"),
    t("import.deleteGuide.step3"),
  ];

  return (
    <Accordion
      type="single"
      collapsible
      className="mt-4 overflow-hidden rounded-xl border border-bpim-danger/40 bg-bpim-danger/5"
    >
      <AccordionItem value="delete-guide" className="border-none">
        <AccordionTrigger className="px-5 py-2 text-sm font-bold text-bpim-text hover:bg-bpim-danger/10 hover:no-underline [&>svg]:text-bpim-muted">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-bpim-danger/15 p-1.5">
              <LifeBuoy className="h-4 w-4 text-bpim-danger" />
            </div>
            <span>{t("import.deleteGuide.accordionTitle")}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          <div className="flex flex-col gap-4">
            <p className="text-[13px] leading-relaxed text-bpim-muted">
              {t("import.deleteGuide.desc")}
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

            {user?.userId && (
              <Link
                href={{
                  pathname: `/users/${user.userId}/logs/${latestVersion}`,
                  query: { groupedBy: "createdAt" },
                }}
                className="inline-flex w-fit items-center gap-1 text-[13px] text-bpim-primary underline decoration-bpim-primary/30 underline-offset-4 transition-colors hover:decoration-bpim-primary"
              >
                {t("import.deleteGuide.linkText")}
              </Link>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default DeleteGuideAccordion;
