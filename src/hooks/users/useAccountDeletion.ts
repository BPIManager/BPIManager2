import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { deleteAccount } from "@/services/swr/accountDeletion";

export const useAccountDeletion = () => {
  const { user, fbUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmUserName, setConfirmUserName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed =
    !!user && confirmUserName.trim() === user.userName;

  const handleOpen = () => {
    setConfirmUserName("");
    setIsOpen(true);
  };

  const handleClose = () => {
    setConfirmUserName("");
    setIsOpen(false);
  };

  const handleDelete = async () => {
    if (!fbUser || !user || !isConfirmed) return;
    setIsDeleting(true);
    try {
      const result = await deleteAccount(user.userId, fbUser, confirmUserName);
      if (!result.ok) {
        toast.error(result.message || "削除に失敗しました");
        return;
      }

      toast.success("アカウントを削除しました");
      // Firebase クライアントからもサインアウト
      await auth.signOut();
      // リロードでトップへ
      window.location.href = "/";
    } catch {
      toast.error("削除中にエラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isOpen,
    handleOpen,
    handleClose,
    confirmUserName,
    setConfirmUserName,
    isConfirmed,
    isDeleting,
    handleDelete,
    userName: user?.userName ?? "",
  };
};
