import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/common/useTranslation";
import { ZoomIn, ZoomOut } from "lucide-react";

export interface StepControl {
  step: number;
  onStepFiner: () => void;
  onStepCoarser: () => void;
  canStepFiner: boolean;
  canStepCoarser: boolean;
}

const HistogramStepControl = ({
  step,
  onStepFiner,
  onStepCoarser,
  canStepFiner,
  canStepCoarser,
}: StepControl) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center rounded-md border border-bpim-border">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onStepCoarser}
        disabled={!canStepCoarser}
        className="rounded-r-none border-r border-bpim-border"
        title={t("dashboard.distribution.zoomOut")}
      >
        <ZoomOut />
      </Button>
      <span className="px-2 text-xs font-bold text-bpim-muted tabular-nums">
        {step}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onStepFiner}
        disabled={!canStepFiner}
        className="rounded-l-none border-l border-bpim-border"
        title={t("dashboard.distribution.zoomIn")}
      >
        <ZoomIn />
      </Button>
    </div>
  );
};

export default HistogramStepControl;
