import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { ReusableMenuItem } from "@/components/partials/Metrics/Menu/ui";
import { Swords, Table } from "lucide-react";
import { latestVersion } from "@/constants/latestVersion";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="指標"
        description="IIDXに関する指標データを閲覧できます。"
      />
      <Meta
        title="指標"
        description="アリーナ平均やAAA達成難易度表など、IIDXスコアに関する指標データを閲覧できます。"
      />

      <PageContainer>
        <ReusableMenuItem
          href="/metrics/AAADifficultyTable"
          icon={Table}
          title="AAA達成難易度表"
          subtitle={
            <>
              BPIに基づくAAA達成難易度・MAX-達成難易度表と達成状況を表示します。
            </>
          }
          iconColor="blue.400"
        />
        <ReusableMenuItem
          mt={4}
          href={
            "/metrics/arenaAverage/" +
            String(Number(latestVersion) - 1) +
            "?difficultyLevel=12"
          }
          icon={Swords}
          title="アリーナランク平均"
          subtitle={
            <>
              BPIMに登録しているユーザーのデータをもとに、アリーナランク平均を算出し表示します。
              <br />
              (実際の平均値とは若干の乖離がある可能性があります)
              <br />
              ※移行期間中はBPIMのデータに基づき表示します
            </>
          }
          iconColor="blue.400"
        />
      </PageContainer>
    </DashboardLayout>
  );
}
