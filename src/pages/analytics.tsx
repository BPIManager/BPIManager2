"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Settings2, ChevronDown } from "lucide-react";

import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import { PageContainer, PageHeader } from "@/components/partials/common/PageChrome/Header";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import { Button } from "@/components/ui/button";
import RequireAuth from "@/components/partials/shell/RequireAuth";
import { useUser } from "@/contexts/users/UserContext";

import { useAnalyticsComparison } from "@/hooks/analytics/useAnalyticsComparison";
import { useMultiAnalyticsComparison } from "@/hooks/analytics/useMultiAnalyticsComparison";
import { decodeTarget, decodeTargets, encodeTargets } from "@/hooks/analytics/targetCodec";
import type { AnalyticsTarget } from "@/types/analytics";
import TargetSelectorModal from "@/components/partials/features/Analytics/TargetSelector";
import AnalyticsComparisonTable from "@/components/partials/features/Analytics/Table";
import AnalyticsMultiComparisonTable from "@/components/partials/features/Analytics/MultiTable";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { MAX_COMPARISON_TARGETS } from "@/constants/logic/analyticsComparison";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";

const EmptyState = ({ onOpen }: { onOpen: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-bpim-text">
          {t("page.analytics.noTarget")}
        </h2>
        <p className="text-sm text-bpim-muted max-w-xs">
          {t("page.analytics.targetDesc")}
        </p>
      </div>
      <Button
        onClick={onOpen}
        className="bg-bpim-primary font-bold text-white hover:bg-bpim-primary/80 px-8"
      >
        {t("page.analytics.selectTarget")}
      </Button>
    </div>
  );
};

const TargetBadge = ({
  targets,
  onClick,
}: {
  targets: AnalyticsTarget[];
  onClick: () => void;
}) => {
  const { tFormat } = useTranslation();
  const label =
    targets.length === 1
      ? targets[0].label
      : tFormat("analytics.selectedCount", {
          count: targets.length + 1,
          max: MAX_COMPARISON_TARGETS,
        });
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border border-bpim-border bg-bpim-surface px-4 py-1.5",
        "text-sm font-bold text-bpim-text transition-all hover:border-bpim-primary/60 hover:bg-bpim-overlay",
      )}
    >
      <span className="text-bpim-text">{label}</span>
      <ChevronDown className="h-3.5 w-3.5 text-bpim-muted" />
    </button>
  );
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { isLoading: isUserLoading, fbUser } = useUser();
  const { t } = useTranslation();

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // 複数ターゲット比較(#287)。`targets`(複数)を正とし、旧`target`(単一)の
  // 既存リンクも後方互換で読めるようにする
  const targets: AnalyticsTarget[] = useMemo(() => {
    if (!router.isReady) return [];
    const multi = router.query.targets as string | undefined;
    if (multi) return decodeTargets(multi);
    const single = router.query.target as string | undefined;
    if (single) {
      const t = decodeTarget(single);
      return t ? [t] : [];
    }
    return [];
  }, [router.isReady, router.query.targets, router.query.target]);

  const handleTargetsChange = useCallback(
    (newTargets: AnalyticsTarget[]) => {
      router.push(
        {
          pathname: "/analytics",
          query: {
            targets: encodeTargets(newTargets),
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

  // 1件のみ選択時は既存の単一ターゲット比較フックをそのまま使う(regressionなし)
  const isMulti = targets.length > 1;
  const singleTarget = targets.length === 1 ? targets[0] : null;

  const single = useAnalyticsComparison(singleTarget, version);
  const multi = useMultiAnalyticsComparison(isMulti ? targets : [], version);

  return (
    <RequireAuth
      isLoading={!router.isReady || isUserLoading}
      isAuthenticated={!!fbUser}
    >
      <DashboardLayout>
        <Meta title={t("page.analytics.title")} noIndex />

        <PageHeader
          title={t("page.analytics.title")}
          description={t("page.analytics.desc")}
          rightElement={
            targets.length > 0 ? (
              <div className="flex items-center gap-2">
                <TargetBadge
                  targets={targets}
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
                {t("page.analytics.setTarget")}
              </Button>
            )
          }
        />

        <PageContainer>
          {targets.length === 0 ? (
            <EmptyState onOpen={() => setIsSelectorOpen(true)} />
          ) : (
            <div className="rounded-2xl border border-bpim-border bg-bpim-bg/40 p-1 shadow-xl backdrop-blur-md overflow-hidden">
              {isMulti ? (
                <AnalyticsMultiComparisonTable
                  songs={multi.songs}
                  targets={targets}
                  isLoading={multi.isLoading}
                  error={multi.error}
                />
              ) : (
                <AnalyticsComparisonTable
                  songs={single.songs}
                  isLoading={single.isLoading}
                  error={single.error}
                  rivalLabel={single.rivalLabel}
                />
              )}
            </div>
          )}
        </PageContainer>

        <TargetSelectorModal
          isOpen={isSelectorOpen}
          current={targets}
          onChange={handleTargetsChange}
          onClose={() => setIsSelectorOpen(false)}
        />
      </DashboardLayout>
    </RequireAuth>
  );
}
