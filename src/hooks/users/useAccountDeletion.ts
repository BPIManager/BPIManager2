import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

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
      const token = await fbUser.getIdToken();
      const res = await fetch(`${API_PREFIX}/users/${user.userId}/account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmUserName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "削除に失敗しました");
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
