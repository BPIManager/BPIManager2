import { PageContainer, PageHeader } from "../../Header";
import dayjs from "@/lib/dayjs";
import { LogsDetailContent } from "./content";

export interface LogsDetailViewProps {
  userId: string | undefined;
  version: string | undefined;
  batchId?: string;
  date?: string;
  type: "batch" | "daily" | "weekly" | "monthly";
  isPublicPage?: boolean;
}

export const LogsDetailView = (props: LogsDetailViewProps) => {
  const pageTitle =
    props.type === "daily"
      ? dayjs(props.date).tz().format("YYYY年M月D日のまとめ")
      : "更新の詳細";

  const pageDescription =
    props.type === "daily" ? "一日の成果を統合して表示しています" : "";

  return (
    <div className="flex flex-col w-full min-h-screen bg-bpim-bg">
      <PageHeader title={pageTitle} description={pageDescription} />

      <PageContainer>
        <LogsDetailContent {...props} />
      </PageContainer>
    </div>
  );
};
