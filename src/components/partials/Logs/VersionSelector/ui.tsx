"use client";

import { useRouter } from "next/router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { versionsNonDisabledCollection } from "@/constants/versions";
import { AppTabsGroup } from "@/components/ui/complex/tabs";

interface Props {
  version: string;
  groupedBy: string;
}

export const LogFilterSection = ({ version, groupedBy }: Props) => {
  const router = useRouter();
  const { userId } = router.query;

  const handleVersionChange = (nextVersion: string) => {
    if (!nextVersion) return;
    router.push(
      {
        pathname: `/users/${userId as string}/logs/${nextVersion}`,
        query: { groupedBy },
      },
      undefined,
      { shallow: true },
    );
  };

  const handleGroupChange = (nextGroup: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, groupedBy: nextGroup },
      },
      undefined,
      { shallow: true },
    );
  };

  return (
    <div className="flex w-full flex-col items-stretch gap-4 md:flex-row md:items-end md:gap-6">
      <div className="flex flex-col gap-1.5 min-w-full md:min-w-60">
        <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
          Version
        </label>
        <Select value={version} onValueChange={handleVersionChange}>
          <SelectTrigger className="h-9 border-bpim-border bg-bpim-bg text-bpim-text focus:ring-blue-500">
            <SelectValue placeholder="バージョンを選択" />
          </SelectTrigger>
          <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
            {versionsNonDisabledCollection.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 max-w-full md:max-w-[400px]">
        <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
          Group By
        </label>
        <Tabs
          value={groupedBy}
          onValueChange={handleGroupChange}
          className="w-full"
        >
            <AppTabsGroup
              visual="flat"
              tabs={[
                { value: "lastPlayed", label: "プレイ日単位" },
                { value: "createdAt", label: "インポート日単位" },
              ]}
            />
        </Tabs>
      </div>
    </div>
  );
};
