import { PageContainer, PageHeader } from "../../Header";
import dayjs from "@/lib/dayjs";
import { LogsDetailContent } from "./content";

export interface LogsDetailViewProps {
  userId: string | undefined;
  version: string | undefined;
  batchId?: string;
  date?: string;
  type: "batch" | "daily" | "weekly" | "monthly";
}

export const LogsDetailView = (props: LogsDetailViewProps) => {
  const pageTitle =
    props.type === "daily"
      ? dayjs(props.date).tz().format("YYYY年M月D日のまとめ")
      : "更新の詳細";

  return (
    <>
      <PageHeader
        title={pageTitle}
        description={
          props.type === "daily" ? "一日の成果を統合して表示しています" : ""
        }
      />
      <PageContainer>
        <LogsDetailContent {...props} />
      </PageContainer>
    </>
  );
};
