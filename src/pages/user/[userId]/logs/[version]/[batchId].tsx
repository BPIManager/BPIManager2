import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { DashboardLayout } from "@/components/partials/Main";
import { LogsDetailView } from "@/components/partials/Logs/LogsDetail/ui";

export default function BatchLogsPage() {
  const router = useRouter();
  const { fbUser } = useUser();
  const { version, batchId } = router.query;

  return (
    <DashboardLayout>
      <LogsDetailView
        type="batch"
        userId={fbUser?.uid}
        version={version as string}
        batchId={batchId as string}
      />
    </DashboardLayout>
  );
}
