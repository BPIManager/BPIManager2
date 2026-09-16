"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { versionsNonDisabledCollection } from "@/constants/iidx/versionTitles";
import { useTranslation } from "@/hooks/common/useTranslation";

const VersionSelect = ({
  version,
  onChange,
}: {
  version: string;
  onChange: (value: string) => void;
}) => {
  const { t } = useTranslation();

  return (
    <Select value={version} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full border-none bg-bpim-bg/50 text-bpim-text focus:ring-blue-500 sm:w-40">
        <SelectValue placeholder={t("rivals.version.label")} />
      </SelectTrigger>
      <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
        {versionsNonDisabledCollection.map((v) => (
          <SelectItem key={v.value} value={v.value} className="text-xs">
            {v.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default VersionSelect;
