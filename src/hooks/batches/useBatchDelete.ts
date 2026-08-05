import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { deleteBatch } from "@/services/swr/batchDelete";

export const useBatchDelete = (
  userId: string,
  batchId: string,
  version: string,
) => {
  const { fbUser } = useUser();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!fbUser) return;
    setIsDeleting(true);
    try {
      const result = await deleteBatch(userId, batchId, fbUser);
      if (!result.ok) {
        toast.error(result.message || "削除に失敗しました");
        return;
      }

      toast.success("バッチデータを削除しました");
      setIsOpen(false);
      router.push(`/users/${userId}/logs/${version}`);
    } catch {
      toast.error("削除中にエラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isOpen,
    setIsOpen,
    isDeleting,
    handleDelete,
  };
};
