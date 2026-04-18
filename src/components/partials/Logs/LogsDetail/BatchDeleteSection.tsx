import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionConfirmDialog } from "../../Modal/Confirmation";
import { useBatchDelete } from "@/hooks/batches/useBatchDelete";

interface Props {
  userId: string;
  batchId: string;
  version: string;
}

export const BatchDeleteSection = ({ userId, batchId, version }: Props) => {
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
          この更新を削除
        </Button>
      </div>

      <ActionConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="この更新を削除しますか？"
        description="この操作は取り消せません。この更新に紐づくスコアログが完全に削除されます。"
        confirmLabel="削除する"
        isDestructive
        isLoading={isDeleting}
      />
    </>
  );
};
