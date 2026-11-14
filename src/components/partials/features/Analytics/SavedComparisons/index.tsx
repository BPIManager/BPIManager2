import { useState } from "react";
import { BookmarkPlus, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSavedComparisons } from "@/hooks/analytics/useSavedComparisons";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { AnalyticsTarget } from "@/types/analytics";
import type { SavedComparison } from "@/types/analytics/saved";
import { SaveComparisonDialog, SavedComparisonsDialog } from "./ui";

const NAME_MAX_LENGTH = 50;

interface SavedComparisonsActionsProps {
  /** 現在の比較条件（0件のときは保存ボタンを無効にする） */
  targets: AnalyticsTarget[];
  /** 保存済み条件を復元する（閲覧不可のターゲットは除外済み） */
  onLoad: (targets: AnalyticsTarget[]) => void;
}

const SavedComparisonsActions = ({
  targets,
  onLoad,
}: SavedComparisonsActionsProps) => {
  const { t } = useTranslation();
  const { comparisons, isLoading, create, rename, remove } = useSavedComparisons();
  const [saveOpen, setSaveOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const run = async (action: () => Promise<unknown>, successKey?: "analytics.saved.toastSaved") => {
    try {
      await action();
      if (successKey) toast.success(t(successKey));
      return true;
    } catch {
      toast.error(t("analytics.saved.toastError"));
      return false;
    }
  };

  const handleSave = async (name: string) => {
    setIsSaving(true);
    const ok = await run(() => create(name, targets), "analytics.saved.toastSaved");
    setIsSaving(false);
    if (ok) setSaveOpen(false);
  };

  const handleLoad = (item: SavedComparison) => {
    const accessible = item.targets
      .filter((x) => x.accessible)
      .map(({ kind, param, version, label }) => ({ kind, param, version, label }));
    if (accessible.length === 0) return;
    onLoad(accessible);
    setListOpen(false);
  };

  const defaultName = targets
    .map((x) => x.label)
    .join(" / ")
    .slice(0, NAME_MAX_LENGTH);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={targets.length === 0}
        onClick={() => setSaveOpen(true)}
        className="rounded-full border-bpim-border bg-bpim-surface text-bpim-text hover:bg-bpim-overlay"
      >
        <BookmarkPlus className="mr-1 h-4 w-4" />
        {t("analytics.saved.save")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setListOpen(true)}
        className="rounded-full border-bpim-border bg-bpim-surface text-bpim-text hover:bg-bpim-overlay"
      >
        <FolderOpen className="mr-1 h-4 w-4" />
        {t("analytics.saved.open")}
      </Button>

      {saveOpen && (
        <SaveComparisonDialog
          isOpen
          defaultName={defaultName}
          isSaving={isSaving}
          onSave={handleSave}
          onClose={() => setSaveOpen(false)}
        />
      )}
      <SavedComparisonsDialog
        isOpen={listOpen}
        comparisons={comparisons}
        isLoading={isLoading}
        onLoad={handleLoad}
        onRename={(id, name) => void run(() => rename(id, name))}
        onDelete={(id) => void run(() => remove(id))}
        onClose={() => setListOpen(false)}
      />
    </>
  );
};

export default SavedComparisonsActions;
