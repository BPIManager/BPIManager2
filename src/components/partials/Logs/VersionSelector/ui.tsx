"use client";

import { useRouter } from "next/router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { versionsNonDisabledCollection } from "@/constants/versions";

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
      <div className="flex flex-col gap-1.5 min-w-full md:min-w-[240px]">
        <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          Version
        </label>
        <Select value={version} onValueChange={handleVersionChange}>
          <SelectTrigger className="h-9 border-bpim-border bg-bpim-bg text-slate-200 focus:ring-blue-500">
            <SelectValue placeholder="バージョンを選択" />
          </SelectTrigger>
          <SelectContent className="border-bpim-border bg-bpim-bg text-slate-200">
            {versionsNonDisabledCollection.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 max-w-full md:max-w-[400px]">
        <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          Group By
        </label>
        <Tabs
          value={groupedBy}
          onValueChange={handleGroupChange}
          className="w-full"
        >
          <TabsList className="grid h-9 w-full grid-cols-2 border border-bpim-border bg-bpim-bg p-1">
            <TabsTrigger
              value="lastPlayed"
              className="text-xs font-bold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              プレイ日単位
            </TabsTrigger>
            <TabsTrigger
              value="createdAt"
              className="text-xs font-bold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              インポート日単位
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};
