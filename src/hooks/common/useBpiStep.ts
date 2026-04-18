import { useState } from "react";
import {
  BPI_STEP_OPTIONS,
  BpiStep,
} from "@/components/partials/DashBoard/DistributionChart";

export const useBpiStep = (defaultSteps?: BpiStep) => {
  const [bpiStep, setBpiStep] = useState<BpiStep>(defaultSteps || 10);
  const idx = BPI_STEP_OPTIONS.indexOf(bpiStep);

  const handleStepFiner = () => {
    if (idx < BPI_STEP_OPTIONS.length - 1)
      setBpiStep(BPI_STEP_OPTIONS[idx + 1]);
  };
  const handleStepCoarser = () => {
    if (idx > 0) setBpiStep(BPI_STEP_OPTIONS[idx - 1]);
  };

  return {
    bpiStep,
    handleStepFiner,
    handleStepCoarser,
    canStepFiner: idx < BPI_STEP_OPTIONS.length - 1,
    canStepCoarser: idx > 0,
  };
};
