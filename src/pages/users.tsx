import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { ReusableMenuItem } from "@/components/partials/Metrics/Menu/ui";
import { Swords, Table } from "lucide-react";
import { latestVersion } from "@/constants/latestVersion";
import { UserRecommendationList } from "@/components/partials/UserList";
import { FormSelect } from "@/components/ui/select";
import { Box, createListCollection } from "@chakra-ui/react";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="ライバルを探す"
        description="実力が近いユーザーをライバル登録してスコアを競えます"
      />
      <Meta
        title="ライバルを探す"
        description="アリーナ平均やAAA達成難易度表など、IIDXスコアに関する指標データを閲覧できます。"
        noIndex
      />

      <PageContainer>
        <Box mb={4}>
          <FormSelect
            collection={createListCollection({
              items: [{ label: "総合BPIが近い人", value: "totalBpi" }],
            })}
            value={"totalBpi"}
            onValueChange={() => null}
            size="sm"
            variant="subtle"
          />
        </Box>
        <UserRecommendationList />
      </PageContainer>
    </DashboardLayout>
  );
}
