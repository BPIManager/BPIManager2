import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoginRequiredCard } from "@/components/partials/common/Auth/LoginRequired/ui";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: "loginRequired" | "addAccount";
}

function LoginDialog({ isOpen, onClose, variant }: LoginDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-none bg-transparent p-0 shadow-none outline-none">
        <LoginRequiredCard isModal variant={variant} />
      </DialogContent>
    </Dialog>
  );
}

export default LoginDialog;
