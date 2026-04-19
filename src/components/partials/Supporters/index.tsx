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
    price: "100",
    description: "集中力維持のコーヒー代として活用させていただきます",
    color: "text-amber-400",
    border: "border-amber-400/20",
    bg: "bg-amber-400/5",
    glow: "shadow-amber-400/5",
  },
  {
    id: "saba",
    icon: Fish,
    label: "Saba",
    price: "500",
    description: "サーバー維持費に充てさせていただきます",
    color: "text-cyan-400",
    border: "border-cyan-400/20",
    bg: "bg-cyan-400/5",
    glow: "shadow-cyan-400/5",
  },
  {
    id: "iidx",
    icon: Sparkles,
    label: "Sparkle",
    price: "1,000",
    description:
      "Claude Code,Gemini Pro等の開発ツール費用に充てさせていただきます",
    color: "text-violet-300",
    border: "border-violet-400/20",
    bg: "bg-violet-500/5",
    glow: "shadow-violet-400/5",
  },
] as const;

const PlanCard = (props: (typeof PLANS)[number]) => {
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
            /月
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

  return (
    <div className="pb-20">
      <PageHeader
        title="ご支援のお願い"
        description="BPIM2の継続開発のため、ご支援をお待ちしております"
      />

      <PageContainer>
        <div className="flex flex-col gap-16">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bpim-primary/10 text-bpim-primary shadow-inner">
                <HandHeart className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-bpim-text">
                なぜサポートが必要なのですか？
              </h2>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-bpim-border bg-bpim-surface-2/30 p-6 backdrop-blur-sm md:p-8">
              <Sparkles className="absolute -right-4 -top-4 h-24 w-24 opacity-[0.03] text-bpim-primary" />

              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-4 text-sm leading-relaxed text-bpim-muted">
                  <p>
                    BPIM2は個人に運営されているファンメイドツールです。 一方で、
                    サーバー費用（約40ユーロ/月）
                    に加え、開発ツールのライセンス費用などの固定費が毎月発生しています。
                  </p>
                  <p>
                    サービスの維持・改善には多大な労力を注いでおりますが、ボランタリーのみでクオリティを維持し続けるのには限界があります。
                    これからも皆様に快適な体験を提供し続けるため、ご支援をいただけると大変ありがたいです。
                  </p>
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
                      ご寄付による支援
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
                      OSSへの貢献
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
                        機能の公平性について
                      </p>
                      <p className="text-sm text-bpim-muted">
                        ご支援の有無によって、BPIM2上での
                        <span className="font-bold text-bpim-primary">
                          機能差異は一切ありません。
                        </span>
                        サポーターロールは、開発を支えてくださる方への感謝の印としての表示です。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-bpim-border pt-4">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bpim-primary text-bpim-bg">
                      <Heart className="h-3 w-3" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[13px] font-bold text-bpim-text">
                        支援の方法
                      </p>
                      <p className="text-sm text-bpim-muted">
                        「100円からのご寄付」または「OSSへの貢献」のいずれかの方法でご参加いただけます。ご希望の方にはサポーターロールを付与させていただきます。
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
                ご寄付による支援
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PLANS.map((plan) => (
                <PlanCard key={plan.id} {...plan} />
              ))}
            </div>

            <div className="flex flex-col gap-6">
              <div className="space-y-3 text-center">
                <p className="text-xs font-bold text-bpim-muted">
                  クレジットカード(JCB)・WebMoney・ペイディ・d払いの方はこちら
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
                  Ci-enで支援する
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="rounded-2xl border border-bpim-border bg-bpim-surface-2/20 p-6 backdrop-blur-sm md:p-8">
                <p className="mb-6 text-xs text-bpim-muted text-center">
                  または、以下のアドレス宛に任意の金額をお送りください
                </p>
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-bpim-text">
                      <Bitcoin className="h-4 w-4 text-bpim-primary" />
                      暗号通貨
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
                            toast.success(`${label}アドレスをコピーしました`);
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
                          アマゾンギフト券
                          <ExternalLink className="h-3.5 w-3.5 text-bpim-muted" />
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            "msqkn310+bpim@gmail.com",
                          );
                          toast.success("メールアドレスをコピーしました");
                        }}
                        className="cursor-pointer w-full text-left rounded-lg bg-bpim-bg/50 p-4 border border-bpim-border hover:border-bpim-primary/50 hover:bg-bpim-primary/5 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] text-bpim-muted font-bold tracking-widest uppercase">
                            宛先
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
                        サポーターロール付与について
                      </div>
                      <p className="text-[11px] leading-relaxed text-bpim-text/80">
                        暗号通貨またはアマギフでご支援いただいた場合で、サポーターロールの付与を希望される方は、お手数ですが以下のいずれかまでご連絡をお願いいたします。
                      </p>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <a
                          href="https://forms.gle/VfMJpFrKfSJqRYLA8"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] font-bold text-bpim-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> フォーム
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
                ご支援者の皆様
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-bpim-info/20 bg-bpim-info/5 p-4 text-sm leading-relaxed text-bpim-muted shadow-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-bpim-info" />
              <p>
                ご支援プランに加入いただいたあと、専用Discord
                botから支援者ロールをBPIM2アカウントに付与いただいた場合のみリストに表示されます。
                <br className="hidden md:block" />
                Ci-en経由でご支援いただいた場合でDiscord連携を行っていただいていない方、アマギフや暗号通貨でご支援頂いた方でロール付与をご希望いただいていない方についてはリストに表示されませんのでご注意ください。
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
                OSSへの貢献
              </h2>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-bpim-border bg-bpim-surface-2/30 p-6 backdrop-blur-sm md:p-8">
              <Sparkles className="absolute -right-4 -top-4 h-24 w-24 opacity-[0.03] text-emerald-400" />

              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-4 text-sm leading-relaxed text-bpim-muted">
                  <p>
                    BPIM2はモノレポのOSSとして公開されており、どなたでも開発に参加することができます。コードの改善・バグ修正・翻訳など、あらゆる形の貢献を歓迎しています。
                  </p>
                  <p>
                    OSSへの貢献（コード寄稿、バグ報告等）をいただいた方で、コントリビューターロールの付与をご希望される方は、以下のいずれかまでご連絡ください。
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href="https://forms.gle/VfMJpFrKfSJqRYLA8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> フォーム
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
                        title: "コードの寄稿",
                        desc: "バグ修正・機能追加・リファクタリングなど、Pull Requestをお送りください",
                      },
                      {
                        icon: Bug,
                        title: "バグ報告",
                        desc: "GitHubのIssuesにて不具合・改善提案を報告していただけると助かります",
                      },
                      {
                        icon: Globe,
                        title: "フィードバック",
                        desc: "X(@BPIManager)へのリプライ・DMでもご意見をお待ちしております",
                      },
                    ] as const
                  ).map(({ icon: Icon, title, desc }, i) => (
                    <div
                      key={title}
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
                          {title}
                        </p>
                        <p className="text-sm text-bpim-muted">{desc}</p>
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
