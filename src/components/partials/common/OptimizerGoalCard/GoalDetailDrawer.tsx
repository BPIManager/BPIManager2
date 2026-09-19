import { useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { Calendar, Share2, Copy, Check, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { fetchSongContribution } from "@/services/swr/analytics";
import { GoalBpiJourney, GoalSongCard } from "./GoalCard";
import {
  buildStepProgress,
  sortStepsByOrder,
  STEP_SORT_ORDERS,
  type StepSortOrder,
} from "./index";
import type { OptimizeMemo } from "@/hooks/analytics/useOptimizeMemo";
import { useTranslation } from "@/hooks/common/useTranslation";

/** reportIdをコピーして他ユーザーに共有するためのモーダル（曲目のインポートに使う）。 */
const ShareGoalModal = ({
  reportId,
  isOpen,
  onClose,
}: {
  reportId: string | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!reportId) return;
    try {
      await navigator.clipboard.writeText(reportId);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setCopied(false);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-[90vw] sm:max-w-md border-bpim-border bg-bpim-bg">
        <DialogHeader>
          <DialogTitle>{t("optimizer.memo.shareTitle")}</DialogTitle>
        </DialogHeader>
        <p className="text-xs leading-relaxed text-bpim-muted">
          {t("optimizer.memo.shareDesc")}
        </p>
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-bpim-border bg-bpim-surface p-2">
          <code className="min-w-0 flex-1 truncate font-mono text-xs text-bpim-text">
            {reportId}
          </code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? t("optimizer.memo.copied") : t("optimizer.memo.copy")}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("optimizer.customGoal.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * 目標1件の詳細（達成状況＋曲一覧）をVaulドロワーで表示する。
 * ダッシュボードの「目標達成状況」ウィジェットと「目標管理」タブの
 * 両方から同じ見た目で呼び出せるよう、`common/`に置く共有コンポーネント。
 */
export const GoalDetailDrawer = ({
  memo,
  currentScores,
  currentBpis,
  liveCurrentTotalBpi,
  isOpen,
  onClose,
  userId,
  fbUser,
}: {
  memo: OptimizeMemo | null;
  currentScores: Map<number, number | null>;
  currentBpis: Map<number, number | null>;
  liveCurrentTotalBpi: number | null;
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  fbUser?: FirebaseUser | null;
}) => {
  const { t } = useTranslation();
  const [contributions, setContributions] = useState<Map<
    number,
    number
  > | null>(null);
  const [sortOrder, setSortOrder] = useState<StepSortOrder>("added");
  const [isShareOpen, setIsShareOpen] = useState(false);

  const steps = memo ? buildStepProgress(memo, currentScores, currentBpis) : [];

  useEffect(() => {
    const reportId = memo?.reportId;
    if (!isOpen || !userId || !reportId || steps.length === 0) return;
    let cancelled = false;
    fetchSongContribution(
      userId,
      fbUser,
      steps.map((s) => ({ songId: s.songId, baselineExScore: s.fromExScore })),
    )
      .then((res) => {
        if (cancelled) return;
        setContributions(
          new Map(res.contributions.map((c) => [c.songId, c.contribution])),
        );
      })
      .catch(() => {
        if (!cancelled) setContributions(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, memo?.reportId, userId]);

  if (!memo) return null;
  const isAuto = memo.kind !== "custom";
  const sortedSteps = sortStepsByOrder(steps, sortOrder);

  return (
    <>
      <Drawer
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setContributions(null);
            setSortOrder("added");
            onClose();
          }
        }}
      >
        <DrawerContent className="flex min-h-0 flex-col">
          <DrawerHeader className="flex-row shrink-0 items-center justify-between gap-2 text-left">
            <DrawerTitle className="flex min-w-0 items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "shrink-0 text-xs",
                  isAuto
                    ? "bg-bpim-overlay"
                    : "bg-bpim-primary/15 text-bpim-primary",
                )}
              >
                {isAuto
                  ? t("optimizer.memo.kind.auto")
                  : t("optimizer.memo.kind.custom")}
              </Badge>
              <span className="flex shrink-0 items-center gap-1 text-xs font-normal text-bpim-subtle">
                <Calendar className="h-3 w-3" />
                {new Date(memo.createdAt).toLocaleDateString()}
              </span>
            </DrawerTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setIsShareOpen(true)}
            >
              <Share2 className="h-3.5 w-3.5" />
              {t("optimizer.memo.shareShort")}
            </Button>
          </DrawerHeader>

          <div className="shrink-0 border-b border-bpim-border px-4 pb-3">
            <GoalBpiJourney
              memo={memo}
              liveCurrentTotalBpi={liveCurrentTotalBpi}
              steps={steps}
              isExpanded
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-3 custom-scrollbar">
            {steps.length > 1 && (
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      title={t(`optimizer.memo.stepSort.${sortOrder}`)}
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      {t(`optimizer.memo.stepSort.${sortOrder}`)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {STEP_SORT_ORDERS.map((order) => (
                      <DropdownMenuCheckboxItem
                        key={order}
                        checked={sortOrder === order}
                        onCheckedChange={() => setSortOrder(order)}
                      >
                        {t(`optimizer.memo.stepSort.${order}`)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            {sortedSteps.map((step) => (
              <GoalSongCard
                key={step.songId}
                step={step}
                contribution={contributions?.get(step.songId) ?? null}
              />
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <ShareGoalModal
        reportId={memo.reportId}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </>
  );
};
