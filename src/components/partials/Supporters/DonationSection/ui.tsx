import {
  Heart,
  ExternalLink,
  Coffee,
  Fish,
  Sparkles,
  Gift,
  Bitcoin,
  AlertCircle,
  Mail,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";
import { XIcon } from "../../LogIn";

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
  const { icon: Icon, label, price, description, color, border, bg, glow } =
    props;
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

export const DonationSection = () => {
  const { t } = useTranslation();

  return (
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
          <PlanCard key={plan.id} {...plan} description={t(plan.descKey)} />
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
                      address: "bc1qddhvp6qpgkgftsprtysfte73nkvjehpe6gvkx0",
                    },
                    {
                      label: "ERC20",
                      address: "0x392Cdf04119E320bdCEb3744a354D6CfcCBa7151",
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
                        t("support.copyAddress").replace("$label$", label),
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
                    navigator.clipboard.writeText("msqkn310+bpim@gmail.com");
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
                    <ExternalLink className="h-3 w-3" /> {t("support.form")}
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
  );
};
