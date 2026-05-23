import { PageContainer, PageHeader } from "../../Header";
import dayjs from "@/lib/dayjs";
import { LogsDetailContent } from "./content";
import type { LogsDetailViewProps } from "@/types/logs/detail";
import { getVersionNameFromNumber } from "@/constants/versions";

export const LogsDetailView = (props: LogsDetailViewProps) => {
  const pageTitle = (() => {
    if (props.type === "daily")
      return dayjs(props.date).tz().format("YYYY年M月D日のまとめ");
    if (props.type === "weekly") {
      const d = dayjs(props.date).tz();
      return `${d.startOf("isoWeek").format("YYYY年M月D日")}〜${d.endOf("isoWeek").format("M月D日")}のまとめ`;
    }
    if (props.type === "monthly")
      return dayjs(props.date).tz().format("YYYY年M月のまとめ");
    if (props.type === "version")
      return `${getVersionNameFromNumber(props.version ?? "")} のバージョン比較`;
    return "更新の詳細";
  })();

  const pageDescription = (() => {
    if (props.type === "daily") return "一日の成果を統合して表示しています";
    if (props.type === "weekly") return "一週間の成果を統合して表示しています";
    if (props.type === "monthly") return "一ヶ月の成果を統合して表示しています";
    if (props.type === "version") return "前作との比較を表示しています";
    return "";
  })();

  return (
    <div className="flex flex-col w-full min-h-screen bg-bpim-bg">
      <PageHeader title={pageTitle} description={pageDescription} />

      <PageContainer>
        <LogsDetailContent {...props} />
      </PageContainer>
    </div>
  );
};
