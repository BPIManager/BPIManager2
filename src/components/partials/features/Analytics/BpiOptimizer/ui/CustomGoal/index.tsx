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
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved: () => void;
}) => {
  const { t } = useTranslation();
  const { user, fbUser } = useUser();
  const { saveMemo, isSaving } = useBpiOptimizerMemos(user?.userId, fbUser);

  const [targets, setTargets] = useState<CustomGoalTargetInput[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [preview, setPreview] = useState<OptimizationResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!user?.userId || targets.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
