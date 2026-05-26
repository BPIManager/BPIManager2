import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: {
    summary?: HTMLElement | null;
    ranking?: HTMLElement | null;
    list?: HTMLElement | null;
  };
  shareData: { bpi: number; diff: number; rank: number; updateCount: number };
  onShare: (
    element: HTMLElement | null,
    text: string,
    width?: number,
  ) => Promise<boolean>;
  isSharing: boolean;
  handleTabChange: (details: { value: string }) => void;
}

export const ShareResultModal = ({
  isOpen,
  onClose,
  shareData,
  onShare,
  isSharing,
  handleTabChange,
  elements,
}: ShareModalProps) => {
  const { t } = useTranslation();
  const [shareType, setShareType] = useState("summary");

  const handleExecute = async () => {
    const target =
      shareType === "summary"
        ? elements.summary
        : shareType === "ranking"
          ? elements.ranking
          : elements.list;
    if (!target) return;
    const text = `${t("share.tweet.header")}\n${t("share.tweet.updateCount")}${shareData.updateCount}${t("share.tweet.countUnit")}\n\n${t("share.tweet.totalBpi")} ${shareData.bpi.toFixed(2)} (${shareData.diff >= 0 ? "+" : ""}${shareData.diff.toFixed(2)})\n${t("share.tweet.estimatedRank")} ${shareData.rank.toLocaleString()}${t("share.tweet.rankUnit")} #BPIM2 #IIDX\n${window.location.href}`;
    if (await onShare(target, text)) onClose();
  };

  const options = [
    {
      id: "summary",
      label: t("share.option.summary.label"),
      desc: t("share.option.summary.desc"),
    },
    {
      id: "ranking",
      label: t("share.option.ranking.label"),
      desc: t("share.option.ranking.desc"),
    },
    {
      id: "list",
      label: t("share.option.list.label"),
      desc: t("share.option.list.desc"),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm border-bpim-border bg-bpim-bg text-bpim-text shadow-2xl rounded-2xl">
        <DialogHeader className="border-b border-bpim-border pb-4">
          <DialogTitle className="text-lg font-bold">{t("share.title")}</DialogTitle>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-4">
          <p className="text-[11px] leading-relaxed text-bpim-muted">
            {t("share.description")}
          </p>

          <RadioGroup
            value={shareType}
            onValueChange={(val) => {
              setShareType(val);
              handleTabChange({ value: val === "list" ? "songs" : "summary" });
            }}
            className="flex flex-col gap-4"
          >
            {options.map((opt) => (
              <div
                key={opt.id}
                className="flex items-start gap-3 space-x-2 rounded-lg border border-bpim-border bg-bpim-surface-2/60 p-3 transition-colors hover:bg-bpim-overlay"
              >
                <RadioGroupItem
                  value={opt.id}
                  id={opt.id}
                  className="mt-1 border-bpim-primary text-bpim-text"
                />
                <Label
                  htmlFor={opt.id}
                  className="flex flex-col gap-1 cursor-pointer items-start"
                >
                  <span className="text-sm font-bold text-bpim-text">
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-bpim-muted leading-tight">
                    {opt.desc}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSharing}
            className="flex-1 text-bpim-muted"
          >
            {t("common.cancel")}
          </Button>
          <Button
            disabled={isSharing}
            onClick={handleExecute}
            className="flex-1 bg-bpim-primary font-bold hover:bg-bpim-primary"
          >
            {isSharing ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : null}
            {isSharing ? t("share.processing") : t("share.share")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
