import { LoginButtons } from "@/components/partials/LogIn";
import {
  Database,
  BarChart3,
  ArrowRightLeft,
  ShieldCheck,
  Cpu,
  UsersIcon,
  Wrench,
  LucideIcon,
} from "lucide-react";
import { Meta } from "../Head";
import { DashboardLayout } from "../Main";
import { PageContainer } from "../Header";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <DashboardLayout>
      <Meta
        title=""
        description="beatmania IIDX 上級者のためのスコアマネジメントツール"
      />
      <div className="min-h-screen bg-bpim-bg py-20 text-bpim-text">
        <PageContainer>
          <div className="mb-16 flex flex-col items-center gap-6 text-center">
            <h1 className="bg-gradient-to-br from-bpim-text to-gray-600 bg-clip-text text-6xl font-bold tracking-tighter text-transparent leading-none md:text-8xl">
              BPIM2
            </h1>
            <p className="max-w-2xl text-base text-bpim-muted md:text-lg">
              beatmania IIDX 上級者のためのスコアマネジメントツール
            </p>
          </div>

          <div className="mx-auto mb-12 max-w-md rounded-2xl border border-bpim-border bg-bpim-bg p-8 shadow-[0_0_40px_rgba(0,0,0,0.5),0_0_20px_rgba(59,130,246,0.1)]">
            <div className="flex flex-col items-center gap-6 text-center">
              <h2 className="text-xl font-bold">Sign In</h2>
              <LoginButtons />
              <div className="flex flex-col gap-2 text-[12px] leading-relaxed text-bpim-muted">
                <p>
                  本ツールは現在ベータ版提供です。
                  <br />
                  安定版としては{" "}
                  <a
                    href="https://bpi.poyashi.me"
                    target="_blank"
                    className="font-bold text-bpim-text underline decoration-white/20 underline-offset-4 transition-colors hover:text-bpim-primary hover:decoration-blue-400/50"
                  >
                    BPIM
                  </a>{" "}
                  をご利用ください。
                </p>
                <p className="text-[10px] opacity-60">
                  (BPIM→BPIM2のデータ移行はいつでも可能です)
                </p>
              </div>
            </div>
          </div>

          <Separator className="mb-16 bg-white/10" />

          <div className="flex flex-col items-center">
            <h3 className="mb-10 text-center text-lg font-bold tracking-[0.2em] uppercase text-bpim-text">
              BPIM2って？
            </h3>

            <div className="mb-12 w-full rounded-2xl border border-bpim-border bg-bpim-bg p-6 md:p-8">
              <div className="flex flex-col items-start gap-6 md:flex-row md:gap-8">
                <div className="flex shrink-0 items-center justify-center rounded-xl bg-bpim-primary/10 p-4 text-bpim-primary">
                  <BarChart3 className="h-8 w-8" />
                </div>

                <div className="flex flex-1 flex-col gap-4">
                  <h4 className="text-lg font-bold text-bpim-text">BPIとは</h4>
                  <div className="text-sm leading-relaxed text-bpim-muted">
                    <p>
                      beatmania IIDXのスコアを統計的に算出し、
                      皆伝平均を0、歴代全一を100として現在の実力を可視化する指標です。
                    </p>
                    <p className="mt-2">
                      詳細はnorimiso氏による「
                      <a
                        href="http://norimiso.web.fc2.com/aboutBPI.html"
                        target="_blank"
                        className="text-bpim-primary underline decoration-blue-400/30 underline-offset-4 hover:text-bpim-primary"
                      >
                        BPIについて
                      </a>
                      」をご参照ください。
                    </p>
                  </div>
                  <Separator className="bg-white/5" />
                  <p className="text-sm text-bpim-muted italic">
                    なお、BPIM及びBPIM2では、従来固定値(1.5)だった譜面係数を、実際のプレイデータに基づくユーザー分布から動的に算出しています。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <FeatureCard
              icon={Database}
              title="Cloud Storage"
              description="スコアデータはすべてサーバーに保存されるため、旧BPIMで発生していた意図しない消失は完全に解消されました。"
            />
            <FeatureCard
              icon={ArrowRightLeft}
              title="BPIM Legacy Sync"
              description="前作BPIManagerのアカウント情報をそのまま利用可能。Syncデータもスムーズに引き継げます。"
            />
            <FeatureCard
              icon={Cpu}
              title="Advanced Metrics"
              description="アリーナランク別平均や横断指標など、設計を一新したことで、従来にない高度な分析を提供します。"
            />
            <FeatureCard
              icon={Wrench}
              title="Developer API"
              description="REST APIを公開しており、自分の、あるいは公開されているライバルのデータを自由に外部から解析できます。"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Privacy Control"
              description="スコアの公開状態は完全に制御可能。安心して自身のデータに集中できます。"
            />
            <FeatureCard
              icon={UsersIcon}
              title="Rival Tracking"
              description="実力が近いユーザーを見つけだし、スコアの更新状況をリアルタイムにタイムライン形式で追いかけられます。競い合うことで限界を突破しましょう。"
            />
          </div>
        </PageContainer>
      </div>
    </DashboardLayout>
  );
}

const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-start rounded-xl border border-bpim-border bg-white/5 p-6 transition-colors hover:border-white/20">
    <div className="mb-4 flex items-center justify-center rounded-lg bg-bpim-primary/10 p-3 text-bpim-primary">
      <Icon className="h-6 w-6" />
    </div>
    <h5 className="mb-2 text-base font-bold text-bpim-text">{title}</h5>
    <p className="text-xs leading-relaxed text-bpim-muted">{description}</p>
  </div>
);
