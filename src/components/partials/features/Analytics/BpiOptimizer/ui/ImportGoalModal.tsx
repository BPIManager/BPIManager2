import { useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { CircleDashed } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  fetchImportOptimizeMemo,
  type ImportedGoalTarget,
} from "@/services/swr/analytics";
import { useTranslation } from "@/hooks/common/useTranslation";

/** 他ユーザーが共有したreportIdを入力させ、曲目をカスタム目標作成画面に取り込む。 */
const ImportGoalModal = ({
  isOpen,
  onClose,
  userId,
  fbUser,
  onImported,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  fbUser?: FirebaseUser | null;
  onImported: (targets: ImportedGoalTarget[]) => void;
}) => {
  const { t } = useTranslation();
  const [reportId, setReportId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    const trimmed = reportId.trim();
    if (!trimmed || !userId) return;
    setIsLoading(true);
    try {
      const targets = await fetchImportOptimizeMemo(userId, fbUser, trimmed);
      if (targets.length === 0) {
        toast.error(t("optimizer.import.empty"));
        return;
      }
      onImported(targets);
      setReportId("");
    } catch {
      toast.error(t("optimizer.import.notFound"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setReportId("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-[90vw] sm:max-w-md border-bpim-border bg-bpim-bg">
        <DialogHeader>
          <DialogTitle>{t("optimizer.import.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-xs leading-relaxed text-bpim-muted">
          {t("optimizer.import.desc")}
        </p>
        <Input
          autoFocus
          value={reportId}
          onChange={(e) => setReportId(e.target.value)}
          placeholder={t("optimizer.import.placeholder")}
          className="h-9 font-mono"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("optimizer.customGoal.cancel")}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!reportId.trim() || isLoading}
            className="gap-2"
          >
            {isLoading && <CircleDashed className="h-4 w-4 animate-spin" />}
            {t("optimizer.import.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportGoalModal;
