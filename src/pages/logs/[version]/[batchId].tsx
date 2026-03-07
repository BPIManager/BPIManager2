import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { Meta } from "@/components/partials/Head";
import { DashboardLayout } from "@/components/partials/Main";
import { BatchDetailView } from "@/components/partials/Logs/LogsDetail/ui";

export default function LogsPage() {
  const router = useRouter();
  const { fbUser } = useUser();

  const version = (router.query.version as string) || undefined;
  const batchId = (router.query.batchId as string) || undefined;

  return (
    <DashboardLayout>
      <Meta title="更新ログ" noIndex />

      <BatchDetailView
        userId={fbUser?.uid}
        version={version}
        batchId={batchId}
      />
    </DashboardLayout>
  );
}
