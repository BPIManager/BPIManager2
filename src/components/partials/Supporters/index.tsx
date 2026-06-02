"use client";

import {
  ExternalLink,
  Coffee,
  Fish,
  Sparkles,
  Heart,
  Info,
  Gift,
  Bitcoin,
  AlertCircle,
  Mail,
  Copy,
  ShieldCheck,
  HandHeart,
  GitPullRequest,
  Bug,
  Code2,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSupporters } from "@/hooks/users/useSupporters";
import { useTranslation } from "@/hooks/common/useTranslation";
import { PageContainer, PageHeader } from "../Header";
import {
  SupporterListView,
  ContributorListView,
} from "../UserList/Supporters/ui";
import { UserRecommendationCardSkeleton } from "../UserList/Card/skeleton";
import { XIcon } from "../LogIn";

const CI_EN_URL = "https://ci-en.net/creator/36005";

const PLANS = [
  {
    id: "coffee",
    icon: Coffee,
    label: "Coffee",
    descKey: "support.plan.coffee.desc",
    price: "100",
    color: "text-amber-400",
    border: "border-amber-400/20",
    bg: "bg-amber-400/5",
    glow: "shadow-amber-400/5",
  },
  {
    id: "saba",
    icon: Fish,
    label: "Saba",
    descKey: "support.plan.saba.desc",
    price: "500",
    color: "text-cyan-400",
    border: "border-cyan-400/20",
    bg: "bg-cyan-400/5",
    glow: "shadow-cyan-400/5",
  },
  {
    id: "iidx",
    icon: Sparkles,
    label: "Sparkle",
    descKey: "support.plan.sparkle.desc",
    price: "1,000",
    color: "text-violet-300",
    border: "border-violet-400/20",
    bg: "bg-violet-500/5",
    glow: "shadow-violet-400/5",
  },
] as const;

type PlanCardProps = Omit<(typeof PLANS)[number], "descKey"> & {
  description: string;
};

const PlanCard = (props: PlanCardProps) => {
  const { t } = useTranslation();
  const {
    icon: Icon,
    label,
    price,
    description,
    color,
    border,
    bg,
    glow,
  } = props;
  return (
    <div
      className={cn(
        "relative flex flex-col gap-5 rounded-2xl border p-6 transition-all",
        border,
        bg,
        glow,
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "rounded-xl p-3 bg-bpim-bg/50 border border-current/10",
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-tighter text-bpim-muted">
            {t("support.perMonth")}
          </p>
          <p className="text-xl font-black text-bpim-text">¥{price}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-black tracking-tight text-bpim-text">
          {label}
        </h3>
        <p className="text-xs leading-relaxed text-bpim-muted h-12 overflow-hidden">
          {description}
        </p>
      </div>
    </div>
  );
};

export const SupportersPage = () => {
  const { data, isLoading } = useSupporters();
  const { t } = useTranslation();

  return (
    <div className="pb-20">
      <PageHeader
        title={t("page.support.title")}
        description={t("page.support.desc")}
      />

      <PageContainer>
        <div className="flex flex-col gap-16">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bpim-primary/10 text-bpim-primary shadow-inner">
                <HandHeart className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-bpim-text">
                {t("support.whyTitle")}
              </h2>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-bpim-border bg-bpim-surface-2/30 p-6 backdrop-blur-sm md:p-8">
              <Sparkles className="absolute -right-4 -top-4 h-24 w-24 opacity-[0.03] text-bpim-primary" />

              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-4 text-sm leading-relaxed text-bpim-muted">
                  <p>{t("support.whyDesc1")}</p>
                  <p>{t("support.whyDesc2")}</p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById("section-donation")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="flex items-center gap-2 rounded-xl border border-bpim-primary/30 bg-bpim-primary/5 px-4 py-2 text-sm font-bold text-bpim-primary transition-colors hover:bg-bpim-primary/10"
                    >
                      <Heart className="h-3.5 w-3.5" />
                      {t("support.btnDonate")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById("section-oss")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-2 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-400/10"
                    >
                      <GitPullRequest className="h-3.5 w-3.5" />
                      {t("support.btnOss")}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-4 rounded-xl bg-bpim-bg/40 p-5 border border-bpim-border/50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bpim-primary text-bpim-bg">
                      <ShieldCheck className="h-3 w-3" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[13px] font-bold text-bpim-text">
                        {t("support.fairnessTitle")}
                      </p>
                      <p className="text-sm text-bpim-muted">
                        {t("support.fairnessDesc1")}
                        <span className="font-bold text-bpim-primary">
                          {t("support.fairnessHighlight")}
                        </span>
                        {t("support.fairnessDesc2")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-bpim-border pt-4">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bpim-primary text-bpim-bg">
                      <Heart className="h-3 w-3" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[13px] font-bold text-bpim-text">
                        {t("support.howTitle")}
                      </p>
                      <p className="text-sm text-bpim-muted">
                        {t("support.howDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section id="section-donation" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bpim-primary/10 text-bpim-primary shadow-inner">
                <Heart className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-bpim-text">
                {t("support.donationSectionTitle")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  {...plan}
                  description={t(plan.descKey)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-6">
              <div className="space-y-3 text-center">
                <p className="text-xs font-bold text-bpim-muted">
                  {t("support.ciEnPayment")}
                </p>
                <a
                  href={CI_EN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-black text-white transition-all active:scale-95",
                    "bg-bpim-primary shadow-lg shadow-bpim-primary/20 hover:brightness-110",
                  )}
                >
                  {t("support.ciEnBtn")}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="rounded-2xl border border-bpim-border bg-bpim-surface-2/20 p-6 backdrop-blur-sm md:p-8">
                <p className="mb-6 text-xs text-bpim-muted text-center">
                  {t("support.otherMethods")}
                </p>
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-bpim-text">
                      <Bitcoin className="h-4 w-4 text-bpim-primary" />
                      {t("support.crypto")}
                    </div>
                    <div className="space-y-3 font-mono text-[11px]">
                      {(
                        [
                          {
                            label: "BTC",
                            address:
                              "bc1qddhvp6qpgkgftsprtysfte73nkvjehpe6gvkx0",
                          },
                          {
                            label: "ERC20",
                            address:
                              "0x392Cdf04119E320bdCEb3744a354D6CfcCBa7151",
                          },
                          {
                            label: "TRC20",
                            address: "TNs1aWTK9QaYJV11K1pEYxMCH5eGjV8WDk",
                          },
                        ] as const
                      ).map(({ label, address }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(address);
                            toast.success(
                              t("support.copyAddress").replace(
                                "$label$",
                                label,
                              ),
                            );
                          }}
                          className="cursor-pointer w-full text-left rounded-lg bg-bpim-bg/50 p-3 border border-bpim-border hover:border-bpim-primary/50 hover:bg-bpim-primary/5 transition-colors group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-bpim-muted uppercase tracking-tighter">
                              {label}
                            </p>
                            <Copy className="h-3 w-3 text-bpim-muted group-hover:text-bpim-primary transition-colors" />
                          </div>
                          <p className="break-all text-bpim-text">{address}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-bpim-text">
                        <Gift className="h-4 w-4 text-bpim-primary" />
                        <a
                          href="https://www.amazon.co.jp/b/?ie=UTF8&node=3131877051&ref_=sv_gc_2"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 underline"
                        >
                          {t("support.amazonGift")}
                          <ExternalLink className="h-3.5 w-3.5 text-bpim-muted" />
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            "msqkn310+bpim@gmail.com",
                          );
                          toast.success(t("support.copyEmail"));
                        }}
                        className="cursor-pointer w-full text-left rounded-lg bg-bpim-bg/50 p-4 border border-bpim-border hover:border-bpim-primary/50 hover:bg-bpim-primary/5 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] text-bpim-muted font-bold tracking-widest uppercase">
                            {t("support.toAddress")}
                          </p>
                          <Copy className="h-3 w-3 text-bpim-muted group-hover:text-bpim-primary transition-colors" />
                        </div>
                        <p className="text-sm font-bold text-bpim-text">
                          msqkn310+bpim@gmail.com
                        </p>
                      </button>
                    </div>

                    <div className="rounded-xl border border-bpim-warning/30 bg-bpim-warning/5 p-4 shadow-sm">
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-bpim-warning">
                        <AlertCircle className="h-4 w-4" />
                        {t("support.roleTitle")}
                      </div>
                      <p className="text-[11px] leading-relaxed text-bpim-text/80">
                        {t("support.roleDesc")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <a
                          href="https://forms.gle/VfMJpFrKfSJqRYLA8"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] font-bold text-bpim-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />{" "}
                          {t("support.form")}
                        </a>
                        <a
                          href="https://twitter.com/BPIManager"
                          target="_blank"
                          className="flex items-center gap-1.5 text-[11px] font-bold text-bpim-primary hover:underline"
                        >
                          <XIcon className="h-3 w-3" /> @BPIManager
                        </a>
                        <a
                          href="mailto:msqkn310+bpim@gmail.com"
                          className="flex items-center gap-1.5 text-[11px] font-bold text-bpim-primary hover:underline"
                        >
                          <Mail className="h-3 w-3" /> Email
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="space-y-1 border-l-4 border-bpim-primary pl-4">
              <p className="text-md text-bpim-muted font-medium">
                {t("support.supportersTitle")}
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-bpim-info/20 bg-bpim-info/5 p-4 text-sm leading-relaxed text-bpim-muted shadow-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-bpim-info" />
              <p>
                {t("support.supportersInfoPart1")}
                <br className="hidden md:block" />
                {t("support.supportersInfoPart2")}
              </p>
            </div>

            <div className="py-1">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <UserRecommendationCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <SupporterListView users={data?.supporters ?? []} />
              )}
            </div>
          </section>

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
                  {(
                    [
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
                    ] as const
                  ).map(({ icon: Icon, titleKey, descKey }, i) => (
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
              ) : (
                <ContributorListView users={data?.supporters ?? []} />
              )}
            </div>
          </section>
        </div>
      </PageContainer>
    </div>
  );
};
