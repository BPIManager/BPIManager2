import { useEffect, useState } from "react";
import { CircleDashed } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";

const SingleBpiTargetDrawer = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (targetBpi: number) => void;
  isLoading?: boolean;
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  // モーダルを開くたびに前回の入力を消す
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) setValue("");
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const parsed = parseFloat(value);
  const isValid = value.trim() !== "" && !isNaN(parsed);

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(parsed);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="z-1012" overlayClassName="z-1010">
        <DrawerHeader>
          <DrawerTitle>{t("optimizer.singleBpiTarget.drawerTitle")}</DrawerTitle>
        </DrawerHeader>

        <div className="flex min-h-0 flex-col gap-2 px-4 pb-8">
          <Label className="text-xs font-black text-bpim-muted uppercase tracking-tighter">
            {t("optimizer.singleBpiTarget.inputLabel")}
          </Label>
          <Input
            type="number"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="50"
            className={cn(
              "h-12 text-lg font-mono pl-4 bg-bpim-bg border-2 transition-all",
              value.trim() !== "" && !isValid
                ? "border-bpim-danger"
                : "border-bpim-border focus:border-bpim-primary",
            )}
          />
          {value.trim() !== "" && !isValid && (
            <p className="text-xs text-bpim-danger">
              {t("optimizer.singleBpiTarget.invalidInput")}
            </p>
          )}
        </div>

        <DrawerFooter className="border-t border-bpim-border pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className="w-full gap-2"
          >
            {isLoading && <CircleDashed className="h-4 w-4 animate-spin" />}
            {t("optimizer.singleBpiTarget.submit")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default SingleBpiTargetDrawer;
