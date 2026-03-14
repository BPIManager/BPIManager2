import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogActionTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { AlertTriangleIcon } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && !isLoading && onClose()}
      placement="center"
      role={isDestructive ? "alertdialog" : "dialog"}
    >
      <DialogContent bg="bg.panel" borderRadius="xl" p={4}>
        <DialogHeader borderBottomWidth="1px" pb={4}>
          <DialogTitle display="flex" alignItems="center" gap={2}>
            {isDestructive && (
              <AlertTriangleIcon
                color="var(--chakra-colors-red-500)"
                size={20}
              />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>

        <DialogBody py={6}>
          {typeof description === "string" ? (
            <Text color="fg.muted" textStyle="sm">
              {description}
            </Text>
          ) : (
            description
          )}
        </DialogBody>

        <DialogFooter borderTopWidth="1px" pt={4} gap={3}>
          <DialogActionTrigger asChild>
            <Button px={2} variant="outline" disabled={isSubmitting}>
              {cancelLabel}
            </Button>
          </DialogActionTrigger>
          <Button
            px={2}
            colorPalette={isDestructive ? "red" : "blue"}
            loading={isLoading}
            onClick={onConfirm}
            disabled={isConfirmDisabled || isSubmitting}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
