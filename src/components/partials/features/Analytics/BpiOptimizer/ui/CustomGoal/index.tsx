"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { useBpiOptimizerMemos } from "@/hooks/analytics/useOptimizeMemo";
import { fetchCustomGoalPreview } from "@/services/swr/analytics";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/common/useTranslation";
import CustomGoalCreatorUi from "./ui";
import type { CustomGoalTargetInput } from "./SongTargetModal";

const CustomGoalCreator = ({
  currentScores,
  initialTargets,
  onBack,
  onSaved,
  onDirtyChange,
}: {
  currentScores: Map<number, number | null>;
  /** 「曲目をインポート」で他ユーザーの共有reportIdから読み込んだ初期値。 */
  initialTargets?: CustomGoalTargetInput[];
  onBack: () => void;
  onSaved: () => void;
  /** 未保存の曲目が1つでもあるかを親へ伝える（離脱時の確認に使う）。 */
  onDirtyChange?: (isDirty: boolean) => void;
}) => {
  const { t } = useTranslation();
  const { user, fbUser } = useUser();
  const { saveMemo, isSaving } = useBpiOptimizerMemos(user?.userId, fbUser);

  const [targets, setTargets] = useState<CustomGoalTargetInput[]>(
    initialTargets ?? [],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [preview, setPreview] = useState<OptimizationResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!user?.userId || targets.length === 0) {
      setPreview(null);
      return;
    }
    const requestId = ++requestIdRef.current;
    setIsPreviewLoading(true);
    fetchCustomGoalPreview(
      user.userId,
      fbUser,
      targets.map((t) => ({ songId: t.songId, toExScore: t.toExScore })),
    )
      .then((result) => {
        if (requestIdRef.current === requestId) setPreview(result);
      })
      .catch(() => {
        if (requestIdRef.current === requestId) setPreview(null);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setIsPreviewLoading(false);
      });
  }, [targets, user?.userId, fbUser]);

  useEffect(() => {
    onDirtyChange?.(targets.length > 0);
    // 離脱時にも「未保存の曲目は無い」ことを親へ伝える
    return () => onDirtyChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets.length]);

  const handleAddClick = () => {
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleRemove = (index: number) => {
    setTargets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = (target: CustomGoalTargetInput) => {
    setTargets((prev) => {
      if (editingIndex != null) {
        const next = [...prev];
        next[editingIndex] = target;
        return next;
      }
      // 同じ曲を再度追加した場合は上書きする
      const existingIndex = prev.findIndex((t) => t.songId === target.songId);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = target;
        return next;
      }
      return [...prev, target];
    });
    setIsModalOpen(false);
    setEditingIndex(null);
  };

  const handleSave = async () => {
    if (!preview) return;
    await saveMemo(preview.targetTotalBpi, preview, "custom");
    toast.success(t("optimizer.customGoal.saved"));
    onSaved();
  };

  return (
    <CustomGoalCreatorUi
      targets={targets}
      currentScores={currentScores}
      onBack={onBack}
      onAddClick={handleAddClick}
      onEditClick={handleEditClick}
      onRemove={handleRemove}
      isModalOpen={isModalOpen}
      editingTarget={editingIndex != null ? targets[editingIndex] : undefined}
      onModalClose={() => {
        setIsModalOpen(false);
        setEditingIndex(null);
      }}
      onModalConfirm={handleConfirm}
      preview={preview}
      isPreviewLoading={isPreviewLoading}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
};

export default CustomGoalCreator;
