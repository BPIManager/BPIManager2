import { DashboardLayout } from "@/components/partials/Main";
import { PageContainer } from "@/components/partials/Header";
import { Meta } from "@/components/partials/Head";
import { useUser } from "@/contexts/users/UserContext";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { AAATableContent } from "@/components/partials/Metrics/AAATable";

export default function GlobalAAATablePage() {
  const { fbUser, isLoading } = useUser();

  return (
    <DashboardLayout>
      <Meta title="AAA達成難易度表" />

      <PageContainer>
        {isLoading ? null : !fbUser ? (
          <LoginRequiredCard />
        ) : (
          <AAATableContent userId={fbUser.uid} />
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
