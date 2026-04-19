"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { Settings2, ChevronDown } from "lucide-react";

import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { Button } from "@/components/ui/button";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { useUser } from "@/contexts/users/UserContext";

import {
  decodeTarget,
  encodeTarget,
  useAnalyticsComparison,
} from "@/hooks/analytics/useAnalyticsComparison";
import type { AnalyticsTarget } from "@/types/analytics";
import { TargetSelectorModal } from "@/components/partials/Analytics/TargetSelector/ui";
import { AnalyticsComparisonTable } from "@/components/partials/Analytics/Table";
import { latestVersion } from "@/constants/latestVersion";
import { cn } from "@/lib/utils";

const EmptyState = ({ onOpen }: { onOpen: () => void }) => (
  <div className="flex flex-col items-center justify-center gap-6 py-24 px-6 text-center">
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold text-bpim-text">
        比較対象が設定されていません
      </h2>
      <p className="text-sm text-bpim-muted max-w-xs">
        ライバル・アリーナ平均・AAA達成スコアなど、
        さまざまな指標と自分のスコアを比較できます。
      </p>
    </div>
    <Button
      onClick={onOpen}
      className="bg-bpim-primary font-bold text-white hover:bg-bpim-primary/80 px-8"
    >
      比較対象を選択する
    </Button>
  </div>
);

const TargetBadge = ({
  target,
  onClick,
}: {
  target: AnalyticsTarget;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border border-bpim-border bg-bpim-surface px-4 py-1.5",
        "text-sm font-bold text-bpim-text transition-all hover:border-bpim-primary/60 hover:bg-bpim-overlay",
      )}
    >
      <span className="text-bpim-text">{target.label}</span>
      <ChevronDown className="h-3.5 w-3.5 text-bpim-muted" />
    </button>
  );
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { isLoading: isUserLoading, fbUser } = useUser();

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const target: AnalyticsTarget | null = (() => {
    if (!router.isReady) return null;
    const raw = router.query.target as string | undefined;
    if (!raw) return null;
    return decodeTarget(raw);
  })();

  const handleTargetSelect = useCallback(
    (newTarget: AnalyticsTarget) => {
      router.push(
        {
          pathname: "/analytics",
          query: {
            target: encodeTarget(newTarget),
            levels: "11,12",
            difficulties: "ANOTHER,LEGGENDARIA,HYPER",
            page: "1",
          },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  const version = (router.query.version as string) || latestVersion;

  const { songs, isLoading, error, rivalLabel } = useAnalyticsComparison(
    target,
    version,
  );

  if (!router.isReady || isUserLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[90vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-bpim-border border-t-bpim-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!fbUser) {
    return (
      <DashboardLayout>
        <LoginRequiredCard />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Meta title="比較" noIndex />

      <PageHeader
        title="比較"
        description="任意の対象と自分のスコアを比較します"
        rightElement={
          target ? (
            <div className="flex items-center gap-2">
              <TargetBadge
                target={target}
                onClick={() => setIsSelectorOpen(true)}
              />
            </div>
          ) : (
            <Button
              onClick={() => setIsSelectorOpen(true)}
              variant="outline"
              className="border-bpim-border bg-bpim-surface text-bpim-text hover:bg-bpim-overlay"
            >
              <Settings2 className="mr-2 h-4 w-4" />
              比較対象を設定
            </Button>
          )
        }
      />

      <PageContainer>
        {!target ? (
          <EmptyState onOpen={() => setIsSelectorOpen(true)} />
        ) : (
          <div className="rounded-2xl border border-bpim-border bg-bpim-bg/40 p-1 shadow-xl backdrop-blur-md overflow-hidden">
            <AnalyticsComparisonTable
              songs={songs}
              isLoading={isLoading}
              error={error}
              rivalLabel={rivalLabel}
              target={target}
            />
          </div>
        )}
      </PageContainer>

      <TargetSelectorModal
        isOpen={isSelectorOpen}
        current={target}
        onSelect={handleTargetSelect}
        onClose={() => setIsSelectorOpen(false)}
      />
    </DashboardLayout>
  );
}
