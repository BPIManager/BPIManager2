import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { toast } from "sonner";
import { useRouter } from "next/router";

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
      const token = await fbUser.getIdToken();
      const res = await fetch(
        `${API_PREFIX}/users/${userId}/batches/${batchId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "削除に失敗しました");
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
