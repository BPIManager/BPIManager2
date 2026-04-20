import { DashboardLayout } from "@/components/partials/Main";
import { Meta } from "@/components/partials/Head";
import { useUser } from "@/contexts/users/UserContext";
import { AAATableContent } from "@/components/partials/Metrics/AAATable";

export default function GlobalAAATablePage() {
  const { fbUser, isLoading } = useUser();

  return (
    <DashboardLayout>
      <Meta
        title="AAA達成難易度表"
        description="BPIを用いたbeatmania IIDXのAAA、MAX-難易度表です。自分のスコアを入れてAAA達成状況をチェックできます。"
      />

      {isLoading ? null : <AAATableContent userId={fbUser ? fbUser.uid : ""} />}
    </DashboardLayout>
  );
}
