import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { SavedComparison } from "@/types/analytics/saved";

const NAME_MAX_LENGTH = 50;

export const SaveComparisonDialog = ({
  isOpen,
  defaultName,
  isSaving,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  defaultName: string;
  isSaving: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultName);
  const trimmed = name.trim();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("analytics.saved.saveTitle")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Input
            value={name}
            maxLength={NAME_MAX_LENGTH}
            placeholder={t("analytics.saved.namePlaceholder")}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && trimmed && !isSaving) onSave(trimmed);
            }}
            autoFocus
          />
          <p className="text-xs text-bpim-muted">{t("analytics.saved.conditionOnly")}</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!trimmed || isSaving}
            onClick={() => onSave(trimmed)}
            className="bg-bpim-primary font-bold text-white hover:bg-bpim-primary/80"
          >
            {t("analytics.saved.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SavedRow = ({
  item,
  onLoad,
  onRename,
  onDelete,
}: {
  item: SavedComparison;
  onLoad: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const accessibleCount = item.targets.filter((x) => x.accessible).length;
  const submitRename = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== item.name) onRename(trimmed);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-bpim-border bg-bpim-surface-2/60 p-3">
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <Input
              value={name}
              maxLength={NAME_MAX_LENGTH}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitRename()}
              autoFocus
            />
            <Button size="icon-sm" variant="ghost" onClick={submitRename} aria-label={t("common.save")}>
              <Check />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => setEditing(false)} aria-label={t("common.cancel")}>
              <X />
            </Button>
          </>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-bpim-text">
              {item.name}
            </span>
            <Button size="icon-sm" variant="ghost" onClick={() => setEditing(true)} aria-label={t("analytics.saved.rename")}>
              <Pencil />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={onDelete} aria-label={t("analytics.saved.delete")}>
              <Trash2 />
            </Button>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {item.targets.map((target, i) => (
          <span
            key={`${target.kind}-${target.param ?? ""}-${i}`}
            className={
              target.accessible
                ? "rounded-full border border-bpim-border px-2 py-0.5 text-xs text-bpim-text"
                : "rounded-full border border-bpim-danger/40 px-2 py-0.5 text-xs text-bpim-danger"
            }
          >
            {target.accessible ? target.label : t("analytics.saved.inaccessible")}
          </span>
        ))}
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={accessibleCount === 0}
          onClick={onLoad}
          className="bg-bpim-primary font-bold text-white hover:bg-bpim-primary/80"
        >
          {t("analytics.saved.load")}
        </Button>
      </div>
    </div>
  );
};

export const SavedComparisonsDialog = ({
  isOpen,
  comparisons,
  isLoading,
  onLoad,
  onRename,
  onDelete,
  onClose,
}: {
  isOpen: boolean;
  comparisons: SavedComparison[];
  isLoading: boolean;
  onLoad: (item: SavedComparison) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("analytics.saved.listTitle")}</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
          {isLoading ? null : comparisons.length === 0 ? (
            <p className="py-6 text-center text-sm text-bpim-muted">
              {t("analytics.saved.empty")}
            </p>
          ) : (
            comparisons.map((item) => (
              <SavedRow
                key={item.id}
                item={item}
                onLoad={() => onLoad(item)}
                onRename={(name) => onRename(item.id, name)}
                onDelete={() => onDelete(item.id)}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
