import { DashCard } from "@/components/ui/dashcard";
import NextLink from "next/link";
import { Import, Settings, BookOpenText } from "lucide-react";
import { LottieAnimation } from "@/components/ui/lottie-animation";
import ghostAnimation from "@/assets/lottie/ghost.json";

export const NoDataAlert = () => {
  const DOCS_URL =
    "https://www.notion.so/BPIM2-32a9989ca87a80829561f4b9618f1d6f";

  return (
    <DashCard className="my-6 border-2 border-dashed border-bpim-primary/30 bg-bpim-primary/5 p-8 text-center transition-all hover:border-bpim-primary/50">
      <div className="flex flex-col items-center">
        <div className="relative mb-4 flex h-18 w-18 items-center justify-center overflow-hidden rounded-full bg-bpim-primary/10">
          <LottieAnimation
            animationData={ghostAnimation}
            loop={true}
            size={40}
          />
        </div>

        <h3 className="text-xl font-black text-bpim-text tracking-tight">
          おっと！まだデータが登録されていないようです...
        </h3>

        <p className="mt-3 max-w-lg text-sm leading-relaxed text-bpim-muted">
          スコアデータを読み込むことで、詳細な分析機能を利用できるようになります。
          まずは以下のいずれかの手順でデータを準備しましょう！
        </p>

        <p className="mt-3 max-w-lg text-xs leading-relaxed text-bpim-muted/80">
          BPIM2ではアーケード版IIDX又はINFINITASのスコアを登録できます。
          <br />
          詳細はインポートページの説明またはドキュメントをご確認ください。
        </p>

        <div className="mt-8 grid w-full max-w-2xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionLink
            href="/import"
            icon={<Import className="h-5 w-5" />}
            title="新規インポート"
            description="公式サイト等からデータを登録"
          />
          <ActionLink
            href="/settings"
            icon={<Settings className="h-5 w-5" />}
            title="データを移行"
            description="旧BPIManagerから引き継ぎ"
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
              使い方の確認
            </span>
            <span className="text-[10px] text-bpim-muted leading-tight">
              困った時はドキュメントへ
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
