"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AppTabsGroup } from "@/components/ui/complex/tabs";
import { useTranslation } from "@/hooks/common/useTranslation";
import SongHistoryTab from "./SongHistoryTab";

interface SongHistoryPanelProps {
  songId: number;
  notes?: number;
  /** 他ユーザーのページから開いた場合の表示対象。指定時は「相手 / 自分」の内部タブで履歴を切り替える */
  subjectUser?: { userId: string; userName: string };
}

const SongHistoryPanel = ({
  songId,
  notes,
  subjectUser,
}: SongHistoryPanelProps) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"subject" | "me">("subject");

  if (!subjectUser) return <SongHistoryTab songId={songId} notes={notes} />;

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "subject" | "me")}>
      <div className="flex flex-col gap-4">
        <AppTabsGroup
          visual="flat"
          tabs={[
            {
              value: "subject",
              label: subjectUser.userName || t("dashboard.rival"),
            },
            { value: "me", label: t("common.you") },
          ]}
        />
        <TabsContent value="subject" className="mt-0">
          <SongHistoryTab
            songId={songId}
            notes={notes}
            userId={subjectUser.userId}
          />
        </TabsContent>
        <TabsContent value="me" className="mt-0">
          <SongHistoryTab songId={songId} notes={notes} />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default SongHistoryPanel;
