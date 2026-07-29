import {
  ExternalLink,
  Sparkles,
  Mail,
  GitPullRequest,
  Bug,
  Code2,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";
import { XIcon } from "../../../LogIn";
import { ContributorListView } from "@/components/partials/common/UserList/Supporters/ui";
import { UserRecommendationCardSkeleton } from "@/components/partials/common/UserList/Card/skeleton";
import { FetchErrorState } from "@/components/partials/common/FetchErrorState";
import { useSupporters } from "@/hooks/users/useSupporters";

type UseSupportersResult = ReturnType<typeof useSupporters>;

const OSS_ITEMS = [
  {
    icon: Code2,
    titleKey: "support.ossCodeTitle",
    descKey: "support.ossCodeDesc",
  },
  {
    icon: Bug,
    titleKey: "support.ossBugTitle",
    descKey: "support.ossBugDesc",
  },
  {
    icon: Globe,
    titleKey: "support.ossFeedbackTitle",
    descKey: "support.ossFeedbackDesc",
  },
] as const;

export const OssSection = ({ data, isLoading, isError }: UseSupportersResult) => {
  const { t } = useTranslation();

  return (
    <section id="section-oss" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400 shadow-inner">
          <GitPullRequest className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-bpim-text">
          {t("support.ossSectionTitle")}
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-bpim-border bg-bpim-surface-2/30 p-6 backdrop-blur-sm md:p-8">
        <Sparkles className="absolute -right-4 -top-4 h-24 w-24 opacity-[0.03] text-emerald-400" />

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4 text-sm leading-relaxed text-bpim-muted">
            <p>{t("support.ossDesc1")}</p>
            <p>{t("support.ossDesc2")}</p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://forms.gle/VfMJpFrKfSJqRYLA8"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> {t("support.form")}
              </a>
              <a
                href="https://twitter.com/BPIManager"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:underline"
              >
                <XIcon className="h-3 w-3" /> @BPIManager
              </a>
              <a
                href="mailto:msqkn310+bpim@gmail.com"
                className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:underline"
              >
                <Mail className="h-3 w-3" /> Email
              </a>
            </div>
            <a
              href="https://github.com/BPIManager/BPIManager2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:underline"
            >
              github.com/BPIManager/BPIManager2
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex flex-col justify-center gap-4 rounded-xl bg-bpim-bg/40 p-5 border border-bpim-border/50">
            {OSS_ITEMS.map(({ icon: Icon, titleKey, descKey }, i) => (
              <div
                key={titleKey}
                className={cn(
                  "flex items-start gap-3",
                  i > 0 && "border-t border-bpim-border pt-4",
                )}
              >
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-bpim-bg">
                  <Icon className="h-3 w-3" />
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-bpim-text">
                    {t(titleKey)}
                  </p>
                  <p className="text-sm text-bpim-muted">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-1">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <UserRecommendationCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <FetchErrorState error={isError} />
        ) : (
          <ContributorListView users={data?.supporters ?? []} />
        )}
      </div>
    </section>
  );
};
