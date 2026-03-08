import { LogsDetailView } from "@/components/partials/Logs/LogsDetail/ui";
import { DashboardLayout } from "@/components/partials/Main";
import { useUser } from "@/contexts/users/UserContext";
import { useRouter } from "next/router";

export default function DailyLogsPage() {
  const router = useRouter();
  const { fbUser } = useUser();
  const { version, date } = router.query;

  return (
    <DashboardLayout>
      <LogsDetailView
        type="daily"
        userId={fbUser?.uid}
        version={version as string}
        date={date as string}
      />
    </DashboardLayout>
  );
}
