import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { Settings2, ChevronDown, Plus, X } from "lucide-react";

import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import { PageContainer, PageHeader } from "@/components/partials/common/PageChrome/Header";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import { Button } from "@/components/ui/button";
import RequireAuth from "@/components/partials/shell/RequireAuth";
import { useUser } from "@/contexts/users/UserContext";

import { useMultiAnalyticsComparison } from "@/hooks/analytics/useMultiAnalyticsComparison";
import { MAX_ANALYTICS_TARGETS } from "@/constants/logic/analyticsComparison";
import { decodeTarget, encodeTarget } from "@/hooks/analytics/targetCodec";
import type { AnalyticsTarget } from "@/types/analytics";
import TargetSelectorModal from "@/components/partials/features/Analytics/TargetSelector";
import AnalyticsComparisonTable from "@/components/partials/features/Analytics/Table";
import { latestVersion } from "@/constants/iidx/iidxVersions";
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
  target,
  indexLabel,
  onClick,
  onRemove,
}: {
  target: AnalyticsTarget;
  /** 複数ターゲット時の列名(RIVAL1...)。単一ターゲットでは出さない */
  indexLabel?: string;
  onClick: () => void;
  /** 指定時のみ「外す」ボタンを出す（ターゲットが2件以上のとき） */
  onRemove?: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-bpim-border bg-bpim-surface",
        "text-sm font-bold text-bpim-text transition-all hover:border-bpim-primary/60 hover:bg-bpim-overlay",
      )}
    >
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 py-1.5 pl-4",
          onRemove ? "pr-2" : "pr-4",
        )}
      >
        {indexLabel && (
          <span className="text-[10px] font-bold tracking-widest text-bpim-warning">
            {indexLabel}
          </span>
        )}
        <span className="text-bpim-text">{target.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-bpim-muted" />
      </button>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={t("page.analytics.removeTarget")}
          className="mr-2 flex h-5 w-5 items-center justify-center rounded-full text-bpim-muted transition-colors duration-200 hover:bg-bpim-overlay hover:text-bpim-text"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { isLoading: isUserLoading, fbUser } = useUser();
  const { t } = useTranslation();

  /** セレクタの対象: 追加(new) / 既存ターゲットの差し替え(index) / 閉じている(null) */
  const [editing, setEditing] = useState<number | "new" | null>(null);

  // `target`クエリは複数指定(?target=a&target=b)に対応。1件のときは従来の単一指定と同じ形になる
  const targets: AnalyticsTarget[] = (() => {
    if (!router.isReady) return [];
    const raw = router.query.target;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return list
      .map((r) => decodeTarget(r))
      .filter((t): t is AnalyticsTarget => t !== null)
      .slice(0, MAX_ANALYTICS_TARGETS);
  })();

  const pushTargets = useCallback(
    (next: AnalyticsTarget[]) => {
      const encoded = next.map(encodeTarget);
      router.push(
        {
          pathname: "/analytics",
          query: {
            ...(encoded.length > 0 && {
              target: encoded.length === 1 ? encoded[0] : encoded,
            }),
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

  const handleTargetSelect = useCallback(
    (newTarget: AnalyticsTarget) => {
      if (editing === "new") pushTargets([...targets, newTarget]);
      else if (editing !== null)
        pushTargets(targets.map((t, i) => (i === editing ? newTarget : t)));
    },
    [editing, targets, pushTargets],
  );

  const version = (router.query.version as string) || latestVersion;

  const { songs, isLoading, error, labels, refresh } =
    useMultiAnalyticsComparison(targets, version);
  const canAdd = targets.length < MAX_ANALYTICS_TARGETS;

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
            targets.length === 0 ? (
              <Button
                onClick={() => setEditing("new")}
                variant="outline"
                className="border-bpim-border bg-bpim-surface text-bpim-text hover:bg-bpim-overlay"
              >
                <Settings2 className="mr-2 h-4 w-4" />
                {t("page.analytics.setTarget")}
              </Button>
            ) : undefined
          }
        />

        <PageContainer>
          {targets.length === 0 ? (
            <EmptyState onOpen={() => setEditing("new")} />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {targets.map((target, i) => (
                  <TargetBadge
                    key={`${target.kind}-${target.param ?? ""}-${i}`}
                    target={target}
                    indexLabel={targets.length > 1 ? `RIVAL${i + 1}` : undefined}
                    onClick={() => setEditing(i)}
                    onRemove={
                      targets.length > 1
                        ? () => pushTargets(targets.filter((_, j) => j !== i))
                        : undefined
                    }
                  />
                ))}
                <Button
                  onClick={() => setEditing("new")}
                  disabled={!canAdd}
                  title={canAdd ? undefined : t("page.analytics.addTargetLimit")}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-bpim-border bg-bpim-surface text-bpim-text hover:bg-bpim-overlay"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {t("page.analytics.addTarget")}
                </Button>
              </div>

              <div className="rounded-2xl border border-bpim-border bg-bpim-bg/40 p-1 shadow-xl backdrop-blur-md overflow-hidden">
                <AnalyticsComparisonTable
                  songs={songs}
                  isLoading={isLoading}
                  error={error}
                  rivalLabel={labels.join(" / ")}
                  labels={labels}
                  version={version}
                  onScoreSaved={refresh}
                />
              </div>
            </div>
          )}
        </PageContainer>

        <TargetSelectorModal
          isOpen={editing !== null}
          current={typeof editing === "number" ? (targets[editing] ?? null) : null}
          onSelect={handleTargetSelect}
          onClose={() => setEditing(null)}
        />
      </DashboardLayout>
    </RequireAuth>
  );
}
