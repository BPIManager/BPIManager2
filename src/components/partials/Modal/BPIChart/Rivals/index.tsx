"use client";

import { useState } from "react";
import { SongWithScore } from "@/types/songs/score";
import { RivalRankingBody, GlobalRankingBody } from "./ui";
import { latestVersion } from "@/constants/latestVersion";
import { versionsNonDisabledCollection } from "@/constants/versions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AppTabsGroup } from "@/components/ui/complex/tabs";
import { RivalComparisonModal } from "@/components/partials/UserList/Modal";
import { useRadar } from "@/hooks/stats/useRadar";
import { useUser } from "@/contexts/users/UserContext";

export default function RivalsRanking({ song }: { song: SongWithScore }) {
  const { fbUser } = useUser();
  const [version, setVersion] = useState<string>(latestVersion);
  const [tab, setTab] = useState<"rivals" | "global">("rivals");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { radar: viewerRadar } = useRadar(fbUser?.uid, [], [], version);

  const handleNavigate = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-bpim-border bg-bpim-bg/40 p-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
            Version
          </label>
          <Select value={version} onValueChange={setVersion}>
            <SelectTrigger className="w-full h-8 border-bpim-border bg-bpim-bg/20 text-xs text-bpim-text focus:ring-blue-500">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent className="border-bpim-border bg-bpim-bg">
              {versionsNonDisabledCollection.map((v) => (
                <SelectItem key={v.value} value={v.value} className="text-xs">
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "rivals" | "global")}>
        <AppTabsGroup
          visual="flat"
          tabs={[
            { value: "rivals", label: "ライバル内" },
            { value: "global", label: "グローバル" },
          ]}
        />

        <TabsContent value="rivals" className="mt-4">
          <RivalRankingBody
            songId={song.songId}
            version={version}
            myScore={song}
            onNavigate={handleNavigate}
          />
        </TabsContent>

        <TabsContent value="global" className="mt-4">
          <GlobalRankingBody
            songId={song.songId}
            version={version}
            myScore={song}
            onNavigate={handleNavigate}
          />
        </TabsContent>
      </Tabs>

      {selectedUserId && (
        <RivalComparisonModal
          rivalId={selectedUserId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          viewerRadar={viewerRadar ?? {}}
        />
      )}
    </div>
  );
}
