import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoginRequiredCard } from "./ui";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-none bg-transparent p-0 shadow-none outline-none">
        <LoginRequiredCard />
      </DialogContent>
    </Dialog>
  );
}
