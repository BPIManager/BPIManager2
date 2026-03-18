"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isConfirmDisabled?: boolean;
  isLoading?: boolean;
}

export const ActionConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "実行",
  cancelLabel = "キャンセル",
  isDestructive = false,
  isConfirmDisabled = false,
  isLoading = false,
}: Props) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isLoading && onClose()}
    >
      <DialogContent className="max-w-[90vw] sm:max-w-md border-bpim-border bg-bpim-bg p-0 overflow-hidden shadow-2xl rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-bpim-border">
          <DialogTitle className="flex items-center gap-3 text-lg font-bold text-bpim-text">
            {isDestructive && (
              <AlertTriangle className="h-5 w-5 text-bpim-danger shrink-0" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 py-8">
          {typeof description === "string" ? (
            <DialogDescription className="text-sm leading-relaxed text-bpim-muted">
              {description}
            </DialogDescription>
          ) : (
            <div className="text-sm text-bpim-text">{description}</div>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-3 p-8 bg-bpim-bg/20 border-t border-bpim-border sm:flex-row">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 text-bpim-muted hover:text-bpim-text hover:bg-bpim-overlay/50"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isConfirmDisabled || isLoading}
            className={cn(
              "h-9 px-6 font-bold transition-all min-w-[100px]",
              isDestructive
                ? "bg-bpim-danger hover:bg-bpim-danger text-bpim-text"
                : "bg-bpim-primary hover:bg-bpim-primary text-bpim-text",
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
