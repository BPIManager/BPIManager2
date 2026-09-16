import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/contexts/users/UserContext";
import {
  saveManualScore,
  type ManualScoreUpdateResult,
} from "@/services/swr/scores/manualUpdate";

/**
 * 画面上でのEXスコア手動入力・保存を行うフック。
 *
 * @param userId - 保存対象ユーザー ID（常に閲覧者自身）
 */
export const useManualScoreUpdate = (userId: string) => {
  const { fbUser } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  const save = async (params: {
    songId: number;
    songDomain: "bpi" | "allSongs";
    version: string;
    exScore: number;
  }): Promise<ManualScoreUpdateResult | null> => {
    if (!fbUser) return null;
    setIsSaving(true);
    try {
      const result = await saveManualScore(userId, params, fbUser);
      if (!result.ok) {
        toast.error(result.message || "保存に失敗しました");
        return null;
      }
      toast.success("保存しました");
      return result.data ?? null;
    } catch {
      toast.error("保存中にエラーが発生しました");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return { save, isSaving };
};
