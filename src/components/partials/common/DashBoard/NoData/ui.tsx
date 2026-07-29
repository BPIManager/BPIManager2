import { DashCard } from "@/components/ui/dashcard";
import NextLink from "next/link";
import { Import, Settings, BookOpenText } from "lucide-react";
import { LordiconAnimation } from "@/components/ui/lordicon-animation";
import { useTranslation } from "@/hooks/common/useTranslation";

export const NoDataAlert = () => {
  const { t } = useTranslation();
  const DOCS_URL =
    "https://www.notion.so/BPIM2-32a9989ca87a80829561f4b9618f1d6f";

  return (
    <DashCard className="my-6 border-2 border-dashed border-bpim-primary/30 bg-bpim-primary/5 p-8 text-center transition-all hover:border-bpim-primary/50">
      <div className="flex flex-col items-center">
        <div className="relative mb-4 flex h-18 w-18 items-center justify-center overflow-hidden rounded-full bg-bpim-primary/10">
          <LordiconAnimation
            src="/lottie/ghost.json"
            trigger="loop"
            size={40}
          />
        </div>

        <h3 className="text-xl font-black text-bpim-text tracking-tight">
          {t("dashboard.noData.title")}
        </h3>

        <p className="mt-3 max-w-lg text-sm leading-relaxed text-bpim-muted">
          {t("dashboard.noData.desc")}
        </p>

        <p className="mt-3 max-w-lg text-xs leading-relaxed text-bpim-muted/80">
          {t("dashboard.noData.desc2")}
        </p>

        <div className="mt-8 grid w-full max-w-2xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionLink
            href="/import"
            icon={<Import className="h-5 w-5" />}
            title={t("dashboard.noData.import")}
            description={t("dashboard.noData.importDesc")}
          />
          <ActionLink
            href="/settings"
            icon={<Settings className="h-5 w-5" />}
            title={t("dashboard.noData.migrate")}
            description={t("dashboard.noData.migrateDesc")}
          />
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2 rounded-xl border border-bpim-border bg-bpim-surface-2/40 p-4 transition-all hover:bg-bpim-surface-2 hover:ring-2 hover:ring-bpim-info/50"
          >
            <div className="text-bpim-info group-hover:scale-110 transition-transform">
              <BookOpenText className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-bpim-text">
              {t("dashboard.noData.docs")}
            </span>
            <span className="text-[10px] text-bpim-muted leading-tight">
              {t("dashboard.noData.docsDesc")}
            </span>
          </a>
        </div>
      </div>
    </DashCard>
  );
};

const ActionLink = ({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <NextLink
    href={href}
    className="group flex flex-col items-center gap-2 rounded-xl border border-bpim-border bg-bpim-surface-2/40 p-4 transition-all hover:bg-bpim-surface-2 hover:ring-2 hover:ring-bpim-primary/50"
  >
    <div className="text-bpim-primary group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="text-sm font-bold text-bpim-text">{title}</span>
    <span className="text-[10px] text-bpim-muted leading-tight">
      {description}
    </span>
  </NextLink>
);
