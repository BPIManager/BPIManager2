import { PageContainer, PageHeader } from "../../Header";
import dayjs from "@/lib/dayjs";
import { LogsDetailContent } from "./content";
import type { LogsDetailViewProps } from "@/types/logs/detail";
import { getVersionNameFromNumber } from "@/constants/versions";
import { useTranslation } from "@/hooks/common/useTranslation";

export const LogsDetailView = (props: LogsDetailViewProps) => {
  const { t } = useTranslation();

  const pageTitle = (() => {
    const suffix = t("logs.detail.titleSuffix.summary");
    if (props.type === "daily")
      return dayjs(props.date).tz().format(t("logs.detail.dateFormat.daily")) + suffix;
    if (props.type === "weekly") {
      const d = dayjs(props.date).tz();
      const start = d.startOf("isoWeek").format(t("logs.detail.dateFormat.weekStart"));
      const end = d.endOf("isoWeek").format(t("logs.detail.dateFormat.weekEnd"));
      return `${start}${t("logs.detail.weekSeparator")}${end}${suffix}`;
    }
    if (props.type === "monthly")
      return dayjs(props.date).tz().format(t("logs.detail.dateFormat.monthly")) + suffix;
    if (props.type === "version")
      return `${getVersionNameFromNumber(props.version ?? "")}${t("logs.detail.titleSuffix.version")}`;
    return t("logs.detail.title.default");
  })();

  const pageDescription = (() => {
    if (props.type === "daily") return t("logs.detail.desc.daily");
    if (props.type === "weekly") return t("logs.detail.desc.weekly");
    if (props.type === "monthly") return t("logs.detail.desc.monthly");
    if (props.type === "version") return t("logs.detail.desc.version");
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
