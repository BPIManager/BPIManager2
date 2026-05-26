import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeX, Trash2 } from "lucide-react";
import { ActionConfirmDialog } from "../../Modal/Confirmation";
import { useAccountDeletion } from "@/hooks/users/useAccountDeletion";
import { useTranslation } from "@/hooks/common/useTranslation";

export default function AccountDeletionUi() {
  const {
    isOpen,
    handleOpen,
    handleClose,
    confirmUserName,
    setConfirmUserName,
    isConfirmed,
    isDeleting,
    handleDelete,
    userName,
  } = useAccountDeletion();
  const { t } = useTranslation();

  return (
    <>
      <div className="mt-4 flex flex-col gap-6 rounded-xl border border-red-900/30 bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-bpim-danger">
            <BadgeX className="h-4 w-4" />
            <span className="font-bold">{t("settings.deletion.title")}</span>
          </div>
          <p className="text-sm text-bpim-muted">
            {t("settings.deletion.desc")}
          </p>
          <p className="text-[10px] text-bpim-muted italic">
            {t("settings.deletion.irreversible")}
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleOpen}
          className="w-full md:w-auto gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {t("common.confirm")}
        </Button>
      </div>

      <ActionConfirmDialog
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleDelete}
        isDestructive
        isLoading={isDeleting}
        isConfirmDisabled={!isConfirmed}
        title={t("settings.deletion.dialogTitle")}
        confirmLabel={t("common.delete")}
        description={
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-sm text-bpim-muted">
              <span>{t("settings.deletion.warning")}</span>
              <span>
                {t("settings.deletion.confirmPrompt")}
                <strong className="text-bpim-text font-mono">{userName}</strong>
                {t("settings.deletion.confirmPromptSuffix")}
              </span>
            </div>
            <Input
              value={confirmUserName}
              onChange={(e) => setConfirmUserName(e.target.value)}
              placeholder={userName}
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>
        }
      />
    </>
  );
}
