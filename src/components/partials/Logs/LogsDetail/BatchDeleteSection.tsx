import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionConfirmDialog } from "../../Modal/Confirmation";
import { useBatchDelete } from "@/hooks/batches/useBatchDelete";
import { useTranslation } from "@/hooks/common/useTranslation";

interface Props {
  userId: string;
  batchId: string;
  version: string;
}

export const BatchDeleteSection = ({ userId, batchId, version }: Props) => {
  const { t } = useTranslation();
  const { isOpen, setIsOpen, isDeleting, handleDelete } = useBatchDelete(
    userId,
    batchId,
    version,
  );

  return (
    <>
      <div className="mt-8 flex justify-end border-t border-bpim-border pt-6">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-bpim-danger/50 bg-transparent px-4 text-xs font-bold text-bpim-danger hover:bg-bpim-danger/10"
          onClick={() => setIsOpen(true)}
        >
          <Trash2Icon className="mr-2 h-4 w-4" />
          {t("logs.detail.delete.button")}
        </Button>
      </div>

      <ActionConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title={t("logs.detail.delete.title")}
        description={t("logs.detail.delete.desc")}
        confirmLabel={t("logs.detail.delete.confirm")}
        isDestructive
        isLoading={isDeleting}
      />
    </>
  );
};
